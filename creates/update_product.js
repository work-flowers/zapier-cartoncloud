const perform = async (z, bundle) => {
  const { tenant_id, unit_of_measure } = bundle.inputData;

  // Resolve the product UUID. The PATCH endpoint needs the UUID in its URL, but
  // callers often only have the reference code (SKU) on hand, so accept either
  // and look the code up client-side (the list endpoint has no code filter).
  let product_id = (bundle.inputData.product_id || '').trim();
  const productCode = (bundle.inputData.product_code || '').trim();

  // Holds the full product record once we've fetched it, so the default
  // unit-of-measure fallback can reuse it instead of fetching twice.
  let product = null;

  if (!product_id && !productCode) {
    return {
      success: false,
      error:
        'Supply either Product ID (UUID) or Product Code (SKU) to identify the product.',
      status: 400,
    };
  }

  if (!product_id) {
    const listResponse = await z.request({
      url: `https://api.cartoncloud.com/tenants/${tenant_id}/warehouse-products`,
      method: 'GET',
      headers: {
        'Accept-Version': '1',
        Authorization: `Bearer ${bundle.authData.access_token}`,
      },
      skipThrowForStatus: true,
    });

    if (listResponse.status >= 400) {
      const data = listResponse.json || {};
      return {
        success: false,
        error:
          data.message ||
          data.error ||
          listResponse.content ||
          `Failed to list products (status ${listResponse.status})`,
        status: listResponse.status,
        details: data,
      };
    }

    const products = Array.isArray(listResponse.json) ? listResponse.json : [];
    const wanted = productCode.toLowerCase();
    const matches = products.filter(
      (p) => ((p.references && p.references.code) || '').toLowerCase() === wanted,
    );

    if (matches.length === 0) {
      return {
        success: false,
        error: `No product found with code "${productCode}" in tenant ${tenant_id}.`,
        status: 404,
      };
    }
    if (matches.length > 1) {
      return {
        success: false,
        error: `Multiple products (${matches.length}) found with code "${productCode}"; specify Product ID (UUID) instead.`,
        status: 400,
      };
    }

    product = matches[0];
    product_id = product.id;
  }

  // CartonCloud's Partial Product Update uses JSON Patch (RFC 6902): an array
  // of operations. We build one `replace` op per supplied input so a Notion
  // trigger can push just the field(s) that changed.
  const ops = [];

  // Product-level fields
  if (bundle.inputData.name) {
    ops.push({ op: 'replace', path: '/name', value: bundle.inputData.name });
  }

  // Unit-of-measure fields all live under /unitOfMeasures/{code}/... and so
  // require a target unit code to know which UoM to patch.
  const uomFields = [
    { key: 'weight', path: 'weight', numeric: true },
    { key: 'volume', path: 'volume', numeric: true },
    { key: 'base_qty', path: 'baseQty', numeric: true },
    { key: 'barcode', path: 'barcode', numeric: false },
  ];

  const uomUpdates = uomFields.filter((f) => {
    const v = bundle.inputData[f.key];
    return v !== undefined && v !== null && v !== '';
  });

  if (uomUpdates.length > 0) {
    // Target the supplied UoM code, or fall back to the product's default unit
    // of measure when none is given (the common single-UoM case).
    let effectiveUom = (unit_of_measure || '').trim();

    if (!effectiveUom) {
      // Fetch the product if we don't already have it (UUID path), so we can
      // read its defaultUnitOfMeasure.
      if (!product) {
        const productResponse = await z.request({
          url: `https://api.cartoncloud.com/tenants/${tenant_id}/warehouse-products/${product_id}`,
          method: 'GET',
          headers: {
            'Accept-Version': '1',
            Authorization: `Bearer ${bundle.authData.access_token}`,
          },
          skipThrowForStatus: true,
        });

        if (productResponse.status >= 400) {
          const data = productResponse.json || {};
          return {
            success: false,
            error:
              data.message ||
              data.error ||
              productResponse.content ||
              `Failed to fetch product (status ${productResponse.status})`,
            status: productResponse.status,
            details: data,
          };
        }

        product = productResponse.json || {};
      }

      effectiveUom = product.defaultUnitOfMeasure;

      if (!effectiveUom) {
        return {
          success: false,
          error:
            'No Unit of Measure Code was supplied and the product has no default unit of measure to fall back to.',
          status: 400,
        };
      }
    }

    for (const f of uomUpdates) {
      const raw = bundle.inputData[f.key];
      ops.push({
        op: 'replace',
        path: `/unitOfMeasures/${effectiveUom}/${f.path}`,
        value: f.numeric ? parseFloat(raw) : raw,
      });
    }
  }

  if (ops.length === 0) {
    return {
      success: false,
      error:
        'No update fields provided. Supply at least one of: name, weight, volume, base_qty, barcode.',
      status: 400,
    };
  }

  const options = {
    url: `https://api.cartoncloud.com/tenants/${tenant_id}/warehouse-products/${product_id}`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Accept-Version': '1',
      Authorization: `Bearer ${bundle.authData.access_token}`,
    },
    // Serialise ourselves so the JSON Patch array is sent verbatim.
    body: JSON.stringify(ops),
    skipThrowForStatus: true,
  };

  const response = await z.request(options);

  if (response.status >= 400) {
    const data = response.json || {};
    const message =
      data.message ||
      data.error ||
      // CartonCloud validation errors come back as a top-level array of
      // { field, message } objects.
      (Array.isArray(data)
        ? data
            .map((e) =>
              e.field ? `${e.field}: ${e.message}` : e.message || JSON.stringify(e),
            )
            .join('; ')
        : null) ||
      (Array.isArray(data.errors)
        ? data.errors.map((e) => e.message || JSON.stringify(e)).join('; ')
        : null) ||
      response.content ||
      `Request failed with status ${response.status}`;

    return {
      success: false,
      error: message,
      status: response.status,
      details: data,
    };
  }

  return { success: true, ...response.json };
};

module.exports = {
  operation: {
    perform: perform,
    inputFields: [
      {
        key: 'tenant_id',
        label: 'Tenant ID',
        type: 'string',
        dynamic: 'new_tenant.id.Tenant',
        helpText:
          'CartonCloud tenant ID (UUID) the product belongs to. Call the New Tenant tool first if unknown.',
        required: true,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'product_id',
        label: 'Product ID',
        type: 'string',
        dynamic: 'new_product.id.label',
        helpText:
          'CartonCloud internal product ID (UUID). Pick from the dropdown (populated once a Tenant is selected) or supply the UUID from Get Product. Optional if you provide Product Code instead; takes precedence over Product Code when both are given.',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'product_code',
        label: 'Product Code (SKU)',
        type: 'string',
        helpText:
          'Product reference code / SKU (e.g. "COCI1001"), used to look up the product when you do not have its UUID. Resolved to a single product within the tenant (case-insensitive exact match). Ignored if Product ID is provided. Either Product ID or Product Code is required.',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'unit_of_measure',
        label: 'Unit of Measure Code',
        type: 'string',
        helpText:
          'The unit-of-measure code to update (e.g. "CTN", "EACH"), as shown under unitOfMeasures on the product (see Get Product). Applies to Weight, Volume, Base Quantity, and Barcode. Leave blank to use the product\'s default unit of measure (the usual choice for single-unit products).',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'weight',
        label: 'Weight',
        type: 'number',
        helpText:
          'New weight for the selected unit of measure, in the tenant\'s configured weight unit (e.g. kg). Requires Unit of Measure Code. Leave blank to keep unchanged.',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'volume',
        label: 'Volume',
        type: 'number',
        helpText:
          'New volume for the selected unit of measure. Requires Unit of Measure Code. Leave blank to keep unchanged.',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'base_qty',
        label: 'Base Quantity',
        type: 'number',
        helpText:
          'New base quantity (number of base units this UoM represents) for the selected unit of measure. Requires Unit of Measure Code. Leave blank to keep unchanged.',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'barcode',
        label: 'Barcode',
        type: 'string',
        helpText:
          'New barcode for the selected unit of measure. Requires Unit of Measure Code. Leave blank to keep unchanged.',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'name',
        label: 'Product Name',
        type: 'string',
        helpText:
          'New product name. Leave blank to keep unchanged. Applies to the product itself, not a unit of measure.',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
    ],
  },
  display: {
    description:
      'Updates an existing CartonCloud warehouse product, identified by either its internal product ID (UUID) or its reference code / SKU, pushing changed attributes such as a unit of measure\'s weight, volume, base quantity, or barcode, and/or the product name. Built for syncing product config (e.g. weights/units) from an external source of truth like Notion. When only a code is given it is resolved to a single product within the tenant. Sends a JSON Patch (replace) per supplied field; unit-of-measure fields require the Unit of Measure Code. Supply at least one field to change — calls with nothing to update, an unresolvable/ambiguous code, or a disallowed status return a structured error rather than throw. Returns { success: true, ...product } with the updated product on success.',
    hidden: false,
    label: 'Update Product',
  },
  key: 'update_product',
  noun: 'Product',
};

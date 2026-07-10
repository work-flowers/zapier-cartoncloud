const perform = async (z, bundle) => {
  const {
    tenant_id,
    customer,
    product_code,
    name,
    type,
    unit_of_measure,
    unit_name,
    barcode,
    description,
    expiry_requirement,
  } = bundle.inputData;

  // The new product's single unit of measure. CartonCloud requires every unit
  // to carry a baseQty; the unit code doubles as defaultUnitOfMeasure. (Mirrors
  // Update Product's single-UoM model — multi-tier UoMs can be added later.)
  const uom = {
    baseQty:
      bundle.inputData.base_qty !== undefined &&
      bundle.inputData.base_qty !== null &&
      bundle.inputData.base_qty !== ''
        ? parseFloat(bundle.inputData.base_qty)
        : 1,
  };
  if (unit_name) uom.name = unit_name;
  if (
    bundle.inputData.weight !== undefined &&
    bundle.inputData.weight !== null &&
    bundle.inputData.weight !== ''
  ) {
    uom.weight = parseFloat(bundle.inputData.weight);
  }
  if (
    bundle.inputData.volume !== undefined &&
    bundle.inputData.volume !== null &&
    bundle.inputData.volume !== ''
  ) {
    uom.volume = parseFloat(bundle.inputData.volume);
  }
  if (barcode) uom.barcode = barcode;

  const body = {
    scope: 'WAREHOUSE',
    type: type,
    references: { code: product_code },
    name: name,
    customer: { id: customer },
    defaultUnitOfMeasure: unit_of_measure,
    unitOfMeasures: { [unit_of_measure]: uom },
    details: {
      active:
        bundle.inputData.active === undefined || bundle.inputData.active === ''
          ? true
          : bundle.inputData.active === true ||
            bundle.inputData.active === 'true',
      variableWeight:
        bundle.inputData.variable_weight === true ||
        bundle.inputData.variable_weight === 'true',
    },
  };

  if (description) body.description = description;
  if (expiry_requirement) {
    body.itemPropertyRequirements = { expiry: expiry_requirement };
  }

  const options = {
    url: `https://api.cartoncloud.com/tenants/${tenant_id}/warehouse-products`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept-Version': '1',
      Authorization: `Bearer ${bundle.authData.access_token}`,
    },
    body: body,
    skipThrowForStatus: true,
  };

  const response = await z.request(options);

  if (response.status >= 400) {
    const data = response.json || {};
    const message =
      data.message ||
      data.error ||
      // CartonCloud validation errors come back as a top-level array of
      // { field, message } objects (e.g. duplicate code, invalid customer).
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
          'CartonCloud tenant ID (UUID) the product will be created under. Call the New Tenant tool first if unknown.',
        required: true,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'customer',
        label: 'Customer ID',
        type: 'string',
        dynamic: 'new_customer.id.name',
        helpText:
          'CartonCloud customer ID (UUID) the product belongs to. Obtain via the New Customer tool.',
        required: true,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'product_code',
        label: 'Product Code (SKU)',
        type: 'string',
        helpText:
          'Product reference code / SKU (e.g. "COCI1001"). Becomes the product\'s references.code and must be unique within the tenant.',
        required: true,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'name',
        label: 'Product Name',
        type: 'string',
        helpText: 'Short product name shown throughout CartonCloud.',
        required: true,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'type',
        label: 'Product Type',
        type: 'string',
        default: 'General',
        helpText:
          'Product type, as configured for the tenant (e.g. "General", "FROZEN"). Defaults to "General".',
        required: true,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'unit_of_measure',
        label: 'Unit of Measure Code',
        type: 'string',
        helpText:
          'Code for the product\'s base unit of measure (e.g. "CTN", "EACH"). Used both as the unit key and as the product\'s default unit of measure.',
        required: true,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'unit_name',
        label: 'Unit of Measure Name',
        type: 'string',
        helpText:
          'Optional human-readable label for the unit of measure (e.g. "Carton"). Defaults to the code if omitted.',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'base_qty',
        label: 'Base Quantity',
        type: 'number',
        default: '1',
        helpText:
          'Number of base units this unit of measure represents. Defaults to 1 (single-unit product).',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'weight',
        label: 'Weight',
        type: 'number',
        helpText:
          'Optional weight for the unit of measure, in the tenant\'s configured weight unit (e.g. kg).',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'volume',
        label: 'Volume',
        type: 'number',
        helpText: 'Optional volume for the unit of measure.',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'barcode',
        label: 'Barcode',
        type: 'string',
        helpText:
          'Optional barcode for the unit of measure. Defaults to the product code if omitted.',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'description',
        label: 'Description',
        type: 'text',
        helpText: 'Optional longer product description.',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'expiry_requirement',
        label: 'Expiry Requirement',
        type: 'string',
        choices: ['OPTIONAL', 'REQUIRED'],
        helpText:
          'Optional. Whether an expiry date is OPTIONAL or REQUIRED when receiving stock for this product. Leave blank to use the tenant default.',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'active',
        label: 'Active',
        type: 'boolean',
        default: 'true',
        helpText: 'Whether the product is active. Defaults to true.',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'variable_weight',
        label: 'Variable Weight',
        type: 'boolean',
        default: 'false',
        helpText:
          'Whether this is a catch/variable-weight product whose actual weight is captured per item at receipt. Defaults to false.',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
    ],
  },
  display: {
    description:
      'Creates a warehouse product for a customer, with a reference code (SKU), name, type, and base unit of measure.',
    hidden: false,
    label: 'Add Product',
  },
  key: 'add_product',
  noun: 'Product',
};

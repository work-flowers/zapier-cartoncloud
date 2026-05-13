const perform = async (z, bundle) => {
  // Build items array from line item inputs
  const items = [];
  const productCodes = bundle.inputData.product_code || [];
  const quantities = bundle.inputData.quantity || [];

  for (let i = 0; i < productCodes.length; i++) {
    items.push({
      details: {
        product: {
          references: {
            code: productCodes[i],
          },
        },
      },
      measures: {
        quantity: parseFloat(quantities[i]) || 1,
      },
    });
  }

  // Build address object
  const address = {
    companyName: bundle.inputData.address_company || '',
    contactName: bundle.inputData.address_contact || '',
    address1: bundle.inputData.address_street, // was street1
    city: bundle.inputData.address_city,
    postcode: bundle.inputData.address_postcode,
    state: {
      code: bundle.inputData.address_state_code || '',
    },
    country: {
      iso2Code: bundle.inputData.address_country_iso2 || '',
    },
  };

  // Optional fields
  if (bundle.inputData.address_street_2) {
    address.address2 = bundle.inputData.address_street_2; // was street2
  }

  if (bundle.inputData.address_email) {
    address.email = bundle.inputData.address_email;
  }

  // Build deliver object
  const deliver = {
    address: address,
    instructions: bundle.inputData.delivery_instructions || '',
    method: {
      type: bundle.inputData.delivery_method_type,
    },
  };

  // Only add requiredDate if provided — extract YYYY-MM-DD if full datetime is passed
  if (bundle.inputData.required_date) {
    const dateMatch =
      bundle.inputData.required_date.match(/^(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      deliver.requiredDate = dateMatch[1];
    }
  }

  // Build main body
  const body = {
    references: {
      customer: bundle.inputData.order_reference,
    },
    customer: {
      id: bundle.inputData.customer,
    },
    details: {
      urgent:
        bundle.inputData.urgent === 'true' || bundle.inputData.urgent === true,
      instructions: bundle.inputData.packing_instructions || '',
      deliver: deliver,
    },
    items: items,
  };

  // Only add warehouse if provided
  if (bundle.inputData.warehouse) {
    body.warehouse = { id: bundle.inputData.warehouse };
  }

  // Only add collect.requiredDate if provided — extract YYYY-MM-DD if full datetime is passed
  if (bundle.inputData.required_ship_date) {
    const shipDateMatch =
      bundle.inputData.required_ship_date.match(/^(\d{4}-\d{2}-\d{2})/);
    if (shipDateMatch) {
      body.details.collect = {
        requiredDate: shipDateMatch[1],
      };
    }
  }

  const options = {
    url: `https://api.cartoncloud.com/tenants/${bundle.inputData.tenant_id}/outbound-orders`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept-Version': '1',
      Authorization: `Bearer ${bundle.authData.access_token}`,
    },
    body: body,
  };

  return z.request(options).then((response) => {
    return response.json;
  });
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
          'CartonCloud tenant ID (UUID) the order will be created under. Call the New Tenant tool first if unknown.',
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
          'Optional CartonCloud customer ID (UUID) this order is for. Obtain via the New Customer tool. Omit to create the order without an associated customer.',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'order_reference',
        label: 'Order Reference',
        type: 'string',
        helpText:
          "Required external order reference (string), e.g. the order number from the caller's source system. Shown on warehouse documents and used as a human-readable lookup key.",
        required: true,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'warehouse',
        label: 'Warehouse',
        type: 'string',
        helpText:
          "Optional warehouse code (string) identifying the fulfilment warehouse. Omit to use the tenant's default warehouse.",
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'delivery_method_type',
        label: 'Delivery Method',
        type: 'string',
        default: 'PICKUP',
        choices: ['SHIPPING', 'PICKUP'],
        helpText:
          'Required. One of "PICKUP" (customer collects from warehouse) or "SHIPPING" (warehouse arranges delivery). Defaults to PICKUP.',
        required: true,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'address_street',
        label: 'Street Address 1',
        type: 'string',
        helpText:
          'Required. Street address line 1 (e.g. "123 Main St") for the delivery or pickup location.',
        required: true,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'address_street_2',
        label: 'Street Address 2',
        type: 'string',
        helpText: 'Optional street address line 2 (unit, suite, floor, etc.).',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'address_city',
        label: 'City',
        type: 'string',
        helpText: 'Required. Delivery city or suburb.',
        required: true,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'address_state_code',
        label: 'State Code',
        type: 'string',
        helpText:
          'Required. State or region code in the destination country (e.g. "NSW", "VIC" for AU; "CA", "NY" for US).',
        required: true,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'address_postcode',
        label: 'Postcode',
        type: 'string',
        helpText: 'Required. Postcode or ZIP for the delivery address.',
        required: true,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'address_country_iso2',
        label: 'Country Code (ISO2)',
        type: 'string',
        choices: ['AU'],
        helpText:
          'Optional ISO 3166-1 alpha-2 country code (e.g. "AU"). Currently only "AU" is accepted. Omit to use the tenant default.',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'urgent',
        label: 'Urgent',
        type: 'boolean',
        helpText:
          'Optional boolean. Set true to flag the order as urgent and prioritise it during picking. Defaults to false.',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'packing_instructions',
        label: 'Packing Instructions',
        type: 'string',
        helpText:
          'Optional free-text instructions for warehouse staff about how to pack this order. Visible on internal pick/pack documents.',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'delivery_instructions',
        label: 'Delivery Instructions',
        type: 'string',
        helpText:
          'Optional free-text instructions for the driver or shipping carrier (e.g. "leave at back door"). Surfaced on delivery documents.',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'required_date',
        label: 'Required Date',
        type: 'datetime',
        helpText:
          'Optional ISO 8601 datetime by which the order must ship or be ready (e.g. "2026-05-20T17:00:00Z").',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'address_company',
        label: 'Company',
        type: 'string',
        helpText: 'Optional company/business name at the delivery address.',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'address_contact',
        label: 'Contact Name',
        type: 'string',
        helpText: 'Optional name of the contact person at the delivery address.',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'address_email',
        label: 'Email',
        type: 'string',
        helpText: 'Optional email address for the delivery contact (used for shipping notifications).',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'product_code',
        label: 'Product Code (SKU)',
        type: 'string',
        helpText:
          'Required array of product SKU strings, one per line item. MUST be the same length as Quantity, with matching index positions — product_code[0] pairs with quantity[0], etc.',
        required: true,
        list: true,
        altersDynamicFields: false,
      },
      {
        key: 'quantity',
        label: 'Quantity',
        type: 'integer',
        helpText:
          'Required array of positive integers, one per line item. MUST be the same length as Product Code (SKU) and aligned by index — quantity[0] is the quantity of product_code[0], etc.',
        required: true,
        list: true,
        altersDynamicFields: false,
      },
    ],
  },
  display: {
      description:
        'Creates a new outbound (sales) order in CartonCloud with a delivery address and one or more line items, then returns the created order including its ID and reference. Required: tenant_id, order_reference, delivery_method_type, full delivery address (street, city, state code, postcode), and parallel product_code/quantity arrays (one entry per line item, aligned by index). Customer is optional but recommended for billing/reporting. Use the Get Outbound Order tool afterwards if the caller needs the full server-side representation.',
    hidden: false,
    label: 'Create Outbound Order',
  },
  key: 'create_outbound_order',
  noun: 'Outbound Order',
};

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
        required: true,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'customer',
        label: 'Customer ID',
        type: 'string',
        dynamic: 'new_customer.id.name',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'order_reference',
        label: 'Order Reference',
        type: 'string',
        required: true,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'warehouse',
        label: 'Warehouse',
        type: 'string',
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
        required: true,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'address_street',
        label: 'Street Address 1',
        type: 'string',
        required: true,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'address_street_2',
        label: 'Street Address 2',
        type: 'string',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'address_city',
        label: 'City',
        type: 'string',
        required: true,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'address_state_code',
        label: 'State Code',
        type: 'string',
        required: true,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'address_postcode',
        label: 'Postcode',
        type: 'string',
        required: true,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'address_country_iso2',
        label: 'Country Code (ISO2)',
        type: 'string',
        choices: ['AU'],
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'urgent',
        label: 'Urgent',
        type: 'boolean',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'packing_instructions',
        label: 'Packing Instructions',
        type: 'string',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'delivery_instructions',
        label: 'Delivery Instructions',
        type: 'string',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'required_date',
        label: 'Required Date',
        type: 'datetime',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'address_company',
        label: 'Company',
        type: 'string',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'address_contact',
        label: 'Contact Name',
        type: 'string',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'address_email',
        label: 'Email',
        type: 'string',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'product_code',
        label: 'Product Code (SKU)',
        type: 'string',
        required: true,
        list: true,
        altersDynamicFields: false,
      },
      {
        key: 'quantity',
        label: 'Quantity',
        type: 'integer',
        required: true,
        list: true,
        altersDynamicFields: false,
      },
    ],
  },
  display: {
    description: 'Create an outbound (sales) order. ',
    hidden: false,
    label: 'Create Outbound Order',
  },
  key: 'create_outbound_order',
  noun: 'Outbound Order',
};

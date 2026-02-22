const perform = async (z, bundle) => {
  const options = {
    url: `https://api.cartoncloud.com/tenants/${bundle.inputData.tenant_id}/outbound-orders/${bundle.inputData.order_id}`,
    method: 'GET',
    headers: {
      'Accept-Version': '1',
      Authorization: `Bearer ${bundle.authData.access_token}`,
    },
    params: {},
    removeMissingValuesFrom: {
      body: false,
      params: false,
    },
  };

  return z.request(options).then((response) => {
    const results = response.json;

    // You can do any parsing you need for results here before returning them

    return results;
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
        dynamic: 'new_tenant.id',
        required: true,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'order_id',
        label: 'Order ID',
        type: 'string',
        required: true,
        list: false,
        altersDynamicFields: false,
      },
    ],
  },
  display: {
    description: 'Retrieves an outbound order using its ID. ',
    hidden: false,
    label: 'Get Outbound Order',
  },
  key: 'get_outbound_order',
  noun: 'Outbound Order',
};

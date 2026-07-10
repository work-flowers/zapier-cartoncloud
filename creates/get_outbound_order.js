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
        helpText: 'CartonCloud tenant ID (UUID) the order belongs to.',
        required: true,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'order_id',
        label: 'Order ID',
        type: 'string',
        helpText:
          "CartonCloud internal order ID (UUID). This is the `id` returned by Create Outbound Order or by the New Outbound Document trigger — NOT the human-facing order_reference.",
        required: true,
        list: false,
        altersDynamicFields: false,
      },
    ],
  },
  display: {
    description:
      'Fetches a single outbound order by its CartonCloud order ID, including delivery address, line items, and status.',
    hidden: false,
    label: 'Get Outbound Order',
  },
  key: 'get_outbound_order',
  noun: 'Outbound Order',
};

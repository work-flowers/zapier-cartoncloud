const perform = async (z, bundle) => {
  const options = {
    url: `https://api.cartoncloud.com/tenants/${bundle.inputData.tenant_id}/customers`,
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
    canPaginate: true,
    inputFields: [
      {
        key: 'tenant_id',
        type: 'string',
        label: 'Tenant ID',
        required: true,
        list: false,
        altersDynamicFields: false,
      },
    ],
  },
  display: {
    description: 'Triggers when a new customer is created',
    hidden: true,
    label: 'New Customer',
  },
  key: 'new_customer',
  noun: 'Customer',
};

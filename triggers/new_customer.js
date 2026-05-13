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
        helpText:
          'CartonCloud tenant ID (UUID). Obtain by calling the New Tenant tool first.',
        required: true,
        list: false,
        altersDynamicFields: false,
      },
    ],
  },
  display: {
    description:
      'Lists customers under a given CartonCloud tenant. Use to look up a customer ID (UUID) by name before calling Create Outbound Order or Create Report Run, both of which take a customer ID. Requires tenant_id (call the New Tenant tool first if unknown). Returns an array of customers with id and name.',
    hidden: true,
    label: 'New Customer',
  },
  key: 'new_customer',
  noun: 'Customer',
};

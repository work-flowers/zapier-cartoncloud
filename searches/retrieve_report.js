const perform = async (z, bundle) => {
  const options = {
    url: `https://api.cartoncloud.com/tenants/${bundle.authData.tenant_id}/report-runs/${bundle.inputData.report_run_id}`,
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

    return [results];
  });
};

module.exports = {
  operation: {
    perform: perform,
    inputFields: [
      {
        key: 'report_run_id',
        label: 'Report Run ID',
        type: 'string',
        helpText: 'UUID for the report run',
        required: true,
        list: false,
        altersDynamicFields: false,
      },
    ],
  },
  display: {
    description: 'Retrieves the results of a report run.',
    hidden: true,
    label: 'Retrieve Report',
  },
  key: 'retrieve_report',
  noun: 'Report',
};

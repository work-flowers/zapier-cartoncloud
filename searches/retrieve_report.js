const perform = async (z, bundle) => {
  const options = {
    url: `https://api.cartoncloud.com/tenants/${bundle.inputData.tenant_id}/report-runs/${bundle.inputData.report_run_id}`,
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
        key: 'tenant_id',
        label: 'Tenant ID',
        type: 'string',
        dynamic: 'new_tenant.id.Tenant',
        helpText:
          'CartonCloud tenant ID (UUID) the report run belongs to — the same tenant passed to Create Report Run. Call the New Tenant tool first if unknown.',
        required: true,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'report_run_id',
        label: 'Report Run ID',
        type: 'string',
        helpText:
          'Report run ID (UUID) returned by a previous Create Report Run call. Required.',
        required: true,
        list: false,
        altersDynamicFields: false,
      },
    ],
  },
  display: {
    description:
      'Retrieves the results of a report run started by Create Report Run. Poll until the run completes.',
    hidden: true,
    label: 'Retrieve Report',
  },
  key: 'retrieve_report',
  noun: 'Report',
};

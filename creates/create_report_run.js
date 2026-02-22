const perform = async (z, bundle) => {
  // Step 1: Initiate the report
  const createOptions = {
    url: `https://api.cartoncloud.com/tenants/${bundle.inputData.tenant_id}/report-runs`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept-Version': '1',
      Authorization: `Bearer ${bundle.authData.access_token}`,
    },
    body: {
      type: `${bundle.inputData.report_type}`,
      parameters: {
        pageSize: 100,
        customer: {
          id: `${bundle.inputData.customer}`,
        },
      },
    },
  };

  const createResponse = await z.request(createOptions);
  const reportRun = createResponse.json;
  const reportId = reportRun.id;

  // Step 2: Poll until report is ready
  const maxAttempts = 10;
  const delayMs = 1500;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const fetchOptions = {
      url: `https://api.cartoncloud.com/tenants/${bundle.inputData.tenant_id}/report-runs/${reportId}`,
      method: 'GET',
      headers: {
        'Accept-Version': '1',
        Authorization: `Bearer ${bundle.authData.access_token}`,
      },
    };

    const fetchResponse = await z.request(fetchOptions);
    const report = fetchResponse.json;

    if (report.status === 'SUCCESS') {
      return report;
    }

    // Wait before next attempt
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  throw new z.errors.Error('Report generation timed out', 'ReportTimeout', 408);
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
        key: 'report_type',
        label: 'Report Type',
        type: 'string',
        choices: ['BULK_CHARGES', 'STOCK_ON_HAND'],
        required: true,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'customer',
        label: 'Customer',
        type: 'string',
        dynamic: 'new_customer.id.Customer',
        required: true,
        list: false,
        altersDynamicFields: false,
      },
    ],
  },
  display: {
    description: 'Creates a new report run. ',
    hidden: false,
    label: 'Create Report Run',
  },
  key: 'create_report_run',
  noun: 'Report Run',
};

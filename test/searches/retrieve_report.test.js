const zapier = require('zapier-platform-core');

const App = require('../../index');
const appTester = zapier.createAppTester(App);
const { getAuthData } = require('../helpers');
zapier.tools.env.inject();

describe('searches.retrieve_report', () => {
  let authData;

  beforeAll(async () => {
    authData = await getAuthData();
  });

  it('should retrieve results of a completed report run', async () => {
    // First, create a report run so we have a valid ID to retrieve
    const createBundle = {
      authData,
      inputData: {
        tenant_id: process.env.TEST_TENANT_ID,
        report_type: 'STOCK_ON_HAND',
        customer: process.env.TEST_CUSTOMER_ID,
      },
    };

    const reportRun = await appTester(
      App.creates['create_report_run'].operation.perform,
      createBundle,
    );

    expect(reportRun.id).toBeDefined();
    expect(reportRun.status).toBe('SUCCESS');

    // Now retrieve the completed report
    const retrieveBundle = {
      authData: {
        ...authData,
        tenant_id: process.env.TEST_TENANT_ID,
      },
      inputData: {
        report_run_id: reportRun.id,
      },
    };

    const results = await appTester(
      App.searches['retrieve_report'].operation.perform,
      retrieveBundle,
    );

    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(1);
    expect(results[0].id).toBe(reportRun.id);
    expect(results[0].status).toBe('SUCCESS');
  }, 30000);
});

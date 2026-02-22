const zapier = require('zapier-platform-core');

const App = require('../../index');
const appTester = zapier.createAppTester(App);
const { getAuthData } = require('../helpers');
zapier.tools.env.inject();

describe('creates.create_report_run', () => {
  let authData;

  beforeAll(async () => {
    authData = await getAuthData();
  });

  it('should create a STOCK_ON_HAND report run and poll until complete', async () => {
    const bundle = {
      authData,
      inputData: {
        tenant_id: process.env.TEST_TENANT_ID,
        report_type: 'STOCK_ON_HAND',
        customer: process.env.TEST_CUSTOMER_ID,
      },
    };

    const result = await appTester(
      App.creates['create_report_run'].operation.perform,
      bundle,
    );

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.status).toBe('SUCCESS');
    expect(result.type).toBe('STOCK_ON_HAND');
  }, 30000);

  it('should create a BULK_CHARGES report run and poll until complete', async () => {
    const bundle = {
      authData,
      inputData: {
        tenant_id: process.env.TEST_TENANT_ID,
        report_type: 'BULK_CHARGES',
        customer: process.env.TEST_CUSTOMER_ID,
      },
    };

    const result = await appTester(
      App.creates['create_report_run'].operation.perform,
      bundle,
    );

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.status).toBe('SUCCESS');
    expect(result.type).toBe('BULK_CHARGES');
  }, 30000);
});

const zapier = require('zapier-platform-core');

const App = require('../../index');
const appTester = zapier.createAppTester(App);
const { getAuthData } = require('../helpers');
zapier.tools.env.inject();

describe('triggers.new_customer', () => {
  let authData;

  beforeAll(async () => {
    authData = await getAuthData();
  });

  it('should return a list of customers for the tenant', async () => {
    const bundle = {
      authData,
      inputData: { tenant_id: process.env.TEST_TENANT_ID },
    };

    const results = await appTester(
      App.triggers['new_customer'].operation.perform,
      bundle,
    );

    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
  });

  it('should return customers with id and name fields', async () => {
    const bundle = {
      authData,
      inputData: { tenant_id: process.env.TEST_TENANT_ID },
    };

    const results = await appTester(
      App.triggers['new_customer'].operation.perform,
      bundle,
    );

    const customer = results[0];
    expect(customer.id).toBeDefined();
    expect(customer.name).toBeDefined();
  });

  it('should include the known test customer', async () => {
    const bundle = {
      authData,
      inputData: { tenant_id: process.env.TEST_TENANT_ID },
    };

    const results = await appTester(
      App.triggers['new_customer'].operation.perform,
      bundle,
    );

    const testCustomer = results.find(
      (c) => c.id === process.env.TEST_CUSTOMER_ID,
    );
    expect(testCustomer).toBeDefined();
  });
});

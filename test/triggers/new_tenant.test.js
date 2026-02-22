const zapier = require('zapier-platform-core');

const App = require('../../index');
const appTester = zapier.createAppTester(App);
const { getAuthData } = require('../helpers');
zapier.tools.env.inject();

describe('triggers.new_tenant', () => {
  let authData;

  beforeAll(async () => {
    authData = await getAuthData();
  });

  it('should return a list of tenants', async () => {
    const bundle = { authData, inputData: {} };

    const results = await appTester(
      App.triggers['new_tenant'].operation.perform,
      bundle,
    );

    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);

    // Each tenant should have an id and name
    const tenant = results[0];
    expect(tenant.id).toBeDefined();
    expect(tenant.name).toBeDefined();
  });

  it('should return tenants sorted alphabetically by name', async () => {
    const bundle = { authData, inputData: {} };

    const results = await appTester(
      App.triggers['new_tenant'].operation.perform,
      bundle,
    );

    if (results.length > 1) {
      for (let i = 1; i < results.length; i++) {
        expect(
          results[i - 1].name.localeCompare(results[i].name),
        ).toBeLessThanOrEqual(0);
      }
    }
  });

  it('should include the known test tenant', async () => {
    const bundle = { authData, inputData: {} };

    const results = await appTester(
      App.triggers['new_tenant'].operation.perform,
      bundle,
    );

    const testTenant = results.find(
      (t) => t.id === process.env.TEST_TENANT_ID,
    );
    expect(testTenant).toBeDefined();
  });
});

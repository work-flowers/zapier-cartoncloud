const zapier = require('zapier-platform-core');

const App = require('../../index');
const appTester = zapier.createAppTester(App);
const { getAuthData } = require('../helpers');
zapier.tools.env.inject();

describe('searches.search_customers', () => {
  let authData;

  beforeAll(async () => {
    authData = await getAuthData();
  });

  it('should list all customers when no filter is provided', async () => {
    const bundle = {
      authData,
      inputData: { tenant_id: process.env.TEST_TENANT_ID },
    };

    const results = await appTester(
      App.searches['search_customers'].operation.perform,
      bundle,
    );

    expect(Array.isArray(results)).toBe(true);
    if (results.length > 0) {
      expect(results[0].id).toBeDefined();
      expect(results[0].name).toBeDefined();
    }
  });

  it('should filter by exact customer_id', async () => {
    const bundle = {
      authData,
      inputData: {
        tenant_id: process.env.TEST_TENANT_ID,
        customer_id: process.env.TEST_CUSTOMER_ID,
      },
    };

    const results = await appTester(
      App.searches['search_customers'].operation.perform,
      bundle,
    );

    expect(Array.isArray(results)).toBe(true);
    if (process.env.TEST_CUSTOMER_ID) {
      expect(results.length).toBeLessThanOrEqual(1);
      if (results.length === 1) {
        expect(results[0].id).toBe(process.env.TEST_CUSTOMER_ID);
      }
    }
  });

  it('should filter by name (CONTAINS, case-insensitive)', async () => {
    // First, fetch any one customer to derive a substring to search for.
    const all = await appTester(
      App.searches['search_customers'].operation.perform,
      { authData, inputData: { tenant_id: process.env.TEST_TENANT_ID } },
    );

    if (all.length === 0) return; // nothing to assert against

    const sample = all[0];
    const fragment = sample.name.slice(0, Math.min(3, sample.name.length));

    const results = await appTester(
      App.searches['search_customers'].operation.perform,
      {
        authData,
        inputData: {
          tenant_id: process.env.TEST_TENANT_ID,
          name: fragment.toLowerCase(),
          match_mode: 'CONTAINS',
        },
      },
    );

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    expect(
      results.every((c) =>
        (c.name || '').toLowerCase().includes(fragment.toLowerCase()),
      ),
    ).toBe(true);
  });
});

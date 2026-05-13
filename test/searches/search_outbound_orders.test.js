const zapier = require('zapier-platform-core');

const App = require('../../index');
const appTester = zapier.createAppTester(App);
const { getAuthData } = require('../helpers');
zapier.tools.env.inject();

describe('searches.search_outbound_orders', () => {
  let authData;

  beforeAll(async () => {
    authData = await getAuthData();
  });

  it('searches by customer_id and returns an array of orders', async () => {
    const bundle = {
      authData,
      inputData: {
        tenant_id: process.env.TEST_TENANT_ID,
        customer_id: process.env.TEST_CUSTOMER_ID,
        max_results: 5,
      },
    };

    const results = await appTester(
      App.searches['search_outbound_orders'].operation.perform,
      bundle,
    );

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeLessThanOrEqual(5);
    if (results.length > 0) {
      expect(results[0].id).toBeDefined();
    }
  }, 30000);

  it('searches by modified-date range (today)', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const bundle = {
      authData,
      inputData: {
        tenant_id: process.env.TEST_TENANT_ID,
        timestamp_field: 'modified',
        date_from: today,
        date_to: today,
        max_results: 5,
      },
    };

    const results = await appTester(
      App.searches['search_outbound_orders'].operation.perform,
      bundle,
    );

    expect(Array.isArray(results)).toBe(true);
  }, 30000);

  it('rejects a date range with no timestamp_field', async () => {
    const bundle = {
      authData,
      inputData: {
        tenant_id: process.env.TEST_TENANT_ID,
        date_from: '2026-01-01',
        date_to: '2026-01-02',
      },
    };

    await expect(
      appTester(
        App.searches['search_outbound_orders'].operation.perform,
        bundle,
      ),
    ).rejects.toThrow(/timestamp_field/);
  });

  it('rejects a date range exceeding 31 days', async () => {
    const bundle = {
      authData,
      inputData: {
        tenant_id: process.env.TEST_TENANT_ID,
        timestamp_field: 'created',
        date_from: '2026-01-01',
        date_to: '2026-03-01',
      },
    };

    await expect(
      appTester(
        App.searches['search_outbound_orders'].operation.perform,
        bundle,
      ),
    ).rejects.toThrow(/range too large/);
  });

  it('requires at least one filter', async () => {
    const bundle = {
      authData,
      inputData: {
        tenant_id: process.env.TEST_TENANT_ID,
      },
    };

    await expect(
      appTester(
        App.searches['search_outbound_orders'].operation.perform,
        bundle,
      ),
    ).rejects.toThrow(/At least one filter/);
  });
});

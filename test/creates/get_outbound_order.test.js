const zapier = require('zapier-platform-core');

const App = require('../../index');
const appTester = zapier.createAppTester(App);
const { getAuthData } = require('../helpers');
zapier.tools.env.inject();

describe('creates.get_outbound_order', () => {
  let authData;

  beforeAll(async () => {
    authData = await getAuthData();
  });

  it('should retrieve an outbound order by ID', async () => {
    const bundle = {
      authData,
      inputData: {
        tenant_id: process.env.TEST_TENANT_ID,
        order_id: process.env.TEST_ORDER_ID,
      },
    };

    const result = await appTester(
      App.creates['get_outbound_order'].operation.perform,
      bundle,
    );

    expect(result).toBeDefined();
    expect(result.id).toBe(process.env.TEST_ORDER_ID);
  });

  it('should return order with expected structure', async () => {
    const bundle = {
      authData,
      inputData: {
        tenant_id: process.env.TEST_TENANT_ID,
        order_id: process.env.TEST_ORDER_ID,
      },
    };

    const result = await appTester(
      App.creates['get_outbound_order'].operation.perform,
      bundle,
    );

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    // Outbound orders typically have references, customer, details, and items
    expect(result.references).toBeDefined();
    expect(result.customer).toBeDefined();
    expect(result.details).toBeDefined();
  });

  it('should fail for a non-existent order ID', async () => {
    const bundle = {
      authData,
      inputData: {
        tenant_id: process.env.TEST_TENANT_ID,
        order_id: '00000000-0000-0000-0000-000000000000',
      },
    };

    await expect(
      appTester(
        App.creates['get_outbound_order'].operation.perform,
        bundle,
      ),
    ).rejects.toThrow();
  });
});

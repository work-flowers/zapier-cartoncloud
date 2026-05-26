const zapier = require('zapier-platform-core');

const App = require('../../index');
const appTester = zapier.createAppTester(App);
const { getAuthData } = require('../helpers');
zapier.tools.env.inject();

describe('creates.delete_outbound_order', () => {
  let authData;

  beforeAll(async () => {
    authData = await getAuthData();
  });

  it('should create then delete an outbound order', async () => {
    const createBundle = {
      authData,
      inputData: {
        tenant_id: process.env.TEST_TENANT_ID,
        customer: process.env.TEST_CUSTOMER_ID,
        order_reference: `ZAPIER-DELETE-${Date.now()}`,
        delivery_method_type: 'PICKUP',
        address_company: 'Delete Test Co',
        address_contact: 'John Smith',
        address_street: '123 Test Street',
        address_city: 'Sydney',
        address_state_code: 'NSW',
        address_postcode: '2000',
        address_country_iso2: 'AU',
        product_code: ['COCI1001'],
        quantity: ['1'],
      },
    };

    const created = await appTester(
      App.creates['create_outbound_order'].operation.perform,
      createBundle,
    );

    expect(created).toBeDefined();
    expect(created.id).toBeDefined();

    const deleteBundle = {
      authData,
      inputData: {
        tenant_id: process.env.TEST_TENANT_ID,
        order_id: created.id,
      },
    };

    const result = await appTester(
      App.creates['delete_outbound_order'].operation.perform,
      deleteBundle,
    );

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.id).toBe(created.id);
  });

  it('should return a structured error for a non-existent order ID', async () => {
    const bundle = {
      authData,
      inputData: {
        tenant_id: process.env.TEST_TENANT_ID,
        order_id: '00000000-0000-0000-0000-000000000000',
      },
    };

    const result = await appTester(
      App.creates['delete_outbound_order'].operation.perform,
      bundle,
    );

    expect(result).toBeDefined();
    expect(result.success).toBe(false);
    expect(result.status).toBeGreaterThanOrEqual(400);
    expect(result.error).toBeDefined();
  });
});

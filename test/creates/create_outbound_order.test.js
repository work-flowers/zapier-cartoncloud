const zapier = require('zapier-platform-core');

const App = require('../../index');
const appTester = zapier.createAppTester(App);
const { getAuthData } = require('../helpers');
zapier.tools.env.inject();

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe('creates.create_outbound_order', () => {
  let authData;

  beforeAll(async () => {
    authData = await getAuthData();
  });

  it('should create an outbound order with required fields', async () => {
    const bundle = {
      authData,
      inputData: {
        tenant_id: process.env.TEST_TENANT_ID,
        customer: process.env.TEST_CUSTOMER_ID,
        order_reference: `ZAPIER-TEST-${Date.now()}`,
        delivery_method_type: 'PICKUP',
        address_company: 'Test Co',
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

    const result = await appTester(
      App.creates['create_outbound_order'].operation.perform,
      bundle,
    );

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.references).toBeDefined();
    expect(result.references.customer).toBe(bundle.inputData.order_reference);
  });

  it('should create an order with multiple line items', async () => {
    await delay(2000); // avoid rate limiting

    const bundle = {
      authData,
      inputData: {
        tenant_id: process.env.TEST_TENANT_ID,
        customer: process.env.TEST_CUSTOMER_ID,
        order_reference: `ZAPIER-MULTI-${Date.now()}`,
        delivery_method_type: 'SHIPPING',
        address_company: 'Test Company Pty Ltd',
        address_contact: 'Jane Doe',
        address_street: '456 Test Avenue',
        address_city: 'Melbourne',
        address_state_code: 'VIC',
        address_postcode: '3000',
        address_country_iso2: 'AU',
        address_email: 'test@example.com',
        delivery_instructions: 'Leave at reception',
        packing_instructions: 'Fragile items',
        urgent: 'false',
        product_code: ['COCI1001', 'DEH1001'],
        quantity: ['2', '5'],
      },
    };

    const result = await appTester(
      App.creates['create_outbound_order'].operation.perform,
      bundle,
    );

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.items).toBeDefined();
    expect(result.items.length).toBe(2);
  });

  it('should create an order with optional date fields', async () => {
    await delay(2000); // avoid rate limiting

    const bundle = {
      authData,
      inputData: {
        tenant_id: process.env.TEST_TENANT_ID,
        customer: process.env.TEST_CUSTOMER_ID,
        order_reference: `ZAPIER-DATE-${Date.now()}`,
        delivery_method_type: 'SHIPPING',
        address_company: 'Date Test Corp',
        address_contact: 'Bob Jones',
        address_street: '789 Test Road',
        address_city: 'Brisbane',
        address_state_code: 'QLD',
        address_postcode: '4000',
        address_country_iso2: 'AU',
        required_date: '2026-03-15T00:00:00Z',
        required_ship_date: '2026-03-14T00:00:00Z',
        product_code: ['COCI1001'],
        quantity: ['1'],
      },
    };

    const result = await appTester(
      App.creates['create_outbound_order'].operation.perform,
      bundle,
    );

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.details.deliver.requiredDate).toBe('2026-03-15');
    expect(result.details.collect.requiredDate).toBe('2026-03-14');
  });
});

const zapier = require('zapier-platform-core');

const App = require('../../index');
const appTester = zapier.createAppTester(App);
const { getAuthData } = require('../helpers');
zapier.tools.env.inject();

describe('creates.add_product', () => {
  let authData;
  const createdIds = [];

  beforeAll(async () => {
    authData = await getAuthData();
  });

  afterAll(async () => {
    // CartonCloud has no delete-product endpoint, so deactivate the products
    // created during testing to minimise clutter in the tenant.
    for (const id of createdIds) {
      await fetch(
        `https://api.cartoncloud.com/tenants/${process.env.TEST_TENANT_ID}/warehouse-products/${id}`,
        {
          method: 'PATCH',
          headers: {
            'Accept-Version': '1',
            Authorization: `Bearer ${authData.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([
            { op: 'replace', path: '/details/active', value: false },
          ]),
        },
      ).catch(() => {});
    }
  });

  it('should create a product with required and unit fields', async () => {
    const code = `ZAPIER-TEST-${Date.now()}`;

    const result = await appTester(
      App.creates['add_product'].operation.perform,
      {
        authData,
        inputData: {
          tenant_id: process.env.TEST_TENANT_ID,
          customer: process.env.TEST_CUSTOMER_ID,
          product_code: code,
          name: 'Zapier Test Product',
          type: 'General',
          unit_of_measure: 'CTN',
          unit_name: 'Carton',
          base_qty: '1',
          weight: '7.5',
        },
      },
    );

    expect(result.success).toBe(true);
    expect(result.id).toBeDefined();
    if (result.id) createdIds.push(result.id);

    expect(result.references.code).toBe(code);
    expect(result.name).toBe('Zapier Test Product');
    expect(result.defaultUnitOfMeasure).toBe('CTN');
    expect(result.unitOfMeasures.CTN.baseQty).toBe(1);
    expect(result.unitOfMeasures.CTN.weight).toBe(7.5);
    expect(result.details.active).toBe(true);
  });

  it('should return a structured error for a duplicate product code', async () => {
    const code = `ZAPIER-DUP-${Date.now()}`;
    const inputData = {
      tenant_id: process.env.TEST_TENANT_ID,
      customer: process.env.TEST_CUSTOMER_ID,
      product_code: code,
      name: 'Dup Test',
      type: 'General',
      unit_of_measure: 'CTN',
    };

    const first = await appTester(
      App.creates['add_product'].operation.perform,
      { authData, inputData },
    );
    expect(first.success).toBe(true);
    if (first.id) createdIds.push(first.id);

    const second = await appTester(
      App.creates['add_product'].operation.perform,
      { authData, inputData },
    );

    expect(second.success).toBe(false);
    expect(second.status).toBeGreaterThanOrEqual(400);
    expect(second.error).toMatch(/already exists/i);
  });

  it('should return a structured error for an invalid customer', async () => {
    const result = await appTester(
      App.creates['add_product'].operation.perform,
      {
        authData,
        inputData: {
          tenant_id: process.env.TEST_TENANT_ID,
          customer: '00000000-0000-0000-0000-000000000000',
          product_code: `ZAPIER-BADCUST-${Date.now()}`,
          name: 'Bad Customer Test',
          type: 'General',
          unit_of_measure: 'CTN',
        },
      },
    );

    expect(result.success).toBe(false);
    expect(result.status).toBeGreaterThanOrEqual(400);
    expect(result.error).toBeDefined();
  });
});

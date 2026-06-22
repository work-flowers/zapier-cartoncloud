const zapier = require('zapier-platform-core');

const App = require('../../index');
const appTester = zapier.createAppTester(App);
const { getAuthData } = require('../helpers');
zapier.tools.env.inject();

describe('triggers.new_product', () => {
  let authData;

  beforeAll(async () => {
    authData = await getAuthData();
  });

  it('should return a list of products for the tenant', async () => {
    const bundle = {
      authData,
      inputData: { tenant_id: process.env.TEST_TENANT_ID },
    };

    const results = await appTester(
      App.triggers['new_product'].operation.perform,
      bundle,
    );

    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
  });

  it('should return products with id, name, and label fields', async () => {
    const bundle = {
      authData,
      inputData: { tenant_id: process.env.TEST_TENANT_ID },
    };

    const results = await appTester(
      App.triggers['new_product'].operation.perform,
      bundle,
    );

    const product = results[0];
    expect(product.id).toBeDefined();
    expect(product.name).toBeDefined();
    expect(product.label).toBeDefined();
  });

  it('should include the known test product', async () => {
    const bundle = {
      authData,
      inputData: { tenant_id: process.env.TEST_TENANT_ID },
    };

    const results = await appTester(
      App.triggers['new_product'].operation.perform,
      bundle,
    );

    const testProduct = results.find(
      (p) => p.id === process.env.TEST_PRODUCT_ID,
    );
    expect(testProduct).toBeDefined();
  });
});

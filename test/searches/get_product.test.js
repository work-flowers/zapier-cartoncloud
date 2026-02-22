const zapier = require('zapier-platform-core');

const App = require('../../index');
const appTester = zapier.createAppTester(App);
const { getAuthData } = require('../helpers');
zapier.tools.env.inject();

describe('searches.get_product', () => {
  let authData;

  beforeAll(async () => {
    authData = await getAuthData();
  });

  it('should find a product by ID', async () => {
    const bundle = {
      authData,
      inputData: {
        tenant_id: process.env.TEST_TENANT_ID,
        product_id: process.env.TEST_PRODUCT_ID,
      },
    };

    const results = await appTester(
      App.searches['get_product'].operation.perform,
      bundle,
    );

    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(1);
    expect(results[0].id).toBe(process.env.TEST_PRODUCT_ID);
  });

  it('should return product with expected fields', async () => {
    const bundle = {
      authData,
      inputData: {
        tenant_id: process.env.TEST_TENANT_ID,
        product_id: process.env.TEST_PRODUCT_ID,
      },
    };

    const results = await appTester(
      App.searches['get_product'].operation.perform,
      bundle,
    );

    const product = results[0];
    expect(product.id).toBeDefined();
    expect(product.name).toBeDefined();
  });

  it('should fail for a non-existent product ID', async () => {
    const bundle = {
      authData,
      inputData: {
        tenant_id: process.env.TEST_TENANT_ID,
        product_id: '00000000-0000-0000-0000-000000000000',
      },
    };

    await expect(
      appTester(
        App.searches['get_product'].operation.perform,
        bundle,
      ),
    ).rejects.toThrow();
  });
});

const zapier = require('zapier-platform-core');

const App = require('../../index');
const appTester = zapier.createAppTester(App);
const { getAuthData } = require('../helpers');
zapier.tools.env.inject();

describe('creates.update_product', () => {
  let authData;
  let original;

  beforeAll(async () => {
    authData = await getAuthData();

    // Capture the product's current state so we can restore it afterwards.
    const [product] = await appTester(
      App.searches['get_product'].operation.perform,
      {
        authData,
        inputData: {
          tenant_id: process.env.TEST_TENANT_ID,
          product_id: process.env.TEST_PRODUCT_ID,
        },
      },
    );
    original = product;
  });

  afterAll(async () => {
    if (!original) return;
    // Restore the first unit of measure's weight to its original value.
    const code = original.defaultUnitOfMeasure;
    const uom = original.unitOfMeasures[code];
    await appTester(App.creates['update_product'].operation.perform, {
      authData,
      inputData: {
        tenant_id: process.env.TEST_TENANT_ID,
        product_id: process.env.TEST_PRODUCT_ID,
        unit_of_measure: code,
        weight: uom.weight,
      },
    });
  });

  it("should update a unit of measure's weight", async () => {
    const code = original.defaultUnitOfMeasure;
    const newWeight = (original.unitOfMeasures[code].weight || 0) + 1;

    const result = await appTester(
      App.creates['update_product'].operation.perform,
      {
        authData,
        inputData: {
          tenant_id: process.env.TEST_TENANT_ID,
          product_id: process.env.TEST_PRODUCT_ID,
          unit_of_measure: code,
          weight: newWeight,
        },
      },
    );

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.id).toBe(process.env.TEST_PRODUCT_ID);
    expect(result.unitOfMeasures[code].weight).toBe(newWeight);
  });

  it('should resolve the product by reference code (SKU)', async () => {
    const code = original.references.code;
    const uomCode = original.defaultUnitOfMeasure;
    const newWeight = (original.unitOfMeasures[uomCode].weight || 0) + 2;

    const result = await appTester(
      App.creates['update_product'].operation.perform,
      {
        authData,
        inputData: {
          tenant_id: process.env.TEST_TENANT_ID,
          product_code: code,
          unit_of_measure: uomCode,
          weight: newWeight,
        },
      },
    );

    expect(result.success).toBe(true);
    expect(result.id).toBe(process.env.TEST_PRODUCT_ID);
    expect(result.unitOfMeasures[uomCode].weight).toBe(newWeight);
  });

  it('should return a structured error for an unknown reference code', async () => {
    const result = await appTester(
      App.creates['update_product'].operation.perform,
      {
        authData,
        inputData: {
          tenant_id: process.env.TEST_TENANT_ID,
          product_code: 'NO-SUCH-CODE-ZZZ',
          name: 'Should Not Apply',
        },
      },
    );

    expect(result.success).toBe(false);
    expect(result.status).toBe(404);
    expect(result.error).toMatch(/No product found with code/i);
  });

  it('should require either a product ID or product code', async () => {
    const result = await appTester(
      App.creates['update_product'].operation.perform,
      {
        authData,
        inputData: {
          tenant_id: process.env.TEST_TENANT_ID,
          name: 'Should Not Apply',
        },
      },
    );

    expect(result.success).toBe(false);
    expect(result.status).toBe(400);
    expect(result.error).toMatch(/Product ID.*Product Code|identify the product/i);
  });

  it('should return a structured error when no fields are supplied', async () => {
    const result = await appTester(
      App.creates['update_product'].operation.perform,
      {
        authData,
        inputData: {
          tenant_id: process.env.TEST_TENANT_ID,
          product_id: process.env.TEST_PRODUCT_ID,
        },
      },
    );

    expect(result.success).toBe(false);
    expect(result.status).toBe(400);
    expect(result.error).toMatch(/No update fields/i);
  });

  it('should fall back to the default UoM when no code is supplied (UUID path)', async () => {
    const code = original.defaultUnitOfMeasure;
    const newWeight = (original.unitOfMeasures[code].weight || 0) + 3;

    const result = await appTester(
      App.creates['update_product'].operation.perform,
      {
        authData,
        inputData: {
          tenant_id: process.env.TEST_TENANT_ID,
          product_id: process.env.TEST_PRODUCT_ID,
          weight: newWeight,
        },
      },
    );

    expect(result.success).toBe(true);
    expect(result.unitOfMeasures[code].weight).toBe(newWeight);
  });

  it('should fall back to the default UoM when resolving by code', async () => {
    const code = original.defaultUnitOfMeasure;
    const newWeight = (original.unitOfMeasures[code].weight || 0) + 4;

    const result = await appTester(
      App.creates['update_product'].operation.perform,
      {
        authData,
        inputData: {
          tenant_id: process.env.TEST_TENANT_ID,
          product_code: original.references.code,
          weight: newWeight,
        },
      },
    );

    expect(result.success).toBe(true);
    expect(result.id).toBe(process.env.TEST_PRODUCT_ID);
    expect(result.unitOfMeasures[code].weight).toBe(newWeight);
  });

  it('should return a structured error for a non-existent product ID', async () => {
    const result = await appTester(
      App.creates['update_product'].operation.perform,
      {
        authData,
        inputData: {
          tenant_id: process.env.TEST_TENANT_ID,
          product_id: '00000000-0000-0000-0000-000000000000',
          name: 'Should Not Apply',
        },
      },
    );

    expect(result.success).toBe(false);
    expect(result.status).toBeGreaterThanOrEqual(400);
    expect(result.error).toBeDefined();
  });
});

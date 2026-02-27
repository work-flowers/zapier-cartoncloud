const zapier = require('zapier-platform-core');

const App = require('../../index');
const appTester = zapier.createAppTester(App);
const { getAuthData } = require('../helpers');
zapier.tools.env.inject();

describe('triggers.new_outbound_document', () => {
  let authData;

  beforeAll(async () => {
    authData = await getAuthData();
  });

  it('should return documents from recently modified orders', async () => {
    const bundle = {
      authData,
      inputData: { tenant_id: process.env.TEST_TENANT_ID },
    };

    const results = await appTester(
      App.triggers['new_outbound_document'].operation.perform,
      bundle,
    );

    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
    // May be empty if no orders were modified today/yesterday — that's OK
  }, 30000);

  it('should return documents with expected fields when results exist', async () => {
    const bundle = {
      authData,
      inputData: { tenant_id: process.env.TEST_TENANT_ID },
    };

    const results = await appTester(
      App.triggers['new_outbound_document'].operation.perform,
      bundle,
    );

    if (results.length > 0) {
      const doc = results[0];
      expect(doc.id).toBeDefined();
      expect(doc.document_type).toBeDefined();
      expect(doc.order_id).toBeDefined();
      expect(doc).toHaveProperty('document_name');
      expect(doc).toHaveProperty('order_reference');
      expect(doc).toHaveProperty('file');
    }
  }, 30000);

  it('should support filtering by customer_id', async () => {
    const bundle = {
      authData,
      inputData: {
        tenant_id: process.env.TEST_TENANT_ID,
        customer_id: process.env.TEST_CUSTOMER_ID,
      },
    };

    const results = await appTester(
      App.triggers['new_outbound_document'].operation.perform,
      bundle,
    );

    expect(results).toBeDefined();
    expect(Array.isArray(results)).toBe(true);
  }, 30000);
});

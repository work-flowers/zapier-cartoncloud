// Must be defined at module level for z.dehydrateFile serialization
const downloadDocument = async (z, bundle) => {
  const response = await z.request({
    url: `https://api.cartoncloud.com/tenants/${bundle.inputData.tenant_id}/outbound-orders/${bundle.inputData.order_id}/documents/${bundle.inputData.document_id}/download`,
    method: 'GET',
    headers: {
      'Accept-Version': '1',
      Authorization: `Bearer ${bundle.authData.access_token}`,
    },
    raw: true,
  });
  return response;
};

const perform = async (z, bundle) => {
  const tenantId = bundle.inputData.tenant_id;

  // Build rolling-window date conditions (today + yesterday)
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const formatDate = (d) => d.toISOString().slice(0, 10);

  const dateCondition = {
    type: 'OrCondition',
    conditions: [
      {
        type: 'TextComparisonCondition',
        field: { type: 'JsonField', pointer: '/timestamps/modified/time' },
        value: { type: 'ValueField', value: formatDate(today) },
        method: 'STARTS_WITH',
      },
      {
        type: 'TextComparisonCondition',
        field: { type: 'JsonField', pointer: '/timestamps/modified/time' },
        value: { type: 'ValueField', value: formatDate(yesterday) },
        method: 'STARTS_WITH',
      },
    ],
  };

  // Optionally narrow to a specific customer
  let condition = dateCondition;
  if (bundle.inputData.customer_id) {
    condition = {
      type: 'AndCondition',
      conditions: [
        dateCondition,
        {
          type: 'TextComparisonCondition',
          field: { type: 'JsonField', pointer: '/customer/id' },
          value: {
            type: 'ValueField',
            value: bundle.inputData.customer_id,
          },
          method: 'EQUAL_TO',
        },
      ],
    };
  }

  // Search for recently modified orders (paginated)
  const allOrders = [];
  let page = 1;
  let totalPages = 1;

  do {
    const searchResponse = await z.request({
      url: `https://api.cartoncloud.com/tenants/${tenantId}/outbound-orders/search`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Version': '1',
        Authorization: `Bearer ${bundle.authData.access_token}`,
      },
      params: { page, size: 50 },
      body: { condition },
    });

    const orders = searchResponse.json;
    if (Array.isArray(orders)) {
      allOrders.push(...orders);
    }

    totalPages = parseInt(
      searchResponse.getHeader('Total-Pages') || '1',
      10,
    );
    page++;
  } while (page <= totalPages);

  // Fetch documents for each order and flatten
  const documents = [];

  for (const order of allOrders) {
    const docResponse = await z.request({
      url: `https://api.cartoncloud.com/tenants/${tenantId}/outbound-orders/${order.id}/documents`,
      method: 'GET',
      headers: {
        'Accept-Version': '1',
        Authorization: `Bearer ${bundle.authData.access_token}`,
        Prefer: 'return=minimal',
      },
    });

    const docs = docResponse.json;
    if (Array.isArray(docs) && docs.length > 0) {
      for (const doc of docs) {
        documents.push({
          id: doc.id,
          document_type: doc.type,
          document_name: doc.content && doc.content.name ? doc.content.name : '',
          order_id: order.id,
          order_reference:
            order.references && order.references.customer
              ? order.references.customer
              : '',
          file: z.dehydrateFile(downloadDocument, {
            tenant_id: tenantId,
            order_id: order.id,
            document_id: doc.id,
          }),
        });
      }
    }
  }

  return documents;
};

module.exports = {
  operation: {
    perform: perform,
    inputFields: [
      {
        key: 'tenant_id',
        label: 'Tenant ID',
        type: 'string',
        dynamic: 'new_tenant.id.Tenant',
        required: true,
        list: false,
        altersDynamicFields: true,
      },
      {
        key: 'customer_id',
        label: 'Customer',
        type: 'string',
        dynamic: 'new_customer.id.name',
        required: false,
        list: false,
        altersDynamicFields: false,
        helpText:
          'Optionally filter to documents on orders for a specific customer.',
      },
    ],
    sample: {
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      document_type: 'OUTBOUND_ORDER_INVOICE',
      document_name: 'Invoice.pdf',
      order_id: 'f1e2d3c4-b5a6-7890-abcd-ef1234567890',
      order_reference: 'ORD-001',
      file: 'https://example.com/dehydrated-file-url',
    },
    outputFields: [
      { key: 'id', label: 'Document ID', type: 'string' },
      { key: 'document_type', label: 'Document Type', type: 'string' },
      { key: 'document_name', label: 'Document Name', type: 'string' },
      { key: 'order_id', label: 'Order ID', type: 'string' },
      { key: 'order_reference', label: 'Order Reference', type: 'string' },
      { key: 'file', label: 'Document File', type: 'file' },
    ],
  },
  display: {
    description: 'Triggers when a new document is attached to an outbound order.',
    hidden: false,
    label: 'New Outbound Document',
  },
  key: 'new_outbound_document',
  noun: 'Document',
};

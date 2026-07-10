const perform = async (z, bundle) => {
  const options = {
    url: `https://api.cartoncloud.com/tenants/${bundle.inputData.tenant_id}/outbound-orders/${bundle.inputData.order_id}`,
    method: 'DELETE',
    headers: {
      'Accept-Version': '1',
      Authorization: `Bearer ${bundle.authData.access_token}`,
    },
    skipThrowForStatus: true,
  };

  const response = await z.request(options);

  if (response.status >= 400) {
    const data = response.json || {};
    const message =
      data.message ||
      data.error ||
      (Array.isArray(data.errors)
        ? data.errors.map((e) => e.message || JSON.stringify(e)).join('; ')
        : null) ||
      response.content ||
      `Request failed with status ${response.status}`;

    return {
      success: false,
      error: message,
      status: response.status,
      details: data,
    };
  }

  return {
    success: true,
    id: bundle.inputData.order_id,
    status: response.status,
  };
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
        helpText:
          'CartonCloud tenant ID (UUID) the order belongs to. Call the New Tenant tool first if unknown.',
        required: true,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'order_id',
        label: 'Order ID',
        type: 'string',
        helpText:
          'CartonCloud internal order ID (UUID). This is the `id` returned by Create Outbound Order, Get Outbound Order, Search Outbound Orders, or the New Outbound Document trigger — NOT the human-facing order_reference.',
        required: true,
        list: false,
        altersDynamicFields: false,
      },
    ],
  },
  display: {
    description:
      'Deletes an outbound (sale) order by its CartonCloud order ID. Only allowed for statuses permitted by the tenant\'s Sale Order edit/delete setting.',
    hidden: false,
    label: 'Delete Outbound Order',
  },
  key: 'delete_outbound_order',
  noun: 'Outbound Order',
};

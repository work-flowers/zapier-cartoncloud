const perform = async (z, bundle) => {
  const tenantId = bundle.inputData.tenant_id;
  const nameFilter = (bundle.inputData.name || '').trim().toLowerCase();
  const idFilter = (bundle.inputData.customer_id || '').trim().toLowerCase();
  const matchMode = bundle.inputData.match_mode || 'CONTAINS';

  const options = {
    url: `https://api.cartoncloud.com/tenants/${tenantId}/customers`,
    method: 'GET',
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
      response.content ||
      `Request failed with status ${response.status}`;
    return [
      {
        success: false,
        error: message,
        status: response.status,
        details: data,
      },
    ];
  }

  let customers = Array.isArray(response.json) ? response.json : [];

  if (idFilter) {
    customers = customers.filter(
      (c) => (c.id || '').toLowerCase() === idFilter,
    );
  }

  if (nameFilter) {
    customers = customers.filter((c) => {
      const name = (c.name || '').toLowerCase();
      if (matchMode === 'EQUAL_TO') return name === nameFilter;
      if (matchMode === 'STARTS_WITH') return name.startsWith(nameFilter);
      return name.includes(nameFilter); // CONTAINS
    });
  }

  return customers;
};

module.exports = {
  operation: {
    perform,
    inputFields: [
      {
        key: 'tenant_id',
        label: 'Tenant ID',
        type: 'string',
        dynamic: 'new_tenant.id.Tenant',
        helpText:
          'CartonCloud tenant ID (UUID) to list customers from. Call the New Tenant tool first if unknown.',
        required: true,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'name',
        label: 'Customer Name',
        type: 'string',
        helpText:
          'Optional name filter. Applied client-side against the customer name (CartonCloud\'s list-customers endpoint does not support server-side filtering). Matching mode is controlled by Match Mode (defaults to CONTAINS, case-insensitive).',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'match_mode',
        label: 'Match Mode',
        type: 'string',
        choices: ['CONTAINS', 'STARTS_WITH', 'EQUAL_TO'],
        default: 'CONTAINS',
        helpText:
          'How Customer Name is matched (case-insensitive). CONTAINS (substring), STARTS_WITH (prefix), or EQUAL_TO (exact). Ignored if Customer Name is empty.',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'customer_id',
        label: 'Customer ID',
        type: 'string',
        helpText:
          'Optional CartonCloud customer ID (UUID) to filter by (exact match). Useful for confirming a known ID exists in the tenant.',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
    ],
    sample: {
      id: '8f1a7728-c084-11e8-85b4-02a6cf3a00de',
      name: 'Steam Chef Store',
    },
    outputFields: [
      { key: 'id', label: 'Customer ID' },
      { key: 'name', label: 'Customer Name' },
    ],
  },
  display: {
    description:
      'Lists customers under a given CartonCloud tenant, optionally filtered client-side by name (CONTAINS / STARTS_WITH / EQUAL_TO, case-insensitive) or exact customer ID. Returns an array of { id, name } objects. Use to resolve a customer name into a customer UUID before calling Create Outbound Order or Create Report Run. Note: CartonCloud\'s list-customers endpoint does not support server-side filtering or pagination, so the full list is fetched and filtered locally.',
    hidden: false,
    label: 'List Customers',
  },
  key: 'search_customers',
  noun: 'Customer',
};

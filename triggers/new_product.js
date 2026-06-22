const perform = async (z, bundle) => {
  const options = {
    url: `https://api.cartoncloud.com/tenants/${bundle.inputData.tenant_id}/warehouse-products`,
    method: 'GET',
    headers: {
      'Accept-Version': '1',
      Authorization: `Bearer ${bundle.authData.access_token}`,
    },
    params: {},
    removeMissingValuesFrom: {
      body: false,
      params: false,
    },
  };

  return z.request(options).then((response) => {
    const products = Array.isArray(response.json) ? response.json : [];

    // Surface a readable "CODE — Name" label for the dynamic dropdown, while
    // keeping id (the value used by Update Product / Get Product) and the raw
    // name and code.
    return products
      .map((p) => {
        const code = (p.references && p.references.code) || '';
        return {
          id: p.id,
          name: p.name,
          code,
          label: code ? `${code} — ${p.name}` : p.name,
        };
      })
      .sort((a, b) => (a.label || '').localeCompare(b.label || ''));
  });
};

module.exports = {
  operation: {
    perform: perform,
    canPaginate: true,
    inputFields: [
      {
        key: 'tenant_id',
        type: 'string',
        label: 'Tenant ID',
        helpText:
          'CartonCloud tenant ID (UUID). Obtain by calling the New Tenant tool first.',
        required: true,
        list: false,
        altersDynamicFields: false,
      },
    ],
  },
  display: {
    description:
      'Lists warehouse products under a given CartonCloud tenant. Use to look up a product ID (UUID) before calling Update Product or Get Product. Requires tenant_id (call the New Tenant tool first if unknown). Returns an array of products with id, name, code, and a composite label.',
    hidden: true,
    label: 'New Product',
  },
  key: 'new_product',
  noun: 'Product',
};

const TIMESTAMP_POINTERS = {
  created: '/timestamps/created/time',
  modified: '/timestamps/modified/time',
  dispatched: '/timestamps/dispatched/time',
  packed: '/timestamps/packed/time',
};

const MAX_DATE_RANGE_DAYS = 31;

const parseDateOnly = (value) => {
  if (!value) return null;
  // Accept either "YYYY-MM-DD" or a full ISO datetime; we only use the date part.
  const datePart = String(value).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    throw new Error(
      `Invalid date "${value}". Expected YYYY-MM-DD (or an ISO 8601 datetime starting with that pattern).`,
    );
  }
  const [y, m, d] = datePart.split('-').map(Number);
  // Use UTC to avoid local-timezone drift when iterating days.
  return new Date(Date.UTC(y, m - 1, d));
};

const formatYmd = (date) => date.toISOString().slice(0, 10);

const buildDateRangeCondition = (pointer, fromDate, toDate) => {
  const days = [];
  const cursor = new Date(fromDate.getTime());
  while (cursor.getTime() <= toDate.getTime()) {
    days.push(formatYmd(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    if (days.length > MAX_DATE_RANGE_DAYS) {
      throw new Error(
        `Date range too large: max ${MAX_DATE_RANGE_DAYS} days. CartonCloud's search API only supports STARTS_WITH on timestamps, so each day in the range is expanded to a separate OR condition.`,
      );
    }
  }

  const dayConditions = days.map((day) => ({
    type: 'TextComparisonCondition',
    field: { type: 'JsonField', pointer },
    value: { type: 'ValueField', value: day },
    method: 'STARTS_WITH',
  }));

  if (dayConditions.length === 1) return dayConditions[0];
  return { type: 'OrCondition', conditions: dayConditions };
};

const buildCondition = (input) => {
  const conditions = [];

  if (input.order_reference) {
    conditions.push({
      type: 'TextComparisonCondition',
      field: { type: 'JsonField', pointer: '/references/customer' },
      value: { type: 'ValueField', value: input.order_reference },
      method: input.reference_match || 'CONTAINS',
    });
  }

  if (input.customer_id) {
    conditions.push({
      type: 'TextComparisonCondition',
      field: { type: 'JsonField', pointer: '/customer/id' },
      value: { type: 'ValueField', value: input.customer_id },
      method: 'EQUAL_TO',
    });
  }

  if (input.customer_name) {
    conditions.push({
      type: 'TextComparisonCondition',
      field: { type: 'JsonField', pointer: '/customer/name' },
      value: { type: 'ValueField', value: input.customer_name },
      method: 'CONTAINS',
    });
  }

  const timestampField = input.timestamp_field;
  const fromDate = parseDateOnly(input.date_from);
  const toDate = parseDateOnly(input.date_to);
  if (fromDate || toDate) {
    if (!timestampField) {
      throw new Error(
        'date_from / date_to were provided but timestamp_field is missing. Set timestamp_field to one of: created, modified, dispatched, packed.',
      );
    }
    const pointer = TIMESTAMP_POINTERS[timestampField];
    if (!pointer) {
      throw new Error(
        `Invalid timestamp_field "${timestampField}". Must be one of: ${Object.keys(TIMESTAMP_POINTERS).join(', ')}.`,
      );
    }
    const effectiveFrom = fromDate || toDate;
    const effectiveTo = toDate || fromDate;
    if (effectiveFrom.getTime() > effectiveTo.getTime()) {
      throw new Error('date_from must be on or before date_to.');
    }
    conditions.push(buildDateRangeCondition(pointer, effectiveFrom, effectiveTo));
  }

  if (conditions.length === 0) {
    throw new Error(
      'At least one filter is required (order_reference, customer_id, customer_name, or a timestamp_field + date_from/date_to range).',
    );
  }

  // CartonCloud's search API requires the top-level condition to be a composite
  // (AndCondition/OrCondition) with a `conditions` array, even for a single filter —
  // posting a bare TextComparisonCondition returns "Missing field: conditions".
  return { type: 'AndCondition', conditions };
};

const perform = async (z, bundle) => {
  const tenantId = bundle.inputData.tenant_id;
  const maxResults = Math.min(
    Math.max(parseInt(bundle.inputData.max_results, 10) || 50, 1),
    500,
  );

  const condition = buildCondition(bundle.inputData);

  const pageSize = Math.min(maxResults, 100);
  const results = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await z.request({
      url: `https://api.cartoncloud.com/tenants/${tenantId}/outbound-orders/search`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Version': '1',
        Authorization: `Bearer ${bundle.authData.access_token}`,
      },
      params: { page, size: pageSize },
      body: { condition },
    });

    const orders = response.json;
    if (Array.isArray(orders)) {
      for (const order of orders) {
        results.push(order);
        if (results.length >= maxResults) break;
      }
    }

    totalPages = parseInt(response.getHeader('Total-Pages') || '1', 10);
    page++;
  } while (page <= totalPages && results.length < maxResults);

  return results;
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
          'CartonCloud tenant ID (UUID) to search within. Call the New Tenant tool first if unknown.',
        required: true,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'order_reference',
        label: 'Order Reference',
        type: 'string',
        helpText:
          'Optional. Match the customer-facing order reference (e.g. "ORD-001"). Matching mode is controlled by Reference Match Mode (defaults to CONTAINS).',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'reference_match',
        label: 'Reference Match Mode',
        type: 'string',
        choices: ['CONTAINS', 'STARTS_WITH', 'EQUAL_TO'],
        default: 'CONTAINS',
        helpText:
          'How Order Reference is matched. CONTAINS (substring), STARTS_WITH (prefix), or EQUAL_TO (exact). Ignored if Order Reference is empty.',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'customer_id',
        label: 'Customer ID',
        type: 'string',
        dynamic: 'new_customer.id.name',
        helpText:
          'Optional CartonCloud customer ID (UUID) to filter by (exact match). Obtain via the New Customer tool.',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'customer_name',
        label: 'Customer Name',
        type: 'string',
        helpText:
          'Optional. Substring match (CONTAINS) on the customer name. Useful when you have a name but not a customer_id.',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'timestamp_field',
        label: 'Timestamp Field',
        type: 'string',
        choices: ['created', 'modified', 'dispatched', 'packed'],
        helpText:
          'Which order timestamp the date range applies to. Required if date_from or date_to is set. One of: created, modified, dispatched, packed.',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'date_from',
        label: 'Date From (YYYY-MM-DD)',
        type: 'string',
        helpText:
          'Optional start of the date range (inclusive), as YYYY-MM-DD. CartonCloud\'s search API does not support range/GT/LT operators on timestamps, so this is implemented by OR-ing STARTS_WITH conditions for each day in [date_from, date_to]. Max range: 31 days. If only date_from is set, date_to defaults to the same day.',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'date_to',
        label: 'Date To (YYYY-MM-DD)',
        type: 'string',
        helpText:
          'Optional end of the date range (inclusive), as YYYY-MM-DD. See date_from for behaviour. Must be >= date_from. Max 31-day span.',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'max_results',
        label: 'Max Results',
        type: 'integer',
        default: '50',
        helpText:
          'Maximum number of orders to return (1–500). The tool paginates the CartonCloud search internally until this many are collected or results are exhausted. Defaults to 50.',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
    ],
  },
  display: {
    description:
      'Finds outbound (sale) orders by order reference, customer, and/or a date range (max 31 days). At least one filter is required.',
    hidden: false,
    label: 'Search Outbound Orders',
  },
  key: 'search_outbound_orders',
  noun: 'Outbound Order',
};

# Carton Cloud (Unofficial) — Zapier CLI Integration

A Zapier CLI integration for [CartonCloud](https://www.cartoncloud.com/), a transport management system (TMS) and warehouse management system (WMS).

## Authentication

Uses **session auth** with OAuth2 client credentials. Provide your `Client ID` and `Client Secret` from the CartonCloud API — the integration exchanges these for a Bearer token automatically.

## Triggers

| Key | Label | Description |
|-----|-------|-------------|
| `new_tenant` | New Tenant | Returns tenants the authenticated user has access to. Hidden — used as a dynamic dropdown. |
| `new_customer` | New Customer | Returns customers for a given tenant. Hidden — used as a dynamic dropdown. |

## Actions (Creates)

| Key | Label | Description |
|-----|-------|-------------|
| `create_outbound_order` | Create Outbound Order | Creates an outbound (sales) order with line items, delivery address, and optional date fields. |
| `create_report_run` | Create Report Run | Initiates a report (STOCK_ON_HAND or BULK_CHARGES) and polls until complete. |
| `get_outbound_order` | Get Outbound Order | Retrieves an outbound order by ID. |

## Searches

| Key | Label | Description |
|-----|-------|-------------|
| `get_product` | Get Product | Finds a warehouse product by ID. |
| `retrieve_report` | Retrieve Report | Retrieves the results of a completed report run. Hidden. |

## Development

### Prerequisites

- Node.js >= 22
- [Zapier CLI](https://www.npmjs.com/package/zapier-platform-cli) (`npm install -g zapier-platform-cli`)

### Setup

```bash
npm install
```

Copy `.env` and fill in your credentials:

```
CLIENT_ID=your_client_id
CLIENT_SECRET=your_client_secret

# Test fixture IDs
TEST_TENANT_ID=your_tenant_uuid
TEST_CUSTOMER_ID=your_customer_uuid
TEST_PRODUCT_ID=your_product_uuid
TEST_ORDER_ID=your_order_uuid
```

### Testing

```bash
npm test
```

All tests are integration tests that hit the live CartonCloud API. A shared helper (`test/helpers.js`) pre-fetches an access token once per test suite.

### Validate

```bash
zapier validate
```

### Deploy

```bash
zapier push
```

## Project Structure

```
.
├── authentication.js              # Session auth (client credentials → Bearer token)
├── index.js                       # Main entry point, registers all operations
├── triggers/
│   ├── new_tenant.js              # Dynamic dropdown for tenants
│   └── new_customer.js            # Dynamic dropdown for customers
├── creates/
│   ├── create_outbound_order.js   # Create outbound order
│   ├── create_report_run.js       # Create + poll report
│   └── get_outbound_order.js      # Get order by ID
├── searches/
│   ├── get_product.js             # Get product by ID
│   └── retrieve_report.js         # Retrieve report results
└── test/
    ├── helpers.js                 # Shared auth helper for tests
    ├── authentication.test.js
    ├── triggers/
    ├── creates/
    └── searches/
```

# gg-rsvp-sdk

JavaScript/TypeScript SDK to integrate RSVP forms into external websites.

## Installation

```bash
npm install gg-rsvp-sdk
```

## Usage

### Initialization

```ts
import { createEventsSDK } from "gg-rsvp-sdk";

const sdk = createEventsSDK({
  companyId: "your-company-id",
  baseUrl: "https://your-rsvp-backend.com", // optional, default: "/"
});
```

Each internal `fetch` adds `x-origin` with the **current** client origin (`location.origin` in the browser, evaluated when the request runs). The browser still sets the real `Origin` header itself; use `x-origin` on the server if you need the embedding page explicitly. In non-browser environments without `location`, the header is omitted.

### Fetch event configuration

```ts
const config = await sdk.getEventConfig("event-id");
// config also includes: event_multi_slot, event_location, event_logo, company_logo, company
console.log(config.title, config.field_configuration, config.event_slots);
```

### Get form definition (JSON) for custom rendering

Returns a structured JSON with fields, slots and title so you can build the form however you want (React, Vue, custom HTML, etc.):

```ts
const def = await sdk.getFormDefinition("event-id");
// def = { eventId, title, fields, slots, singleSlot, multiSlotSelection, eventLocation, eventLogo, companyLogo, company }
// def.fields = [{ id, label, slug, type, required, placeholder, options?, ... }]
// def.slots = [{ id, title, capacity, starts_at, ends_at }]
// def.singleSlot = true when there's only one slot (no slot selector needed)
// def.multiSlotSelection mirrors API field `event_multi_slot` (checkboxes + one POST per slot when true)
// eventLocation / eventLogo / companyLogo / company mirror API snake_case fields on the form response
```

### Render form in the DOM

```html
<div id="rsvp-container"></div>
```

```ts
await sdk.renderForm("rsvp-container", "event-id", {
  onSuccess: () => alert("RSVP submitted!"),
  onError: (err) => console.error(err),
  onSubmit: () => console.log("Submitting..."),
});
```

### Submit RSVP programmatically

```ts
await sdk.submitRSVP("slot-id", {
  email: "user@example.com",
  first_name: "John",
  last_name: "Doe",
  // ... other fields from field_configuration
});

// Multi-slot: same payload, one POST per slot id
await sdk.submitRSVPForSlots(["slot-a", "slot-b"], {
  email: "user@example.com",
});
```

## API

| Method | Description |
|--------|-------------|
| `getEventConfig(eventId)` | Fetches raw form configuration from the API |
| `getFormDefinition(eventId)` | Returns JSON form definition (fields, slots, title) for custom rendering |
| `renderForm(containerId, eventId, callbacks?)` | Injects the form into the DOM |
| `submitRSVP(slotId, data)` | Submits data to the API |
| `submitRSVPForSlots(slotIds, data)` | Submits the same data for each slot sequentially (stops on first error) |

## Security

- All requests include the `x-company-id` header
- In the browser, requests also include `x-origin` from `location.origin` at call time
- Domain whitelist is enforced on the backend
- The SDK only passes the required parameters

## Styles

Import base styles (optional):

```html
<link rel="stylesheet" href="node_modules/gg-rsvp-sdk/dist/styles.css" />
```

Or via import (bundler):
```js
import "gg-rsvp-sdk/dist/styles.css";
```

You can also customize using the `.rsvp-sdk-*` classes (Tailwind, custom CSS).

## Build

```bash
npm install
npm run build
```

Output: `dist/` with ESM, CJS and TypeScript types.

## Test

Requires Node 20+ (see `engines` in package.json).

```bash
npm run test        # run once
npm run test:watch  # watch mode
```

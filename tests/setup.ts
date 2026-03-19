import { vi } from "vitest";

// Mock fetch globally before any test runs - prevents "Failed to fetch" when
// the real fetch is used (e.g. in happy-dom/Node without network).
// Each test overrides this in beforeEach with specific responses.
vi.stubGlobal(
  "fetch",
  vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({}),
    status: 200,
  })
);

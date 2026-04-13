import { describe, it, expect, vi, beforeEach } from "vitest";
import { createEventsSDK } from "../src/index";
import type { EventFormConfig, EventSlot, FormField } from "../src/types";

const mockEventConfig: EventFormConfig = {
  id: "evt-1",
  title: "Test Event",
  field_configuration: [
    {
      id: "f1",
      label: "Email",
      slug: "email",
      type: "email",
      required: true,
      sort: 0,
    },
    {
      id: "f2",
      label: "Name",
      slug: "name",
      type: "text",
      required: false,
      sort: 1,
      placeholder: "Your name",
    },
  ] as FormField[],
  event_slots: [
    {
      id: "slot-1",
      title: "Slot A",
      capacity: 10,
      starts_at: "2025-04-01T10:00:00Z",
      ends_at: "2025-04-01T12:00:00Z",
    },
  ] as EventSlot[],
};

describe("EventsSDK", () => {
  const baseUrl = "https://api.example.com";
  let sdk: ReturnType<typeof createEventsSDK>;

  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockEventConfig),
          status: 200,
        })
      )
    );
    sdk = createEventsSDK({
      companyId: "company-123",
      baseUrl,
    });
  });

  describe("getEventConfig", () => {
    it("fetches event config from API", async () => {
      const config = await sdk.getEventConfig("evt-1");

      expect(fetch).toHaveBeenCalledWith(
        `${baseUrl}/api/events/evt-1/form`,
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            "x-company-id": "company-123",
            "x-origin": window.location.origin,
          }),
        })
      );
      expect(config).toEqual(mockEventConfig);
      expect(config.title).toBe("Test Event");
      expect(config.event_slots).toHaveLength(1);
    });

    it("throws on HTTP error", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(() =>
          Promise.resolve({
            ok: false,
            status: 404,
            json: () => Promise.resolve({ message: "Event not found" }),
          })
        )
      );

      await expect(sdk.getEventConfig("evt-999")).rejects.toThrow(
        "Event not found"
      );
    });

    it("throws on network error", async () => {
      vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("Network error"))));

      await expect(sdk.getEventConfig("evt-1")).rejects.toThrow("Network error");
    });

    it("wraps 'Failed to fetch' with helpful message", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(() => Promise.reject(new TypeError("Failed to fetch")))
      );

      await expect(sdk.getEventConfig("evt-1")).rejects.toThrow(
        "Check baseUrl, CORS policy, and network connection"
      );
    });
  });

  describe("getFormDefinition", () => {
    it("returns parsed form definition with fields and slots", async () => {
      const def = await sdk.getFormDefinition("evt-1");

      expect(def).toEqual({
        eventId: "evt-1",
        title: "Test Event",
        fields: expect.arrayContaining([
          expect.objectContaining({ slug: "email", type: "email" }),
          expect.objectContaining({ slug: "name", type: "text" }),
        ]),
        slots: mockEventConfig.event_slots,
        singleSlot: true,
        multiSlotSelection: false,
        eventMultiSlot: false,
        eventLocation: null,
        eventLogo: null,
        companyLogo: null,
        company: null,
      });
      expect(def.fields).toHaveLength(2);
      expect(def.singleSlot).toBe(true);
    });

    it("sets singleSlot false when multiple slots and slots field exists", async () => {
      const multiSlotConfig: EventFormConfig = {
        ...mockEventConfig,
        field_configuration: [
          ...(mockEventConfig.field_configuration as FormField[]),
          { id: "f3", label: "Slot", slug: "slot", type: "slots", required: true, sort: 2 },
        ],
        event_slots: [
          ...mockEventConfig.event_slots,
          {
            id: "slot-2",
            title: "Slot B",
            capacity: 5,
            starts_at: "2025-04-02T10:00:00Z",
            ends_at: "2025-04-02T12:00:00Z",
          },
        ],
      };

      vi.stubGlobal(
        "fetch",
        vi.fn(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(multiSlotConfig),
            status: 200,
          })
        )
      );

      const def = await sdk.getFormDefinition("evt-1");
      expect(def.singleSlot).toBe(false);
      expect(def.multiSlotSelection).toBe(false);
      expect(def.slots).toHaveLength(2);
    });

    it("sets multiSlotSelection when event_multi_slot is true", async () => {
      const multiSelectConfig: EventFormConfig = {
        ...mockEventConfig,
        event_multi_slot: true,
        field_configuration: [
          ...(mockEventConfig.field_configuration as FormField[]),
          {
            id: "f3",
            label: "Slots",
            slug: "slots",
            type: "slots",
            required: true,
            sort: 2,
          },
        ],
        event_slots: [
          ...mockEventConfig.event_slots,
          {
            id: "slot-2",
            title: "Slot B",
            capacity: 5,
            starts_at: "2025-04-02T10:00:00Z",
            ends_at: "2025-04-02T12:00:00Z",
          },
        ],
      };

      vi.stubGlobal(
        "fetch",
        vi.fn(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(multiSelectConfig),
            status: 200,
          })
        )
      );

      const def = await sdk.getFormDefinition("evt-1");
      expect(def.multiSlotSelection).toBe(true);
      expect(def.eventMultiSlot).toBe(true);
    });

    it("sets multiSlotSelection when slot_display is checkbox without event_multi_slot", async () => {
      const cfg: EventFormConfig = {
        ...mockEventConfig,
        event_multi_slot: false,
        field_configuration: [
          ...(mockEventConfig.field_configuration as FormField[]),
          {
            id: "f3",
            label: "Slots",
            slug: "slots",
            type: "slots",
            required: true,
            sort: 2,
            slot_display: "checkbox",
          },
        ],
        event_slots: [
          ...mockEventConfig.event_slots,
          {
            id: "slot-2",
            title: "Slot B",
            capacity: 5,
            starts_at: "2025-04-02T10:00:00Z",
            ends_at: "2025-04-02T12:00:00Z",
          },
        ],
      };

      vi.stubGlobal(
        "fetch",
        vi.fn(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(cfg),
            status: 200,
          })
        )
      );

      const def = await sdk.getFormDefinition("evt-1");
      expect(def.multiSlotSelection).toBe(true);
      expect(def.eventMultiSlot).toBe(false);
    });

    it("uses select when slot_display is select even if event_multi_slot is true", async () => {
      const cfg: EventFormConfig = {
        ...mockEventConfig,
        event_multi_slot: true,
        field_configuration: [
          ...(mockEventConfig.field_configuration as FormField[]),
          {
            id: "f3",
            label: "Slots",
            slug: "slots",
            type: "slots",
            required: true,
            sort: 2,
            slot_display: "select",
          },
        ],
        event_slots: [
          ...mockEventConfig.event_slots,
          {
            id: "slot-2",
            title: "Slot B",
            capacity: 5,
            starts_at: "2025-04-02T10:00:00Z",
            ends_at: "2025-04-02T12:00:00Z",
          },
        ],
      };

      vi.stubGlobal(
        "fetch",
        vi.fn(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(cfg),
            status: 200,
          })
        )
      );

      const def = await sdk.getFormDefinition("evt-1");
      expect(def.multiSlotSelection).toBe(false);
      expect(def.eventMultiSlot).toBe(true);
    });

    it("maps event_location, logos and company from API", async () => {
      const richConfig: EventFormConfig = {
        ...mockEventConfig,
        event_location: "Via Roma 1, Milano",
        event_logo: "https://cdn.example.com/event.png",
        company_logo: "https://cdn.example.com/co.png",
        company: "Acme Srl",
      };

      vi.stubGlobal(
        "fetch",
        vi.fn(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(richConfig),
            status: 200,
          })
        )
      );

      const def = await sdk.getFormDefinition("evt-1");
      expect(def.eventLocation).toBe("Via Roma 1, Milano");
      expect(def.eventLogo).toBe("https://cdn.example.com/event.png");
      expect(def.companyLogo).toBe("https://cdn.example.com/co.png");
      expect(def.company).toBe("Acme Srl");
    });
  });

  describe("submitRSVP", () => {
    it("submits RSVP data to API", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn((url: string, opts?: RequestInit) => {
          if (url.includes("/submissions")) {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({ resourceId: "sub-123" }),
              status: 200,
            });
          }
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockEventConfig),
            status: 200,
          });
        })
      );

      const result = await sdk.submitRSVP("slot-1", {
        email: "user@example.com",
        name: "John",
      });

      expect(fetch).toHaveBeenCalledWith(
        `${baseUrl}/api/event_slots/slot-1/submissions`,
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            "x-company-id": "company-123",
            "x-origin": window.location.origin,
          }),
          body: JSON.stringify({ email: "user@example.com", name: "John" }),
        })
      );
      expect(result).toEqual({ submissionId: "sub-123" });
    });

    it("throws on submit error", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(() =>
          Promise.resolve({
            ok: false,
            status: 422,
            json: () => Promise.resolve({ message: "Email already registered" }),
          })
        )
      );

      await expect(
        sdk.submitRSVP("slot-1", { email: "existing@example.com" })
      ).rejects.toThrow("Email already registered");
    });
  });

  describe("submitRSVPForSlots", () => {
    it("posts once per slot with the same body", async () => {
      const fetchMock = vi.fn((url: string) => {
        if (url.includes("/submissions")) {
          const id = url.includes("slot-1") ? "sub-a" : "sub-b";
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ resourceId: id }),
            status: 200,
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockEventConfig),
          status: 200,
        });
      });
      vi.stubGlobal("fetch", fetchMock);

      const result = await sdk.submitRSVPForSlots(
        ["slot-1", "slot-2"],
        { email: "u@example.com" }
      );

      expect(fetchMock).toHaveBeenCalledWith(
        `${baseUrl}/api/event_slots/slot-1/submissions`,
        expect.objectContaining({
          body: JSON.stringify({ email: "u@example.com" }),
        })
      );
      expect(fetchMock).toHaveBeenCalledWith(
        `${baseUrl}/api/event_slots/slot-2/submissions`,
        expect.objectContaining({
          body: JSON.stringify({ email: "u@example.com" }),
        })
      );
      expect(result.submissionIds).toEqual(["sub-a", "sub-b"]);
    });
  });

  describe("renderForm", () => {
    it("injects form into container", async () => {
      document.body.innerHTML = '<div id="rsvp-container"></div>';

      await sdk.renderForm("rsvp-container", "evt-1");

      const container = document.getElementById("rsvp-container");
      expect(container?.innerHTML).toContain("Test Event");
      expect(container?.innerHTML).toContain('name="email"');
      expect(container?.innerHTML).toContain('name="name"');
      expect(container?.querySelector("form")).toBeTruthy();
      expect(container?.querySelector("button[type=submit]")).toBeTruthy();
    });

    it("throws when container not found", async () => {
      document.body.innerHTML = "";

      await expect(sdk.renderForm("missing-container", "evt-1")).rejects.toThrow(
        "Container #missing-container not found"
      );
    });

    it("renders slot checkboxes when event_multi_slot is true", async () => {
      const multiSelectConfig: EventFormConfig = {
        ...mockEventConfig,
        event_multi_slot: true,
        field_configuration: [
          ...(mockEventConfig.field_configuration as FormField[]),
          {
            id: "f3",
            label: "Pick slots",
            slug: "slots",
            type: "slots",
            required: true,
            sort: 2,
          },
        ],
        event_slots: [
          ...mockEventConfig.event_slots,
          {
            id: "slot-2",
            title: "Slot B",
            capacity: 5,
            starts_at: "2025-04-02T10:00:00Z",
            ends_at: "2025-04-02T12:00:00Z",
          },
        ],
      };

      vi.stubGlobal(
        "fetch",
        vi.fn(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(multiSelectConfig),
            status: 200,
          })
        )
      );

      document.body.innerHTML = '<div id="rsvp-container"></div>';
      await sdk.renderForm("rsvp-container", "evt-1");

      const container = document.getElementById("rsvp-container");
      const checks = container?.querySelectorAll('input[type="checkbox"][name="slotId"]');
      expect(checks?.length).toBe(2);
      expect(container?.innerHTML).toContain("rsvp-sdk-field-slots-multi");
    });

    it("renders message field with content HTML", async () => {
      const msgConfig: EventFormConfig = {
        ...mockEventConfig,
        field_configuration: [
          ...(mockEventConfig.field_configuration as FormField[]),
          {
            id: "m1",
            label: "Info",
            slug: "info",
            type: "message",
            required: false,
            sort: 10,
            content: "<p>Hello <strong>world</strong></p>",
          },
        ] as FormField[],
      };

      vi.stubGlobal(
        "fetch",
        vi.fn(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve(msgConfig),
            status: 200,
          })
        )
      );

      document.body.innerHTML = '<div id="rsvp-container"></div>';
      await sdk.renderForm("rsvp-container", "evt-1");

      const container = document.getElementById("rsvp-container");
      expect(container?.querySelector(".rsvp-sdk-field-message")).toBeTruthy();
      expect(container?.innerHTML).toContain("<strong>world</strong>");
    });
  });
});

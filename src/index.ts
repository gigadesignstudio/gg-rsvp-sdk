/**
 * @tuo-brand/events-sdk
 * SDK to integrate RSVP forms into external websites.
 * Based on app/pages/playground.vue logic
 */

import type {
  EventFormConfig,
  EventSlot,
  FormDefinition,
  FormField,
  RsvpSubmissionData,
} from "./types";

export type {
  EventFormConfig,
  EventSlot,
  FormDefinition,
  FormField,
  RsvpSubmissionData,
} from "./types";

export interface EventsSDKOptions {
  companyId: string;
  baseUrl?: string;
}

const DEFAULT_BASE_URL = "/";

function parseFieldConfig(
  config: EventFormConfig["field_configuration"]
): FormField[] {
  if (!config || typeof config !== "object") return [];
  const list: FormField[] = Array.isArray(config)
    ? config
    : (Object.values(config) as FormField[]);
  return list.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
}

function formatSlotDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function getDefaultHeaders(companyId: string): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "x-company-id": companyId,
  };
}

export class EventsSDK {
  private companyId: string;
  private baseUrl: string;

  constructor(options: EventsSDKOptions) {
    this.companyId = options.companyId;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
  }

  /**
   * Returns the form definition as JSON (fields, slots, title).
   * Use this to build the form UI however you want (React, Vue, custom HTML, etc.).
   */
  async getFormDefinition(eventId: string): Promise<FormDefinition> {
    const config = await this.getEventConfig(eventId);
    const fields = parseFieldConfig(config.field_configuration);
    const slots = config.event_slots ?? [];
    const hasSlotField = fields.some((f) => f.type === "slots");
    const singleSlot = slots.length === 1 && !hasSlotField;

    return {
      eventId: config.id,
      title: config.title,
      fields,
      slots,
      singleSlot,
    };
  }

  /**
   * Fetches the event configuration (form fields, slots, etc.)
   */
  async getEventConfig(eventId: string): Promise<EventFormConfig> {
    const url = `${this.baseUrl}/api/events/${eventId}/form`;
    const res = await fetch(url, {
      method: "GET",
      headers: getDefaultHeaders(this.companyId),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.statusMessage ?? err?.message ?? `HTTP ${res.status}`);
    }

    return res.json();
  }

  /**
   * Injects the form into the DOM (vanilla HTML/JS for maximum compatibility).
   * @param containerId - ID of the DOM element to render the form into
   * @param eventId - Event ID
   * @param callbacks - Optional callbacks (onSuccess, onError, onSubmit)
   */
  async renderForm(
    containerId: string,
    eventId: string,
    callbacks?: {
      onSuccess?: () => void;
      onError?: (err: Error) => void;
      onSubmit?: () => void;
    }
  ): Promise<void> {
    const def = await this.getFormDefinition(eventId);
    const { fields, slots, singleSlot } = def;
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container #${containerId} not found`);
    }

    const formId = `rsvp-form-${eventId}-${Date.now()}`;

    let html = `
      <form id="${formId}" class="rsvp-sdk-form" data-event-id="${eventId}">
        <h2 class="rsvp-sdk-title">${escapeHtml(def.title)}</h2>
        <div class="rsvp-sdk-fields">
    `;

    for (const field of fields) {
      const requiredMark = field.required ? '<span class="rsvp-sdk-required">*</span>' : "";
      const label = `<label class="rsvp-sdk-label">${escapeHtml(field.label)} ${requiredMark}</label>`;

      if (field.type === "slots") {
        html += `
          <div class="rsvp-sdk-field" data-slug="${escapeHtml(field.slug)}">
            ${label}
            <select class="rsvp-sdk-select" name="slotId" required>
              <option value="">Select slot</option>
              ${slots
                .map(
                  (s) =>
                    `<option value="${escapeHtml(s.id)}">${escapeHtml(
                      s.title || formatSlotDate(s.starts_at)
                    )}</option>`
                )
                .join("")}
            </select>
          </div>
        `;
      } else if (field.type === "checkbox") {
        html += `
          <div class="rsvp-sdk-field rsvp-sdk-field-checkbox" data-slug="${escapeHtml(field.slug)}">
            <label class="rsvp-sdk-checkbox-wrap">
              <input type="checkbox" name="${escapeHtml(field.slug)}" class="rsvp-sdk-checkbox" />
              <span>${escapeHtml(field.label)}</span>
            </label>
          </div>
        `;
      } else if (field.type === "select") {
        const opts = (field.options ?? [])
          .map(
            (o) =>
              `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`
          )
          .join("");
        html += `
          <div class="rsvp-sdk-field" data-slug="${escapeHtml(field.slug)}">
            ${label}
            <select class="rsvp-sdk-select" name="${escapeHtml(field.slug)}" ${field.required ? "required" : ""}>
              <option value="">${escapeHtml(field.placeholder ?? "Select...")}</option>
              ${opts}
            </select>
          </div>
        `;
      } else if (field.type === "textarea") {
        html += `
          <div class="rsvp-sdk-field" data-slug="${escapeHtml(field.slug)}">
            ${label}
            <textarea class="rsvp-sdk-textarea" name="${escapeHtml(field.slug)}" placeholder="${escapeHtml(field.placeholder ?? "")}" ${field.required ? "required" : ""}></textarea>
          </div>
        `;
      } else {
        const inputType = ["text", "email", "number", "date"].includes(field.type)
          ? field.type
          : "text";
        html += `
          <div class="rsvp-sdk-field" data-slug="${escapeHtml(field.slug)}">
            ${label}
            <input type="${inputType}" class="rsvp-sdk-input" name="${escapeHtml(field.slug)}" placeholder="${escapeHtml(field.placeholder ?? "")}" ${field.required ? "required" : ""} />
          </div>
        `;
      }
    }

    if (singleSlot) {
      const s = slots[0]!;
      html += `
        <div class="rsvp-sdk-single-slot">
          Slot: ${escapeHtml(s.title || formatSlotDate(s.starts_at))}
        </div>
      `;
    }

    html += `
        </div>
        <button type="submit" class="rsvp-sdk-submit">Submit RSVP</button>
      </form>
    `;

    container.innerHTML = html;

    const form = document.getElementById(formId) as HTMLFormElement;
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      callbacks?.onSubmit?.();

      const formData = new FormData(form);
      const slotId = singleSlot
        ? slots[0]!.id
        : (formData.get("slotId") as string);
      if (!slotId) {
        callbacks?.onError?.(new Error("Please select a slot"));
        return;
      }

      const emailField = fields.find((f) => f.type === "email");
      const email = emailField
        ? (formData.get(emailField.slug) as string)
        : (formData.get("email") as string);
      if (!email) {
        callbacks?.onError?.(new Error("Email is required"));
        return;
      }

      const body: RsvpSubmissionData = { email };
      for (const f of fields) {
        if (f.type === "email" || f.type === "slots") continue;
        const val = formData.get(f.slug);
        if (f.type === "checkbox") {
          body[f.slug] = !!val;
        } else if (val != null && val !== "") {
          body[f.slug] = val as string;
        }
      }

      try {
        await this.submitRSVP(slotId, body);
        callbacks?.onSuccess?.();
      } catch (err) {
        callbacks?.onError?.(err instanceof Error ? err : new Error(String(err)));
      }
    });
  }

  /**
   * Submits RSVP data to the API.
   * @param slotId - Slot ID (from event config)
   * @param data - Form data (email required + custom fields)
   */
  async submitRSVP(
    slotId: string,
    data: RsvpSubmissionData
  ): Promise<{ submissionId: string }> {
    const url = `${this.baseUrl}/api/event_slots/${slotId}/submissions`;
    const res = await fetch(url, {
      method: "POST",
      headers: getDefaultHeaders(this.companyId),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.statusMessage ?? err?.message ?? `HTTP ${res.status}`);
    }

    const result = await res.json();
    return { submissionId: result.resourceId ?? result.id ?? "" };
  }
}

function escapeHtml(s: string): string {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

/**
 * Factory to create an SDK instance
 */
export function createEventsSDK(options: EventsSDKOptions): EventsSDK {
  return new EventsSDK(options);
}

export default EventsSDK;

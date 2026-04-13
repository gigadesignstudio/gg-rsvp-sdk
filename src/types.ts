/**
 * Interfaces aligned with rsvp-frontend repo (playground, API)
 */

export type FormFieldType =
  | "text"
  | "textarea"
  | "number"
  | "email"
  | "date"
  | "checkbox"
  | "select"
  | "slots"
  | "message";

/** For `type: "slots"`: how to render slot choices (from API `slot_display`). */
export type SlotDisplay = "checkbox" | "select";

export interface FormFieldOption {
  label: string;
  value: string;
}

export interface FormField {
  id: string;
  label: string;
  slug: string;
  type: FormFieldType;
  required: boolean;
  sort?: number;
  placeholder?: string;
  options?: FormFieldOption[];
  /** When `type` is `slots`: `checkbox` = multi-select + one submission per slot; `select` = single select. */
  slot_display?: SlotDisplay;
  /** When `type` is `message`: HTML snippet to display (trusted API content, no user input). */
  content?: string | null;
}

export interface EventSlot {
  id: string;
  title: string | null;
  capacity: number | null;
  starts_at: string;
  ends_at: string;
}

export interface EventFormConfig {
  id: string;
  title: string;
  field_configuration: Record<string, FormField> | FormField[] | null;
  event_slots: EventSlot[];
  /** From GET form: when true, users can select multiple slots (one submission per slot). */
  event_multi_slot?: boolean;
  event_location?: string | null;
  /** URL of the event image/logo. */
  event_logo?: string | null;
  /** URL of the company logo. */
  company_logo?: string | null;
  /** Company name or identifier from the API. */
  company?: string | null;
}

export interface RsvpSubmissionData {
  email: string;
  occupiedSeats?: number;
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Form definition in JSON format for custom rendering.
 * Use this to build the form UI however you want.
 */
export interface FormDefinition {
  eventId: string;
  title: string;
  fields: FormField[];
  slots: EventSlot[];
  singleSlot: boolean;
  /** True when any `slots` field uses `slot_display: "checkbox"` (or legacy `event_multi_slot` if `slot_display` omitted). */
  multiSlotSelection: boolean;
  /** Mirrors API `event_multi_slot` (used when `slot_display` is omitted on slots fields). */
  eventMultiSlot: boolean;
  eventLocation: string | null;
  eventLogo: string | null;
  companyLogo: string | null;
  company: string | null;
}

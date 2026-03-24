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
  | "slots";

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
  /** Mirrors `event_multi_slot` from the form API response. */
  multiSlotSelection: boolean;
  eventLocation: string | null;
  eventLogo: string | null;
  companyLogo: string | null;
  company: string | null;
}

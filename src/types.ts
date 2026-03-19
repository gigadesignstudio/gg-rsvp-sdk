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
}

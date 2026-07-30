// src/components/forms/action-result.ts
export type ActionResult =
  | { ok: true; redirect?: string }
  | {
      ok: false
      formError?: string
      fieldErrors?: Record<string, string>
      // Echo of the submitted values so the form can repopulate after a
      // failed submit. Never include secrets like passwords here.
      values?: Record<string, string>
    }

export const INITIAL_ACTION_STATE: ActionResult = { ok: false }

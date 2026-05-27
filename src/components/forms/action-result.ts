// src/components/forms/action-result.ts
export type ActionResult =
  | { ok: true; redirect?: string }
  | {
      ok: false
      formError?: string
      fieldErrors?: Record<string, string>
    }

export const INITIAL_ACTION_STATE: ActionResult = { ok: false }

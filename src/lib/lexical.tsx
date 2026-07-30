import { RichText } from '@payloadcms/richtext-lexical/react'

/**
 * Server-rendered Lexical rich-text. Tolerates null/undefined so sections
 * can call <Lexical data={field} /> unconditionally on optional fields.
 */
export function Lexical({ data }: { data: unknown }) {
  if (!data) return null
  // The RichText component expects a SerializedEditorState; Payload's
  // generated types use a more permissive shape. Cast is intentional.
  return <RichText data={data as never} />
}

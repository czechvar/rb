import type { DefaultNodeTypes, SerializedBlockNode } from '@payloadcms/richtext-lexical'
import { RichText, type JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'

type VideoEmbedFields = { url?: string | null }
type NodeTypes = DefaultNodeTypes | SerializedBlockNode<VideoEmbedFields>

const converters: JSXConvertersFunction<NodeTypes> = ({ defaultConverters }) => ({
  ...defaultConverters,
  blocks: {
    videoEmbed: ({ node }: { node: SerializedBlockNode<VideoEmbedFields> }) =>
      node.fields.url ? (
        <iframe
          src={node.fields.url}
          title="Embedded video"
          loading="lazy"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          style={{ width: '100%', aspectRatio: '16 / 9', border: 0 }}
        />
      ) : null,
  },
})

/**
 * Server-rendered Lexical rich-text. Tolerates null/undefined so sections
 * can call <Lexical data={field} /> unconditionally on optional fields.
 */
export function Lexical({ data }: { data: unknown }) {
  if (!data) return null
  // The RichText component expects a SerializedEditorState; Payload's
  // generated types use a more permissive shape. Cast is intentional.
  return <RichText converters={converters} data={data as never} />
}

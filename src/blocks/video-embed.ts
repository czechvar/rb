import type { Block } from 'payload'

/**
 * External video embedded in rich text (YouTube/Vimeo/EpicTV/Facebook player
 * URLs). Rendered as a responsive iframe by the Lexical renderer.
 */
export const videoEmbedBlock: Block = {
  slug: 'videoEmbed',
  labels: { singular: 'Video Embed', plural: 'Video Embeds' },
  fields: [
    {
      name: 'url',
      type: 'text',
      required: true,
      label: 'Embed URL',
      admin: {
        description: 'Player/embed URL, e.g. https://www.youtube.com/embed/<video-id>',
      },
    },
  ],
}

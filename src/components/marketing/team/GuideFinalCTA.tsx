import { CTABlock } from '@/components/blocks/CTABlock'

export function GuideFinalCTA({ firstName }: { firstName: string }) {
  return (
    <div id="contact">
      <CTABlock
        blockType="cta"
        variant="finalRed"
        eyebrow="Ready when you are"
        heading="Let’s get on the rock"
        body={`Find a climbing trip or coaching format with ${firstName} that fits your goals.`}
        primaryAction={{ label: 'Find your trip', href: '/calendar' }}
        secondaryAction={{ label: 'Meet the full crew', href: '/team' }}
      />
    </div>
  )
}

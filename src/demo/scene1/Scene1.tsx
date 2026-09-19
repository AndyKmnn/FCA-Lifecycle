import { Button, Label, Surface } from '../../design'
import type { SceneProps } from '../../shell/types'

/**
 * Scene 1 - Headroom map (10 s). Owned by the demo12 track.
 *
 * To build: Germany with the federal states coloured by proxy headroom from
 * public/data/regions.json, Bavaria lighting up, the site pin pulsing.
 * Clicking the pin calls onAdvance(). Map stays flat - only panels are neumorphic.
 * A map outline asset belongs in this folder, not in public/data.
 */
export default function Scene1({ onAdvance }: SceneProps) {
  return (
    <Surface className="flex h-full w-full flex-col items-center justify-center gap-6 p-16">
      <Label kind="proxy" note="illustrative" />
      <h2 className="text-5xl font-bold text-ink">Scene 1 - Headroom map</h2>
      <p className="max-w-2xl text-center text-xl text-ink-muted">
        Placeholder. Germany coloured by proxy headroom, Bavaria lights up, the site pin pulses.
      </p>
      <Button size="lg" onClick={onAdvance}>
        Click the pin to continue
      </Button>
    </Surface>
  )
}

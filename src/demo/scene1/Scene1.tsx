import { Button, Label, Surface } from '../../design'
import type { SceneProps } from '../../shell/types'

/**
 * Scene 1 - Headroom map (10 s). Owned by the demo12 track.
 *
 * To build: Germany with the federal states coloured by proxy headroom from
 * public/data/regions.json, Bavaria lighting up, the site pin pulsing.
 * Clicking the pin calls onAdvance(). Map stays flat - only panels are chrome.
 * A map outline asset belongs in this folder, not in public/data.
 */
export default function Scene1({ onAdvance }: SceneProps) {
  return (
    <Surface className="relative flex h-full w-full flex-col items-center justify-center gap-7 overflow-hidden p-16">
      <div aria-hidden className="rule-grid pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative flex flex-col items-center gap-7">
        <Label kind="proxy" note="illustrative" />
        <h2 className="text-[52px] leading-none font-semibold tracking-[-0.03em] text-foreground">
          Scene 1 - Headroom map
        </h2>
        <p className="max-w-[60ch] text-center text-xl leading-relaxed text-muted-foreground">
          Placeholder. Germany coloured by proxy headroom, Bavaria lights up, the site pin pulses.
        </p>
        <Button size="2xl" onClick={onAdvance}>
          Click the pin to continue
        </Button>
      </div>
    </Surface>
  )
}

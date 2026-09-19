import { Link } from 'react-router-dom'
import { Button, Label, Surface } from '../../design'
import type { SceneProps } from '../../shell/types'

/**
 * Scene 3 - Autopilot replay (90 s). Owned by the demo3 track.
 *
 * To build: one year in fast-forward, the Demo DSO day-ahead feed from
 * public/data/limits.json, the schedule re-planning on each limit, three jump-to
 * days, the closing counters and the end card. Figures are in docs/DEMO_SCRIPT.md.
 */
export default function Scene3({ onRestart }: SceneProps) {
  return (
    <Surface className="relative flex h-full w-full flex-col items-center justify-center gap-7 overflow-hidden p-16">
      <div aria-hidden className="rule-grid pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative flex flex-col items-center gap-7">
        <Label kind="simulation" />
        <h2 className="text-[52px] leading-none font-semibold tracking-[-0.03em] text-foreground">
          Scene 3 - Autopilot replay
        </h2>
        <p className="max-w-[60ch] text-center text-xl leading-relaxed text-muted-foreground">
          Placeholder. Day-ahead limits arrive, the schedule re-plans, counters land on 40 months
          skipped and breaches 0.
        </p>
        <div className="flex items-center gap-3">
          <Button size="2xl" onClick={onRestart}>
            Replay
          </Button>
          <Link to="/">
            <Button size="2xl" variant="outline">
              Back to site
            </Button>
          </Link>
        </div>
      </div>
    </Surface>
  )
}

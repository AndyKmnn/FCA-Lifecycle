import { Button, Label, Surface } from '../../design'
import type { SceneProps } from '../../shell/types'

/**
 * Scene 2 - Upload and term sheet (60 s). Owned by the demo12 track.
 *
 * To build: the profile "uploads", the load-duration curve draws, three option
 * cards build in - computed in the browser from public/data/profile.json - then a
 * draft term sheet types itself. Figures are in docs/DEMO_SCRIPT.md.
 */
export default function Scene2({ onAdvance }: SceneProps) {
  return (
    <Surface className="relative flex h-full w-full flex-col items-center justify-center gap-7 overflow-hidden p-16">
      <div aria-hidden className="rule-grid pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative flex flex-col items-center gap-7">
        <Label kind="simulation" />
        <h2 className="text-[52px] leading-none font-semibold tracking-[-0.03em] text-foreground">
          Scene 2 - Upload and term sheet
        </h2>
        <p className="max-w-[60ch] text-center text-xl leading-relaxed text-muted-foreground">
          Placeholder. Load-duration curve, three FCA options with hours and MWh at risk, then the
          draft term sheet.
        </p>
        <Button size="2xl" onClick={onAdvance}>
          See it operate
        </Button>
      </div>
    </Surface>
  )
}

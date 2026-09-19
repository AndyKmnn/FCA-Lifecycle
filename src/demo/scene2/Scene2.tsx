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
    <Surface className="flex h-full w-full flex-col items-center justify-center gap-6 p-16">
      <Label kind="simulation" />
      <h2 className="text-5xl font-bold text-ink">Scene 2 - Upload and term sheet</h2>
      <p className="max-w-2xl text-center text-xl text-ink-muted">
        Placeholder. Load-duration curve, three FCA options with hours and MWh at risk, then the
        draft term sheet.
      </p>
      <Button size="lg" onClick={onAdvance}>
        See it operate
      </Button>
    </Surface>
  )
}

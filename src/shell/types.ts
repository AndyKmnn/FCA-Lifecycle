/**
 * The contract between the shell and a scene. Scenes live in their own folder
 * (src/demo/sceneN) and are imported by the shell, so no track edits the shell.
 */
export interface SceneProps {
  /** Move on to the next scene - same effect as the right arrow. */
  onAdvance: () => void
  /** Jump back to scene 1 and replay from the start. */
  onRestart: () => void
}

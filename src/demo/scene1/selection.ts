/**
 * The district the presenter picked in scene 1, read by scene 2.
 *
 * The shell's SceneProps contract carries no payload between scenes and
 * src/shell is frozen, so the choice lives in this tiny module instead. It is
 * plain module state - no storage, no clock - so a reload starts clean, and
 * scene 1 resets it on mount so `R` replays identically.
 */
let selected: string | null = null

export const setSelectedDistrict = (id: string | null) => {
  selected = id
}

export const getSelectedDistrict = () => selected

import { BinarkaPage } from '@/components/binarka-page'
import { fixtureBoard } from '@/lib/boards'

// Review capture only (iteration 15, FR-65, FR-117): the settings panel open with the focus ring
// on «Темна» («Як у системі» checked); the page follows the system theme.
export default function SettingsFocusPage() {
  return <BinarkaPage board={fixtureBoard} settingsOpen focusThemeOption="dark" />
}

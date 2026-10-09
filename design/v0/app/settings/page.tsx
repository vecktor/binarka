import { BinarkaPage } from '@/components/binarka-page'
import { fixtureBoard } from '@/lib/boards'

// Review capture only (iteration 14, FR-102, FR-107): the settings panel open, «Як у системі»
// and «Українська» checked; the page follows the system theme.
export default function SettingsPage() {
  return <BinarkaPage board={fixtureBoard} settingsOpen />
}

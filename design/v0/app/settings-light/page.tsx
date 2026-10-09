import { BinarkaPage } from '@/components/binarka-page'
import { fixtureBoard } from '@/lib/boards'

// Review capture only (iteration 14, FR-103, FR-104): «Світла» checked, so the page is light
// whatever the system theme (the head script in app/layout.tsx forces it on this route only).
export default function SettingsLightPage() {
  return <BinarkaPage board={fixtureBoard} settingsOpen themeChoice="light" />
}

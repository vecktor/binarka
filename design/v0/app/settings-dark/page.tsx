import { BinarkaPage } from '@/components/binarka-page'
import { fixtureBoard } from '@/lib/boards'

// Review capture only (iteration 14, FR-103, FR-104): «Темна» checked, so the page is dark
// whatever the system theme (the head script in app/layout.tsx forces it on this route only).
export default function SettingsDarkPage() {
  return <BinarkaPage board={fixtureBoard} settingsOpen themeChoice="dark" />
}

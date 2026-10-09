import { BinarkaPage } from '@/components/binarka-page'
import { fixtureBoard } from '@/lib/boards'

// Review capture only: the setup sheet open at 6×6 with «Задачка» checked (FR-95, FR-96).
export default function SetupPage() {
  return <BinarkaPage board={fixtureBoard} level={2} setupOpen />
}

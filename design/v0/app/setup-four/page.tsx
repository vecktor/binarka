import { BinarkaPage } from '@/components/binarka-page'
import { fourBoard } from '@/lib/boards'

// Review capture only: the setup sheet open at 4×4; levels 2 to 4 unavailable (FR-91).
export default function SetupFourPage() {
  return <BinarkaPage board={fourBoard} setupOpen />
}

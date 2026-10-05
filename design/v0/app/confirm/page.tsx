import { BinarkaPage } from '@/components/binarka-page'
import { fixtureBoard } from '@/lib/boards'

export default function ConfirmPage() {
  return <BinarkaPage board={fixtureBoard} confirmOpen />
}

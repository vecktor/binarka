import { BinarkaPage } from '@/components/binarka-page'
import { fixtureBoard } from '@/lib/boards'

export default function RulesPage() {
  return <BinarkaPage board={fixtureBoard} rulesOpen />
}

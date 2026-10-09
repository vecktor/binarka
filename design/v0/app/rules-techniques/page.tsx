import { BinarkaPage } from '@/components/binarka-page'
import { fixtureBoard } from '@/lib/boards'

// Review capture only: the rules panel scrolled to its end: «Складніші прийоми» (FR-93) and the sticky «Зрозуміло», which
// the phone bottom sheet (55dvh) does not show without scrolling.
export default function RulesTechniquesPage() {
  return <BinarkaPage board={fixtureBoard} rulesOpen rulesScrolledToTechniques />
}

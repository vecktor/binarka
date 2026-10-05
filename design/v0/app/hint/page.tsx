import { BinarkaPage } from '@/components/binarka-page'
import { hintBoard } from '@/lib/boards'

export default function HintPage() {
  return (
    <BinarkaPage
      board={hintBoard}
      hintMessage="Два нулі поспіль у рядку 3, тож поруч може стояти лише одиниця, бо три однакові цифри поспіль заборонені."
    />
  )
}

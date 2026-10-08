import { BinarkaPage } from '@/components/binarka-page'
import { solvedBoard } from '@/lib/boards'

export default function WinPage() {
  return <BinarkaPage board={solvedBoard} winMessage="Вітаємо, головоломку розв'язано!" />
}

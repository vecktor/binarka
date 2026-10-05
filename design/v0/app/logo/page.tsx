import { Logo } from '@/components/binarka-page'

// Review capture only: the logo mark at 40, 56 and 64 px (decision 15).
const SIZES = [40, 56, 64] as const

export default function LogoPage() {
  return (
    <div className="logo-sheet">
      {SIZES.map((size) => (
        <figure key={size}>
          <Logo size={size} />
          <figcaption>{size}</figcaption>
        </figure>
      ))}
    </div>
  )
}

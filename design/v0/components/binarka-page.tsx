import { OpenConfirmDialog } from '@/components/open-confirm-dialog'

export type CellSpec = '.' | 'g0' | 'g1' | 'p0' | 'p1' | 'h0' | 'h1'

export type BoardSpec = {
  size: number
  rows: CellSpec[][]
  violations?: ReadonlyArray<readonly [number, number]>
  solved?: boolean
}

type BinarkaPageProps = {
  board: BoardSpec
  hintMessage?: string
  winMessage?: string
  rulesOpen?: boolean
  confirmOpen?: boolean
}

const RAY_COUNT = 12

// «БІНАРКА» outlined from Rubik ExtraBold (SIL OFL 1.1) so the logo needs no font.
const LOGO_WORD_PATH =
  'M18.73 34.6L16.68 34.6Q16.61 34.6 16.55 34.54Q16.5 34.49 16.5 34.41L16.5 34.41L16.5 29.61Q16.5 29.53 16.55 29.48Q16.61 29.42 16.68 29.42L16.68 29.42L20.04 29.42Q20.12 29.42 20.17 29.48Q20.23 29.53 20.23 29.61L20.23 29.61L20.23 30.54Q20.23 30.63 20.17 30.68Q20.12 30.74 20.04 30.74L20.04 30.74L17.95 30.74L17.95 31.35L18.73 31.35Q19.58 31.35 20.07 31.78Q20.56 32.21 20.56 32.96L20.56 32.96Q20.56 33.32 20.44 33.62Q20.32 33.93 20.09 34.14Q19.86 34.36 19.51 34.48Q19.17 34.6 18.73 34.6L18.73 34.6ZM17.95 32.44L17.95 33.48L18.61 33.48Q18.75 33.48 18.86 33.4Q18.96 33.33 19.01 33.21Q19.06 33.09 19.06 32.96L19.06 32.96Q19.06 32.75 18.94 32.59Q18.82 32.44 18.61 32.44L18.61 32.44L17.95 32.44ZM22.31 34.6L21.16 34.6Q21.1 34.6 21.04 34.54Q20.99 34.49 20.99 34.41L20.99 34.41L20.99 29.61Q20.99 29.53 21.04 29.48Q21.1 29.42 21.16 29.42L21.16 29.42L22.31 29.42Q22.39 29.42 22.44 29.48Q22.49 29.53 22.49 29.61L22.49 29.61L22.49 34.41Q22.49 34.49 22.44 34.54Q22.39 34.6 22.31 34.6L22.31 34.6ZM24.6 34.6L23.5 34.6Q23.43 34.6 23.38 34.55Q23.33 34.5 23.33 34.41L23.33 34.41L23.33 29.61Q23.33 29.53 23.38 29.48Q23.43 29.42 23.5 29.42L23.5 29.42L24.6 29.42Q24.68 29.42 24.73 29.48Q24.78 29.53 24.78 29.61L24.78 29.61L24.78 31.28L26.15 31.28L26.15 29.61Q26.15 29.53 26.21 29.48Q26.26 29.42 26.33 29.42L26.33 29.42L27.43 29.42Q27.5 29.42 27.55 29.48Q27.61 29.53 27.61 29.61L27.61 29.61L27.61 34.41Q27.61 34.49 27.55 34.54Q27.5 34.6 27.43 34.6L27.43 34.6L26.33 34.6Q26.26 34.6 26.21 34.54Q26.15 34.49 26.15 34.41L26.15 34.41L26.15 32.69L24.78 32.69L24.78 34.41Q24.78 34.49 24.73 34.54Q24.68 34.6 24.6 34.6L24.6 34.6ZM29.25 34.6L28.21 34.6Q28.15 34.6 28.1 34.55Q28.06 34.5 28.06 34.44L28.06 34.44Q28.06 34.41 28.07 34.39L28.07 34.39L29.61 29.65Q29.64 29.57 29.7 29.49Q29.77 29.42 29.89 29.42L29.89 29.42L31.13 29.42Q31.26 29.42 31.32 29.49Q31.39 29.57 31.41 29.65L31.41 29.65L32.96 34.39Q32.97 34.41 32.97 34.44L32.97 34.44Q32.97 34.5 32.92 34.55Q32.88 34.6 32.82 34.6L32.82 34.6L31.78 34.6Q31.66 34.6 31.61 34.54Q31.55 34.48 31.53 34.43L31.53 34.43L31.32 33.81L29.7 33.81L29.49 34.43Q29.47 34.48 29.42 34.54Q29.37 34.6 29.25 34.6L29.25 34.6ZM30.51 30.89L30.01 32.56L31.01 32.56L30.51 30.89ZM34.74 34.6L33.59 34.6Q33.52 34.6 33.46 34.54Q33.41 34.49 33.41 34.41L33.41 34.41L33.41 29.61Q33.41 29.53 33.46 29.48Q33.52 29.42 33.59 29.42L33.59 29.42L35.56 29.42Q36.15 29.42 36.58 29.61Q37.02 29.8 37.26 30.2Q37.5 30.59 37.5 31.18L37.5 31.18Q37.5 31.77 37.26 32.15Q37.02 32.54 36.58 32.71Q36.15 32.89 35.56 32.89L35.56 32.89L34.92 32.89L34.92 34.41Q34.92 34.49 34.87 34.54Q34.82 34.6 34.74 34.6L34.74 34.6ZM34.89 30.62L34.89 31.7L35.52 31.7Q35.72 31.7 35.86 31.57Q36 31.44 36 31.17L36 31.17Q36 30.95 35.89 30.79Q35.78 30.62 35.52 30.62L35.52 30.62L34.89 30.62ZM39.35 34.6L38.25 34.6Q38.18 34.6 38.13 34.55Q38.08 34.5 38.08 34.41L38.08 34.41L38.08 29.61Q38.08 29.53 38.13 29.48Q38.18 29.42 38.25 29.42L38.25 29.42L39.35 29.42Q39.43 29.42 39.48 29.48Q39.53 29.53 39.53 29.61L39.53 29.61L39.53 31.28L39.79 31.28L40.7 29.58Q40.74 29.52 40.8 29.47Q40.86 29.42 40.96 29.42L40.96 29.42L42.19 29.42Q42.25 29.42 42.3 29.47Q42.34 29.52 42.34 29.58L42.34 29.58Q42.34 29.62 42.32 29.66L42.32 29.66L41.08 31.91L42.44 34.36Q42.45 34.38 42.45 34.44L42.45 34.44Q42.45 34.5 42.41 34.55Q42.36 34.6 42.3 34.6L42.3 34.6L41.03 34.6Q40.91 34.6 40.85 34.54Q40.8 34.47 40.78 34.44L40.78 34.44L39.84 32.69L39.53 32.69L39.53 34.41Q39.53 34.49 39.48 34.54Q39.43 34.6 39.35 34.6L39.35 34.6ZM43.78 34.6L42.74 34.6Q42.68 34.6 42.64 34.55Q42.6 34.5 42.6 34.44L42.6 34.44Q42.6 34.41 42.61 34.39L42.61 34.39L44.14 29.65Q44.17 29.57 44.24 29.49Q44.31 29.42 44.43 29.42L44.43 29.42L45.66 29.42Q45.79 29.42 45.86 29.49Q45.93 29.57 45.95 29.65L45.95 29.65L47.49 34.39Q47.5 34.41 47.5 34.44L47.5 34.44Q47.5 34.5 47.46 34.55Q47.41 34.6 47.35 34.6L47.35 34.6L46.31 34.6Q46.2 34.6 46.14 34.54Q46.09 34.48 46.07 34.43L46.07 34.43L45.86 33.81L44.23 33.81L44.02 34.43Q44 34.48 43.95 34.54Q43.9 34.6 43.78 34.6L43.78 34.6ZM45.04 30.89L44.54 32.56L45.55 32.56L45.04 30.89Z'
const SIZES = [4, 6, 8] as const

function Logo() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 64 64" width="56" height="56">
      {Array.from({ length: RAY_COUNT }, (_, index) => {
        const angle = (360 / RAY_COUNT) * index
        return (
          <g key={angle} transform={`rotate(${angle} 32 32)`}>
            {index % 2 === 0 ? (
              <rect x="30.6" y="2.5" width="2.8" height="8" rx="1.4" fill="currentColor" />
            ) : (
              <ellipse
                cx="32"
                cy="6.5"
                rx="2.3"
                ry="3.2"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              />
            )}
          </g>
        )
      })}
      <circle cx="32" cy="32" r="19.5" fill="currentColor" />
      <path className="logo-word" d={LOGO_WORD_PATH} />
    </svg>
  )
}

function cellLabel(row: number, col: number, digit: string, given: boolean, hinted: boolean) {
  const value = digit === '' ? 'порожньо' : digit
  const suffix = given ? ', задано' : hinted ? ', підказка' : ''
  return `Рядок ${row}, стовпець ${col}, ${value}${suffix}`
}

export function BinarkaPage({
  board,
  hintMessage = '',
  winMessage = '',
  rulesOpen = false,
  confirmOpen = false,
}: BinarkaPageProps) {
  const isViolation = (row: number, col: number) =>
    board.violations?.some(([r, c]) => r === row && c === col) ?? false

  return (
    <div id="app">
      <h1>
        <Logo />
        Бінарка
      </h1>

      <div className="size-picker" data-control="size" role="radiogroup" aria-label="Розмір поля">
        {SIZES.map((size) => (
          <button
            key={size}
            type="button"
            role="radio"
            aria-checked={size === board.size ? 'true' : 'false'}
            data-size-option={size}
          >
            {`Поле ${size}×${size}`}
          </button>
        ))}
      </div>

      <div className="board-host">
        <div
          className="board"
          data-board=""
          data-size={board.size}
          data-solved={board.solved ? 'true' : undefined}
        >
          {board.rows.flatMap((cells, rowIndex) =>
            cells.map((spec, colIndex) => {
              const row = rowIndex + 1
              const col = colIndex + 1
              const given = spec.startsWith('g')
              const hinted = spec.startsWith('h')
              const digit = spec === '.' ? '' : spec.slice(1)
              const className = [
                'cell',
                given && 'cell-given',
                hinted && 'cell-hinted',
                isViolation(row, col) && 'cell-violation',
              ]
                .filter(Boolean)
                .join(' ')
              return (
                <button
                  key={`${row}-${col}`}
                  type="button"
                  className={className}
                  data-cell=""
                  data-row={row}
                  data-col={col}
                  data-given={given ? 'true' : 'false'}
                  aria-disabled={given ? 'true' : undefined}
                  aria-label={cellLabel(row, col, digit, given, hinted)}
                >
                  {digit}
                </button>
              )
            }),
          )}
        </div>
      </div>

      <div className="messages" aria-live="polite">
        <p className="message" data-message="hint">
          {hintMessage}
        </p>
        <p className="message message-win" data-message="win">
          {winMessage}
        </p>
      </div>

      <div className="buttons">
        <button type="button" data-action="hint">
          Підказка
        </button>
        <button type="button" data-action="reset">
          Скинути
        </button>
        <button type="button" data-action="new">
          Нова головоломка
        </button>
      </div>

      <details className="rules" data-section="rules" open={rulesOpen}>
        <summary>Правила</summary>
        <ul>
          <li>Не більше двох однакових цифр поспіль у рядку чи стовпці.</li>
          <li>У кожному рядку та стовпці порівну нулів і одиниць.</li>
          <li>Усі рядки різні, і всі стовпці різні.</li>
        </ul>
      </details>

      <dialog className="confirm" data-dialog="confirm">
        <p>Почати заново? Ваші ходи на цьому полі буде втрачено.</p>
        <div className="confirm-buttons">
          <button type="button" data-confirm="yes">
            Так, почати
          </button>
          <button type="button" data-confirm="no">
            Скасувати
          </button>
        </div>
      </dialog>

      {confirmOpen && <OpenConfirmDialog />}
    </div>
  )
}

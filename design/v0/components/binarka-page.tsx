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
      <text
        x="32"
        y="34.6"
        textAnchor="middle"
        fontSize="7.4"
        fontWeight="800"
        textLength="31"
        lengthAdjust="spacingAndGlyphs"
      >
        БІНАРКА
      </text>
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

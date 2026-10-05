import { OpenConfirmDialog } from '@/components/open-confirm-dialog'
import { OpenRulesPopover } from '@/components/open-rules-popover'

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
const IDLE_TEXT = 'Натискайте клітинки, щоб ставити 0 і 1. Правила — кнопка «Правила» вгорі.'

// A "1" drawn as a bar and a "0" drawn as a ring, the same shapes as the rays,
// so the logo needs no font.
function LogoDigit({ digit, cx, cy }: { digit: 0 | 1; cx: number; cy: number }) {
  return digit === 1 ? (
    <rect className="logo-digit" x={cx - 1.3} y={cy - 3.6} width="2.6" height="7.2" rx="1.3" />
  ) : (
    <ellipse className="logo-digit-ring" cx={cx} cy={cy} rx="2.2" ry="3.1" strokeWidth="1.8" />
  )
}

function Logo() {
  // 2×2 mini board «1 0 / 0 1» inside the sun.
  const cells: Array<{ x: number; y: number; digit: 0 | 1 }> = [
    { x: 20.5, y: 20.5, digit: 1 },
    { x: 32.5, y: 20.5, digit: 0 },
    { x: 20.5, y: 32.5, digit: 0 },
    { x: 32.5, y: 32.5, digit: 1 },
  ]
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
      {cells.map(({ x, y, digit }) => (
        <g key={`${x}-${y}`}>
          <rect className="logo-cell" x={x} y={y} width="11" height="11" rx="2" />
          <LogoDigit digit={digit} cx={x + 5.5} cy={y + 5.5} />
        </g>
      ))}
    </svg>
  )
}

function cellLabel(row: number, col: number, digit: string, given: boolean, hinted: boolean) {
  const value = digit === '' ? 'порожньо' : digit
  const suffix = given ? ', задано' : hinted ? ', підказка' : ''
  return `Рядок ${row}, стовпець ${col}, ${value}${suffix}`
}

function Mini({ children, answer = false }: { children: string; answer?: boolean }) {
  return <span className={answer ? 'mini mini-answer' : 'mini'}>{children}</span>
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
      <header className="page-header">
        <h1>
          <Logo />
          Бінарка
        </h1>
        <button type="button" className="rules-button" data-action="rules" popoverTarget="rules">
          Правила
        </button>
      </header>

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

      <div className="messages" aria-live="polite">
        <p className="message message-idle" data-message="idle">
          {IDLE_TEXT}
        </p>
        <p className="message" data-message="hint">
          {hintMessage}
        </p>
        <p className="message message-win" data-message="win">
          {winMessage}
        </p>
      </div>

      <div id="rules" popover="auto" className="rules" data-section="rules" aria-labelledby="rules-title">
        <h2 id="rules-title">Правила</h2>
        <ul>
          <li>
            <span className="rule-text">Не більше двох однакових цифр поспіль у рядку чи стовпці.</span>
            <span className="rule-example" aria-hidden="true">
              <Mini>0</Mini>
              <Mini>0</Mini>
              <Mini answer>1</Mini>
            </span>
          </li>
          <li>
            <span className="rule-text">У кожному рядку та стовпці порівну нулів і одиниць.</span>
            <span className="rule-example" aria-hidden="true">
              <Mini>0</Mini>
              <Mini>1</Mini>
              <Mini>0</Mini>
              <Mini answer>1</Mini>
            </span>
          </li>
          <li>
            <span className="rule-text">Усі рядки різні, і всі стовпці різні.</span>
            <span className="rule-example" aria-hidden="true">
              <Mini>0</Mini>
              <Mini>1</Mini>
              <Mini>1</Mini>
              <Mini>0</Mini>
              <span className="mini-sep">≠</span>
              <Mini>1</Mini>
              <Mini>0</Mini>
              <Mini>0</Mini>
              <Mini>1</Mini>
            </span>
          </li>
        </ul>
        <button type="button" className="rules-close" popoverTarget="rules" popoverTargetAction="hide">
          Зрозуміло
        </button>
      </div>

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
      {rulesOpen && <OpenRulesPopover />}
    </div>
  )
}

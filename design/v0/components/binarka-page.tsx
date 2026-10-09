import { OpenConfirmDialog } from '@/components/open-confirm-dialog'
import { OpenRulesPopover } from '@/components/open-rules-popover'
import { OpenSetupSheet } from '@/components/open-setup-sheet'
import { OpenSettingsPanel } from '@/components/open-settings-panel'

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
  /** Scrolls the open rules panel to its end (review capture only). */
  rulesScrolledToTechniques?: boolean
  confirmOpen?: boolean
  /** Opens the setup sheet on load (review capture only, FR-96). */
  setupOpen?: boolean
  /** The level shown, 1 to 4 (FR-87). At 4×4 only level 1 exists (FR-91). */
  level?: Level
  /** Iteration 14 (FR-100): the marked size and level while the sheet is open; by default
      the board shown. The summary always shows the board shown (FR-95). */
  markedSize?: number
  markedLevel?: Level
  /** Iteration 14: puts the focus on «Почати» once the sheet is open (review capture only). */
  focusStart?: boolean
  /** Iteration 14 (FR-102, FR-107): opens the settings panel on load (review capture only). */
  settingsOpen?: boolean
  /** The checked theme option (FR-102); the design stores nothing, so «Як у системі» by default. */
  themeChoice?: ThemeChoice
  /** Iteration 15: puts the focus on this theme option once the panel is open (review capture only). */
  focusThemeOption?: ThemeChoice
}

export type ThemeChoice = 'light' | 'dark' | 'auto'

export type Level = 1 | 2 | 3 | 4

const RAY_COUNT = 12
const SIZES = [4, 6, 8] as const
// FR-87 (names) and FR-89 (descriptions, the user's final wording, each at most 80 characters).
const LEVELS: ReadonlyArray<{ level: Level; name: string; description: string }> = [
  {
    level: 1,
    name: 'Розминка',
    description: 'Вистачає трьох простих правил: пара, між двома однаковими і підрахунок цифр.',
  },
  {
    level: 2,
    name: 'Задачка',
    description: 'Додатково треба рахувати, де в рядку помістяться решта нулів чи одиниць.',
  },
  {
    level: 3,
    name: 'Головоломка',
    description: 'Додатково треба порівнювати рядки і стовпці: двох однакових не буває.',
  },
  {
    level: 4,
    name: 'Мозколамка',
    description: 'Додатково треба пробувати хід наперед: якщо правило порушиться, тут інша цифра.',
  },
]
// FR-91: the reason shown in the sheet, above the levels, while the size is 4×4.
const FOUR_REASON = 'Для поля 4×4 є лише рівень «Розминка».'
// FR-93: the techniques section of the rules panel.
const TECHNIQUES = [
  'Баланс рядка: якщо в рядку є місце лише для одного нуля або однієї одиниці, а в клітинці вона дала б три однакові цифри поспіль, там стоїть інша цифра.',
  'Однакові рядки: якщо рядок збігається з повним рядком усюди, крім двох клітинок, ці дві клітинки протилежні до нього.',
  'Хід наперед: уявно поставте цифру; якщо за кілька кроків порушиться правило, у клітинці стоїть інша.',
] as const
// FR-102 and FR-107: the theme and language options, in this order. Each language is named in
// its own language (TD-Q5), so "English" carries lang="en".
const THEMES: ReadonlyArray<{ option: ThemeChoice; name: string }> = [
  { option: 'light', name: 'Світла' },
  { option: 'dark', name: 'Темна' },
  { option: 'auto', name: 'Як у системі' },
]
const LANGUAGES = [
  { option: 'uk', name: 'Українська' },
  { option: 'en', name: 'English' },
] as const
// Non-breaking spaces keep «0 і 1» on one line (finding 11).
const IDLE_TEXT = 'Натискайте клітинки, щоб ставити 0\u00a0і\u00a01. Правила — кнопка «Правила» вгорі.'

// A "1" drawn as a bar and a "0" drawn as a ring, the same shapes as the rays,
// so the logo needs no font.
function LogoDigit({ digit, cx, cy }: { digit: 0 | 1; cx: number; cy: number }) {
  return digit === 1 ? (
    <rect className="logo-digit" x={cx - 1.3} y={cy - 3.6} width="2.6" height="7.2" rx="1.3" />
  ) : (
    <ellipse className="logo-digit-ring" cx={cx} cy={cy} rx="2.2" ry="3.1" strokeWidth="1.8" />
  )
}

export function Logo({ size = 56 }: { size?: number }) {
  // 2×2 mini board «1 0 / 0 1» inside the sun.
  const cells: Array<{ x: number; y: number; digit: 0 | 1 }> = [
    { x: 20.5, y: 20.5, digit: 1 },
    { x: 32.5, y: 20.5, digit: 0 },
    { x: 20.5, y: 32.5, digit: 0 },
    { x: 32.5, y: 32.5, digit: 1 },
  ]
  return (
    <svg
      className="logo"
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 64 64"
      width={size}
      height={size}
    >
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

// Iteration 14: a drawn gear (eight rounded teeth around a ring), like the logo: no glyph, no
// image file. It takes the button's text colour; the hole shows the button's own surface.
function Gear() {
  return (
    <svg className="gear" aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="24" height="24">
      {Array.from({ length: 8 }, (_, index) => (
        <rect
          key={index}
          x="10"
          y="1.5"
          width="4"
          height="5"
          rx="1.25"
          fill="currentColor"
          transform={`rotate(${index * 45} 12 12)`}
        />
      ))}
      <circle cx="12" cy="12" r="7.25" fill="currentColor" />
      <circle className="gear-hole" cx="12" cy="12" r="3" />
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
  rulesScrolledToTechniques = false,
  confirmOpen = false,
  setupOpen = false,
  level = 1,
  markedSize,
  markedLevel,
  focusStart = false,
  settingsOpen = false,
  themeChoice = 'auto',
  focusThemeOption,
}: BinarkaPageProps) {
  const shownLevel: Level = board.size === 4 ? 1 : level
  // FR-100: the marked choice; FR-91 follows the marked size (marking 4×4 marks «Розминка»).
  const marked = markedSize ?? board.size
  const onlyFirstLevel = marked === 4
  const markedLevelShown: Level = onlyFirstLevel ? 1 : (markedLevel ?? shownLevel)
  // FR-95: the summary text, for example «6×6 · Задачка».
  const summary = `${board.size}×${board.size} · ${LEVELS.find((entry) => entry.level === shownLevel)!.name}`

  const isViolation = (row: number, col: number) =>
    board.violations?.some(([r, c]) => r === row && c === col) ?? false

  return (
    <div id="app">
      <header className="page-header">
        <h1>
          <Logo />
          Бінарка
        </h1>
        <button type="button" className="settings-button" data-action="settings" popoverTarget="settings">
          <span className="visually-hidden">Налаштування</span>
          <Gear />
        </button>
        <button type="button" className="rules-button" data-action="rules" popoverTarget="rules">
          Правила
        </button>
      </header>

      <button
        type="button"
        className="setup-button"
        data-action="setup"
        popoverTarget="setup"
      >
        <span className="visually-hidden">Поле і складність: </span>
        <span className="setup-summary">{summary}</span>
        <span className="setup-cue" aria-hidden="true">
          ▾
        </span>
      </button>

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
        <div className="techniques" data-section="techniques">
          <h3>Складніші прийоми</h3>
          <ul>
            {TECHNIQUES.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
        </div>
        <button type="button" className="rules-close" popoverTarget="rules" popoverTargetAction="hide">
          Зрозуміло
        </button>
      </div>

      <div
        id="setup"
        popover="auto"
        className="setup"
        data-section="setup"
        role="dialog"
        aria-label="Поле і складність"
      >
        <div className="size-control" data-control="size" role="radiogroup" aria-label="Розмір поля">
          {SIZES.map((size) => (
            <button
              key={size}
              type="button"
              role="radio"
              aria-checked={size === marked ? 'true' : 'false'}
              data-size-option={size}
            >
              {`Поле ${size}×${size}`}
            </button>
          ))}
        </div>

        <div className="level-control" data-control="level" role="radiogroup" aria-label="Складність">
          {onlyFirstLevel && (
            <p className="level-reason" data-level-reason="">
              {FOUR_REASON}
            </p>
          )}
          {LEVELS.map((entry) => (
            <button
              key={entry.level}
              type="button"
              role="radio"
              aria-checked={entry.level === markedLevelShown ? 'true' : 'false'}
              aria-disabled={onlyFirstLevel && entry.level !== 1 ? 'true' : undefined}
              data-level-option={entry.level}
            >
              <span className="level-name">{entry.name}</span>
              <span className="level-text">{entry.description}</span>
            </button>
          ))}
        </div>

        <button type="button" className="setup-start" data-action="setup-start">
          Почати
        </button>

        <button
          type="button"
          className="setup-close"
          data-action="setup-close"
          popoverTarget="setup"
          popoverTargetAction="hide"
        >
          Закрити
        </button>
      </div>

      <div
        id="settings"
        popover="auto"
        className="settings"
        data-section="settings"
        role="dialog"
        aria-label="Налаштування"
      >
        <p className="settings-label" aria-hidden="true">
          Тема
        </p>
        <div className="theme-control" data-control="theme" role="radiogroup" aria-label="Тема">
          {THEMES.map((entry) => (
            <button
              key={entry.option}
              type="button"
              role="radio"
              aria-checked={entry.option === themeChoice ? 'true' : 'false'}
              data-theme-option={entry.option}
            >
              {entry.name}
            </button>
          ))}
        </div>
        <p className="settings-label" aria-hidden="true">
          Мова
        </p>
        <div className="language-control" data-control="language" role="radiogroup" aria-label="Мова">
          {LANGUAGES.map((entry) => (
            <button
              key={entry.option}
              type="button"
              role="radio"
              lang={entry.option}
              aria-checked={entry.option === 'uk' ? 'true' : 'false'}
              data-language-option={entry.option}
            >
              {entry.name}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="settings-close"
          data-action="settings-close"
          popoverTarget="settings"
          popoverTargetAction="hide"
        >
          Закрити
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
      {rulesOpen && <OpenRulesPopover scrollToEnd={rulesScrolledToTechniques} />}
      {setupOpen && <OpenSetupSheet focusStart={focusStart} />}
      {settingsOpen && <OpenSettingsPanel focusOption={focusThemeOption} />}
    </div>
  )
}

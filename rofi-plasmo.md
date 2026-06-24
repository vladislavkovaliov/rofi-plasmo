# Project Setup

## Initialize Plasmo project
Description:
Run `pnpm create plasmo` (или `npm create plasmo`) в папке `rofi-ext`. Выбрать шаблон с React + TypeScript.

Убедиться, что структура проекта выглядит так:

```
rofi-ext/
├── package.json
├── tsconfig.json
├── src/
│   ├── background.ts
│   ├── content.tsx
│   └── style.css
├── assets/
│   └── icon.png
```

Priority: High

## Configure manifest
Description:
В `package.json` добавить секцию `manifest`:

```json
{
  "manifest": {
    "name": "Rofi Switcher",
    "version": "0.1.0",
    "description": "A window switcher and launcher inspired by Rofi",
    "commands": {
      "toggle-rofi": {
        "suggested_key": { "default": "Ctrl+Space" },
        "description": "Toggle Rofi overlay"
      }
    },
    "permissions": ["tabs", "tabGroups", "history", "storage"],
    "host_permissions": ["<all_urls>"]
  }
}
```

**Важно:** `scripting` permission не требуется — Plasmo сам инжектит content script через декларацию в manifest. Content script запущен на всех страницах с момента загрузки, background только шлёт сообщение через `tabs.sendMessage`.

Priority: High

## Add extension icons
Description:
- Поместить иконки в `assets/icon.png` (128x128).
- Plasmo автоматически генерирует размеры 16, 32, 48, 128 из исходника.
- Убедиться, что иконка отображается в `chrome://extensions`.

## Verify dev build
Description:
- Выполнить `npm run dev`.
- Загрузить `build/chrome-mv3-dev/` как unpacked extension.
- Убедиться, что расширение загружается без ошибок, работает hot-reload.

Priority: High

---

# Background Service Worker

## Handle keyboard command toggle
Description:
В `src/background.ts` подписаться на `chrome.commands.onCommand`.

**Важно:** Content script уже запущен на странице (Plasmo injects automatically). Background не использует `chrome.scripting.executeScript` — только отправляет сообщение.

```ts
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-rofi') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'toggle-rofi' })
    }
  }
})
```

Priority: High

## Message handler: get-initial-data
Description:
Создать `src/background/messages/get-initial-data.ts`.

Plasmo авто-регистрирует хендлеры по пути файла. Хендлер параллельно вызывает три Chrome API:

```ts
import type { PlasmoMessaging } from "@plasmohq/messaging"

export type InitialData = {
  tabs: chrome.tabs.Tab[]
  groups: chrome.tabGroups.TabGroup[]
  history: chrome.history.HistoryItem[]
}

const handler: PlasmoMessaging.MessageHandler<{}, InitialData> = async (req, res) => {
  const [tabs, groups, history] = await Promise.all([
    chrome.tabs.query({}).catch(() => []),
    chrome.tabGroups.query({}).catch(() => []),
    chrome.history.search({ text: '', maxResults: 50, startTime: 0 }).catch(() => [])
  ])
  res.send({ tabs, groups, history })
}

export default handler
```

**Плазмо-специфика:** Файлы хендлеров в `background/messages/` регистрируются автоматически. Имя хендлера = имени файла. Вызов из content script через `sendToBackground({ name: 'get-initial-data' })`.

Priority: High

## Message handler: switch-to-tab
Description:
Создать `src/background/messages/switch-to-tab.ts`.

Принимает `{ tabId, windowId }`, фокусирует окно и активирует таб.

```ts
type Request = { tabId: number; windowId: number }

const handler: PlasmoMessaging.MessageHandler<Request> = async (req, res) => {
  await Promise.all([
    chrome.tabs.update(req.body.tabId, { active: true }),
    chrome.windows.update(req.body.windowId, { focused: true })
  ])
}

export default handler
```

**Плазмо-специфика:** Service worker в production живёт ~30с после последнего запроса. Не хранить состояние в глобальных переменных — использовать `chrome.storage` или `@plasmohq/storage`.

## Message handler: open-url
Description:
Создать `src/background/messages/open-url.ts`.

Создаёт новый таб с переданным URL.

```ts
type Request = { url: string }

const handler: PlasmoMessaging.MessageHandler<Request> = async (req, res) => {
  await chrome.tabs.create({ url: req.body.url, active: true })
}

export default handler
```

## Message handler: switch-to-group
Description:
Создать `src/background/messages/switch-to-group.ts`.

Находит первый активный таб в группе, вызывает `switch-to-tab`.

```ts
type Request = { groupId: number }

const handler: PlasmoMessaging.MessageHandler<Request> = async (req, res) => {
  const [tab] = await chrome.tabs.query({ groupId: req.body.groupId })
  if (tab?.id && tab?.windowId) {
    await Promise.all([
      chrome.tabs.update(tab.id, { active: true }),
      chrome.windows.update(tab.windowId, { focused: true })
    ])
  }
}

export default handler
```

---

# Content Script & Overlay Lifecycle

## Create content script component with CSS injection
Description:
В `src/content.tsx` создать default-export компонент.

**Plasmo-специфика:** CSS импортируется через `data-text:` схему и инжектится в Shadow DOM через `getStyle()`. Обычный `import "./style.css"` не работает.

```tsx
import cssText from "data-text:./style.css"
import type { PlasmoGetStyle } from "plasmo"

export const config = {
  matches: ["<all_urls>"]
}

export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

import RofiOverlay from "~components/RofiOverlay"

export default function Content() {
  return <RofiOverlay />
}
```

Content script инжектится на всех страницах, но overlay скрыт до команды toggle.

Priority: High

## Implement toggle listener
Description:
Внутри `RofiOverlay` добавить `useEffect` с `chrome.runtime.onMessage`.

Получает сообщение `{ type: 'toggle-rofi' }` от background, тогглит `visible` state.

```tsx
const [visible, setVisible] = useState(false)

useEffect(() => {
  const handler = (msg: any) => {
    if (msg.type === 'toggle-rofi') setVisible(v => !v)
  }
  chrome.runtime.onMessage.addListener(handler)
  return () => chrome.runtime.onMessage.removeListener(handler)
}, [])
```

Priority: High

## Block page scroll on overlay open
Description:
Когда `visible === true` — запомнить `document.body.style.overflow`, установить `'hidden'`.

Когда `visible === false` — восстановить оригинальное значение.

Использовать `useEffect` с зависимостью от `visible`.

## Close on tab switch
Description:
Добавить слушатель `chrome.tabs.onActivated`.

Если overlay открыт и активный таб изменился — закрыть overlay.

```ts
chrome.tabs.onActivated.addListener(() => {
  if (visible) setVisible(false)
})
```

---

# Messaging & Data Layer

## Typed messaging client
Description:
Создать `src/lib/chrome-api.ts`.

Типизированные функции-обёртки над `sendToBackground` из `@plasmohq/messaging`.

```ts
import { sendToBackground } from "@plasmohq/messaging"
import type { InitialData } from "~background/messages/get-initial-data"

export async function getInitialData(): Promise<InitialData> {
  const resp = await sendToBackground({ name: 'get-initial-data' })
  return resp as InitialData
}

export async function switchToTab(tabId: number, windowId: number) {
  await sendToBackground({ name: 'switch-to-tab', body: { tabId, windowId } })
}

export async function openUrl(url: string) {
  await sendToBackground({ name: 'open-url', body: { url } })
}
```

**Плазмо-специфика:** Путь до хендлера указывается как `name` (без пути). Plasmo маппит имя хендлера на файл в `background/messages/{name}.ts`.

Priority: High

## Define shared types
Description:
Создать `src/lib/types.ts`.

```ts
export interface Entry {
  id: string
  title: string
  url: string
  tabId?: number
  windowId?: number
  groupId?: number
  groupTitle?: string
  groupColor?: string
  favIconUrl?: string
  source: 'tab' | 'history'
}
```

**Важно:** Добавлены поля `favIconUrl` и `groupColor` — они потребуются в UI.

## Add `export {}` to files without imports
Description:
Plasmo требует, чтобы каждый файл был ES-модулем. Если файл не содержит import/export, добавить в конец:

```ts
export {}
```

Иначе TypeScript выдаёт ошибку `Cannot redeclare block-scoped variable`.

Это касается `src/style.css` (не нужно, Plasmo обрабатывает отдельно) и потенциально пустых конфигурационных файлов.

---

# Mode System

## Define Mode interface
Description:
Создать `src/modes/types.ts`.

```ts
export interface ModeConfig {
  key: string
  label: string
  getEntries(): Promise<Entry[]>
  tokenMatch(entry: Entry, query: string): boolean
  getSubtitle?(entry: Entry): string | undefined
  result(entry: Entry): Promise<void>
}
```

Priority: High

## Implement TabsMode
Description:
Создать `src/modes/TabsMode.ts`.

- `getEntries()` вызывает `getInitialData()`, маппит `tabs` в `Entry[]` с `source: 'tab'`.
- `tokenMatch(entry, query)` — case-insensitive поиск по `title` и `url`.
- `result(entry)` — вызывает `switchToTab(entry.tabId!, entry.windowId!)`.
- `getSubtitle(entry)` — возвращает `entry.url` (сокращённый).

Priority: High

## Implement HistoryMode
Description:
Создать `src/modes/HistoryMode.ts`.

- `getEntries()` вызывает `getInitialData()`, маппит `history` в `Entry[]` с `source: 'history'`.
- `tokenMatch(entry, query)` — поиск по `title` и `url`.
- `result(entry)` — вызывает `openUrl(entry.url)`.
- `getSubtitle(entry)` — возвращает `entry.url`.

## Implement GroupsMode
Description:
Создать `src/modes/GroupsMode.ts`.

- `getEntries()` вызывает `getInitialData()`, фильтрует табы по `groupId` (только сгруппированные).
- Каждый entry получает `groupTitle` и `groupColor` из данных группы.
- `tokenMatch(entry, query)` — поиск по `title`, `url`, `groupTitle`.
- `result(entry)` — вызывает `switchToTab(entry.tabId!, entry.windowId!)`.
- `getSubtitle(entry)` — возвращает имя группы с цветовым индикатором.

**Маппинг цветов групп:**

```ts
const GROUP_COLORS: Record<string, string> = {
  grey:   '#5c5c5c',
  blue:   '#1a73e8',
  red:    '#d93025',
  yellow: '#f9ab00',
  green:  '#34a853',
  pink:   '#ff6b9d',
  purple: '#a142f4',
  cyan:   '#24c1e0',
  orange: '#fa7b17',
}
```

## Implement CombiMode
Description:
Создать `src/modes/CombiMode.ts`.

- `getEntries()` объединяет результаты Tabs + Groups + History в один массив.
- Каждый entry сохраняет свой `source`.
- `tokenMatch(entry, query)` — единая логика поиска.
- `result(entry)` — делегирует в соответствующий режим по `entry.source`.
- Сортировка: табы → группы → история.

Priority: High

## Create mode registry
Description:
Создать `src/modes/mode-registry.ts`.

```ts
export const modes: ModeConfig[] = [
  CombiMode,   // "All" — дефолтный
  GroupsMode,
  HistoryMode,
]

export function getDefaultMode(): ModeConfig {
  return CombiMode
}
```

---

# React UI Components

## RofiOverlay (root component)
Description:
Создать `src/components/RofiOverlay.tsx`.

Состояние компонента:
- `visible: boolean` — переключается сообщением из background
- `entries: Entry[]` — полный список entry от активного режима
- `filteredEntries: Entry[]` — отфильтрованные по `query`
- `selectedIndex: number` — текущий выбранный элемент
- `query: string` — строка поиска
- `activeModeKey: string` — ключ активного режима
- `loading: boolean` — флаг загрузки данных
- `error: string | null` — ошибка загрузки

При монтировании: загрузить данные через `getInitialData()`, добавить `keydown` listener.

При размонтировании: убрать listener.

**Plasmo-специфика:** Использовать path alias `~` для импорта — `~components/RofiOverlay` резолвится в `src/components/RofiOverlay`.

Priority: High

## Backdrop
Description:
Создать `src/components/Backdrop.tsx`.

- `position: fixed`, `inset: 0`, `z-index` максимальный.
- `background: rgba(0,0,0,0.4)`.
- `onClick` → `onClose`.
- `stopPropagation` на children, чтобы клик внутри Popup не закрывал.

## Popup
Description:
Создать `src/components/Popup.tsx`.

- `position: fixed`, центрирован через `top: 40%; left: 50%; transform: translate(-50%, -50%)`.
- `max-width: 600px`, `max-height: 70vh`.
- Flex-колонка: MainBox + Sidebar.
- `role="dialog"`, `aria-modal="true"`.

## MainBox
Description:
Создать `src/components/MainBox.tsx`.

- Вертикальный flex, `flex: 1`, `overflow: hidden`.
- Содержит InputBar + ListView.

## InputBar
Description:
Создать `src/components/InputBar.tsx`.

- Горизонтальный flex.
- `<span>` с prompt `"> "` (акцентный цвет).
- `<input>` controlled, `autoFocus`, `spellCheck={false}`, `placeholder="Type to filter..."`.
- `onChange` обновляет query в родителе.

Priority: High

## ListView
Description:
Создать `src/components/ListView.tsx`.

- Scrollable (`overflow-y: auto`).
- Маппит `filteredEntries` в `ResultRow[]`.
- Подсвечивает `selectedIndex`.
- `useEffect` со `scrollIntoView({ block: 'nearest' })` при изменении `selectedIndex`.

Priority: High

## ResultRow with favicon and group color
Description:
Создать `src/components/ResultRow.tsx`.

Содержимое строки:

```
[group-color-bar][favicon 16x16]  Title text
                                   subtitle (серым, мелким шрифтом)
```

- **Favicon:** `<img>` с `src={entry.favIconUrl}`. Если не загрузился (`onError`) — показать generic иконку (прямоугольник с символом вкладки). `16px × 16px`, `margin-right: 8px`.
- **Group color:** Если `entry.groupColor` указан — маленькая цветная полоска слева (`3px` width, цвет группы). Если нет — пусто.
- `aria-selected={isSelected}`.
- `onMouseEnter` обновляет selection.
- `onClick` вызывает `result()` и `onClose()`.

Priority: High

## Sidebar
Description:
Создать `src/components/Sidebar.tsx`.

- Горизонтальный flex, `border-top` для отделения от списка.
- Маппит `modes` в `ModeButton[]`.

## ModeButton
Description:
Создать `src/components/ModeButton.tsx`.

- `<button>` c padding, border-radius, cursor pointer.
- `role="tab"`, `aria-selected={isActive}`.
- Активная кнопка — accent background + inverted text.
- `onClick` переключает `activeModeKey`.

## Error Boundary
Description:
Создать `src/components/ErrorBoundary.tsx`.

React Error Boundary, который ловит ошибки рендера в дочерних компонентах.

```tsx
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return <div className="error-fallback">
        Something went wrong. Press Escape to close.
      </div>
    }
    return this.props.children
  }
}
```

Оборачивает всё содержимое RofiOverlay.

---

# Keyboard Navigation

## Implement global keydown handler
Description:
В `RofiOverlay` добавить `useEffect` с `keydown` listener.

Маппинг клавиш:

| Key | Action |
|---|---|
| `ArrowDown` | `selectedIndex++` (циклически) |
| `ArrowUp` | `selectedIndex--` (циклически) |
| `Enter` | `await result()` на выбранном entry, затем `onClose()` |
| `Escape` | `onClose()` |
| `Tab` / `Ctrl+Tab` | переключить `activeModeKey` на следующий режим |
| `Home` | `selectedIndex = 0` |
| `End` | `selectedIndex = filteredEntries.length - 1` |

`preventDefault()` для всех обработанных клавиш.

Priority: High

## Implement debounced filtering
Description:
При изменении `query` — debounce 150ms.

После debounce — применить `activeMode.tokenMatch` для каждого entry.

Обновить `filteredEntries`, сбросить `selectedIndex` на 0.

Использовать `useRef` для хранения таймера debounce.

## Sync mouse and keyboard selection
Description:
- `onMouseEnter` на `ResultRow` → `setSelectedIndex(index)`.
- При изменении `selectedIndex` через клавиатуру — `scrollIntoView({ block: 'nearest' })`.
- Избегать конфликта: не сбрасывать hover-выбор при каждом ререндере.

---

# Styling

## Define CSS custom properties with `:host` scope
Description:
В `src/style.css` определить переменные темы.

**Важно:** Использовать `:host`, а не `:root`. CSS-переменные из `:root` страницы протекают в Shadow DOM. Селектор `:host` применяется к корневому элементу Shadow DOM и изолирует стили.

```css
:host {
  --rofi-bg: #1e1e2e;
  --rofi-fg: #cdd6f4;
  --rofi-accent: #89b4fa;
  --rofi-accent-hover: #74c7ec;
  --rofi-selected-bg: #313244;
  --rofi-border-radius: 12px;
  --rofi-font: 'Iosevka', 'JetBrains Mono', 'Fira Code', monospace;
  --rofi-font-size: 14px;
  --rofi-z-index: 2147483647;
}
```

Plasmo инжектит CSS в Shadow DOM через `getStyle()`.

Priority: High

## Style overlay and popup
Description:
- Backdrop: `background: rgba(0,0,0,0.5)`.
- Popup: `background: var(--rofi-bg)`, `border-radius: var(--rofi-border-radius)`, `box-shadow: 0 20px 60px rgba(0,0,0,0.5)`, `padding: 12px`.
- Анимация: `opacity: 0 → 1` и `transform: scale(0.97) → 1`, duration 150ms ease-out.

## Style input bar
Description:
- Prompt `"> "`: `color: var(--rofi-accent)`, `font-weight: bold`.
- Input: `background: transparent`, `border: none`, `outline: none`, `color: var(--rofi-fg)`, `font-family: var(--rofi-font)`, `font-size: var(--rofi-font-size)`.
- Bottom border `2px solid var(--rofi-accent)` на `:focus-within`.
- Caret: `color: var(--rofi-accent)`.

## Style list items
Description:
- Каждый `ResultRow`: `padding: 8px 12px`, `border-radius: 6px`, `cursor: pointer`.
- Selected: `background: var(--rofi-selected-bg)`.
- Title: `color: var(--rofi-fg)`, `font-family: var(--rofi-font)`.
- Subtitle: `color: var(--rofi-fg)`, `opacity: 0.5`, `font-size: 12px`.
- Favicon: `16px × 16px`, `margin-right: 8px`, `vertical-align: middle`, `border-radius: 2px`.
- Group color bar: `3px` width, `margin-right: 8px`, `border-radius: 2px`.

## Style sidebar
Description:
- `border-top: 1px solid rgba(255,255,255,0.1)`, `padding-top: 8px`, `margin-top: 8px`.
- ModeButton: `padding: 6px 16px`, `border-radius: 6px`, `font-family: var(--rofi-font)`, `font-size: 12px`, `cursor: pointer`.
- Active ModeButton: `background: var(--rofi-accent)`, `color: var(--rofi-bg)`.
- Inactive ModeButton: `background: transparent`, `color: var(--rofi-fg)`, `opacity: 0.7`.

---

# Polish & Edge Cases

## Implement loading state
Description:
- Пока `getInitialData()` в процессе — показывать спиннер или текст "Loading..." в ListView.
- Таймаут 5 секунд: если данные не загрузились — показать ошибку.
- Использовать `AbortController` для отмены запроса при закрытии оверлея.

## Implement empty state
Description:
- Если `filteredEntries.length === 0` и `query !== ''` — показать "No matches found".
- Если `entries.length === 0` и `query === ''` — показать "No items available".
- Текст по центру ListView, `opacity: 0.4`.

## Implement error handling
Description:
- Если `getInitialData()` выбросил исключение — показать "Failed to load data" с кнопкой "Retry".
- При нажатии Retry — повторно вызвать `getInitialData()`.
- Ошибки логировать в `console.error` для отладки.

## Handle favicon load failures
Description:
В `ResultRow` добавить `onError` обработчик на `<img>` favicon.

Если favicon не загрузился (404, заблокирован CORS, etc.) — показать fallback:

```tsx
const [imgError, setImgError] = useState(false)

{!imgError && entry.favIconUrl ? (
  <img
    src={entry.favIconUrl}
    onError={() => setImgError(true)}
    className="favicon"
  />
) : (
  <span className="favicon-fallback">
    <svg>...</svg>  {/* generic tab icon */}
  </span>
)}
```

## Add focus trap
Description:
- При открытии оверлея: авто-фокус на input.
- Tab циклически переключает между InputBar и Sidebar кнопками.
- Не даёт фокусу уйти за пределы оверлея (`document.addEventListener('focusin', ...)`).
- Реализовать через `useFocusTrap` hook.

## Add accessibility attributes
Description:
- `role="dialog"`, `aria-modal="true"`, `aria-label="Rofi Switcher"` на Popup.
- `role="listbox"` на ListView.
- `aria-selected={isSelected}` на каждом ResultRow.
- `aria-activedescendant={selectedId}` на ListView.
- `role="tablist"` на Sidebar.
- `role="tab"`, `aria-selected={isActive}` на ModeButton.
- `aria-label="Search"` на input.

## Verify production build
Description:
- Выполнить `npm run build` — Plasmo соберёт production bundle в `build/chrome-mv3-prod/`.
- Загрузить production-сборку как unpacked extension.
- Убедиться, что service worker не держится постоянно (в dev он живёт вечно, в production — ~30с после последнего запроса).
- Проверить, что Ctrl+Space работает и после перезагрузки Chrome.

Priority: High

## Document extension usage
Description:
Написать краткий README в корне проекта:

```markdown
# Rofi Switcher

A window switcher and launcher for Chrome, inspired by Rofi.

## Usage

- `Ctrl+Space` — open/close the switcher
- Type to filter tabs and history
- `ArrowUp/Down` — navigate
- `Enter` — open selected item
- `Tab` / `Ctrl+Tab` — switch between modes (All, Groups, History)
- `Escape` — close

## Development

- `npm run dev` — hot-reload dev build
- `npm run build` — production build
- Load `build/chrome-mv3-prod/` as unpacked extension
```

Priority: Medium
```

---

### Что изменилось по сравнению с первой версией

| Было | Стало | Причина |
|---|---|---|
| `style.css` через обычный import | `getStyle()` + `data-text:` import | Plasmo injects CSS in Shadow DOM |
| `scripting` permission | удалён | Content script уже запущен на всех страницах |
| Background injects via `executeScript` | Просто `tabs.sendMessage` | Plasmo сам управляет content script |
| `:root` в CSS | `:host` в CSS | Shadow DOM isolation |
| — | **Favicon с fallback** | UX: без иконок список слепой |
| — | **Group color indicator** | UX: группы неразличимы без цвета |
| — | **Error Boundary** | React crash не должен ломать страницу |
| — | `export {}` note | Plasmo требует ES module в каждом файле |
| — | **Production build verification** | Dev и production ведут себя по-разному |
| — | **README** | Документация для разработчиков |

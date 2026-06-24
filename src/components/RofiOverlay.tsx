import { useState, useRef, useEffect, useCallback } from "react"
import { sendToBackground } from "@plasmohq/messaging"
import { parseKeyCombo } from "~utils/parseKyCombo"
import { useChromeMessage } from "~hooks/useChromeMessage"
import { useKeyDown } from "~hooks/useKeyDown"
import { useEscape } from "~hooks/useEscape"
import { useVisibilityChange } from "~hooks/useVisibilityChange"
import { useTabList } from "~hooks/useTabList"
import { useHistoryList } from "~hooks/useHistoryList"
import { useCommandsList } from "~hooks/useCommandsList"
import { getStorageValue } from "~chrome/storage"
import { ConditionBuilder } from "wi-condition-builder"
import { Command } from "~utils/commands"

type Mode = "tabs" | "history" | "commands"

const MODE_ORDER: Mode[] = ["tabs", "history", "commands"]

const styles = {
  overlay: {
    position: "fixed" as const,
    inset: 0,
    zIndex: 2147483647,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0, 0, 0, 0.5)",
  },
  window: {
    width: 600,
    maxHeight: "60vh",
    background: "#1e1e2e",
    borderRadius: 12,
    overflow: "hidden",
    fontFamily: "sans-serif",
    fontSize: 14,
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    display: "flex",
    flexDirection: "column" as const,
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    border: "none",
    borderBottom: "1px solid #313244",
    background: "#181825",
    color: "#cdd6f4",
    fontSize: 16,
    outline: "none",
    boxSizing: "border-box" as const,
  },
  list: {
    overflow: "auto",
    flex: 1,
  },
  item: (selected: boolean) => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 16px",
    cursor: "pointer",
    background: selected ? "#313244" : "transparent",
    color: "#cdd6f4",
  }),
  favicon: {
    width: 16,
    height: 16,
    flexShrink: 0,
    textAlign: "center" as const,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    flex: 1,
  },
  url: {
    color: "#6c7086",
    fontSize: 12,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    maxWidth: 250,
  },
  bar: {
    display: "flex",
    borderTop: "1px solid #313244",
  },
  barItem: (active: boolean) => ({
    flex: 1,
    textAlign: "center" as const,
    padding: "8px 0",
    fontSize: 12,
    color: active ? "#89b4fa" : "#6c7086",
    background: active ? "#181825" : "transparent",
    cursor: "pointer",
    userSelect: "none" as const,
  }),
}

const RofiOverlay = () => {
  const [visible, setVisible] = useState(false)
  const [query, setQuery] = useState("")
  const [mode, setMode] = useState<Mode>("tabs")
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const shortcutRef = useRef("Ctrl+.")
  const prevModeRef = useRef<Mode>("tabs")

  const containerRef = useCallback((el: HTMLDivElement | null) => {
    setContainer(el)
  }, [])

  const { tabs, selectedIndex: tabIndex, switchToTab } = useTabList(
    visible && mode === "tabs",
    query,
    visible ? container : null,
  )
  const {
    items: historyItems,
    selectedIndex: historyIndex,
    openItem,
    permissionGranted,
    requestPermission,
  } = useHistoryList(
    visible && mode === "history",
    query,
    visible ? container : null,
  )
  const { commands, selectedIndex: commandsIndex } = useCommandsList(
    visible && mode === "commands",
    query,
    visible ? container : null,
  )

  const currentItems = new ConditionBuilder<chrome.tabs.Tab[] | chrome.history.HistoryItem[] | Command[]>()
    .on(() => mode === "tabs", tabs)
    .on(() => mode === "history", historyItems)
    .build(() => commands);
  
  const selectedIndex = new ConditionBuilder<number>()
  .on(() => mode === "tabs", tabIndex)
  .on(() => mode === "history", historyIndex)
  .build(() => commandsIndex);

  // const currentItems = mode === "tabs" ? tabs : mode === "history" ? historyItems : commands
  // const selectedIndex = mode === "tabs" ? tabIndex : mode === "history" ? historyIndex : commandsIndex

  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getStorageValue<string>("toggleShortcut").then((val) => {
      if (val) shortcutRef.current = val
    })
  }, [])

  useEffect(() => {
    if (visible) {
      setQuery("")
      setMode("tabs")
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [visible])

  // Auto-switch to commands mode when typing /
  useEffect(() => {
    if (query.startsWith("/") && mode !== "commands") {
      prevModeRef.current = mode
      setMode("commands")
    } else if (!query.startsWith("/") && mode === "commands") {
      setMode(prevModeRef.current)
    }
  }, [query, mode])

  useEffect(() => {
    if (!listRef.current) return
    const el = listRef.current.children[selectedIndex] as HTMLElement
    el?.scrollIntoView({ block: "nearest" })
  }, [selectedIndex, currentItems.length])

  useChromeMessage((msg) => {
    if (msg.type === "toggle-rofi") setVisible((v) => !v)
    if (msg.type === "shortcut-updated") shortcutRef.current = msg.shortcut
  })

  // Shortcut toggle — всегда на document (глобальный хоткей)
  useKeyDown((e) => {
    const combo = parseKeyCombo(e)
    if (combo && combo === shortcutRef.current) {
      e.preventDefault()
      setVisible((v) => !v)
    }
  })

  // Режим переключения — на контейнере оверлея
  useKeyDown(
    (e) => {
      if (!visible) return

      if (e.key === "ArrowLeft") {
        e.preventDefault()
        const idx = MODE_ORDER.indexOf(mode)
        setMode(MODE_ORDER[(idx - 1 + MODE_ORDER.length) % MODE_ORDER.length])
        setQuery("")
      }

      if (e.key === "ArrowRight") {
        e.preventDefault()
        const idx = MODE_ORDER.indexOf(mode)
        setMode(MODE_ORDER[(idx + 1) % MODE_ORDER.length])
        setQuery("")
      }
    },
    visible ? container : null,
  )

  const completeOrExecute = useCallback((cmd: typeof commands[number]) => {
    const fragment = query.slice(1).trim()
    const cmdPart = fragment.split(/\s+/)[0]

    // Auto-complete if command name is not fully typed
    if (cmdPart !== cmd.id) {
      const completed = `/${cmd.id} `
      setQuery(completed)
      setTimeout(() => {
        inputRef.current?.focus()
      }, 0)
      return
    }

    // Execute command
    if (cmd.id === "settings") {
      sendToBackground({ name: "open-url", body: { url: "chrome://settings" } })
      setVisible(false)
    }

    if (cmd.id === "open") {
      const param = query.slice("/open".length).trim()
      if (!param) return
      const url = param.includes("://") ? param : `https://${param}`
      sendToBackground({ name: "open-url", body: { url } })
      setVisible(false)
    }
  }, [query])

  // Enter handler for commands mode
  useKeyDown(
    (e) => {
      if (!visible || mode !== "commands") return
      if (e.key === "Enter") {
        e.preventDefault()
        const cmd = commands[commandsIndex]
        if (!cmd) return
        completeOrExecute(cmd)
      }
    },
    visible ? container : null,
  )

  useEscape(() => setVisible(false), visible ? container : null)

  useVisibilityChange((hidden) => {
    if (hidden && visible) setVisible(false)
  })

  if (!visible) return null

  return (
    <div style={styles.overlay} onClick={() => setVisible(false)}>
      <div
        ref={containerRef}
        style={styles.window}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          style={styles.input}
          placeholder="Type / for commands, or search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div ref={listRef} style={styles.list}>
          {mode === "history" && !permissionGranted ? (
            <div
              style={{
                padding: 32,
                textAlign: "center" as const,
                color: "#6c7086",
              }}
            >
              <div style={{ marginBottom: 12 }}>
                Grant history access in extension settings
              </div>
              <button
                onClick={requestPermission}
                style={{
                  padding: "8px 24px",
                  background: "#e65100",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                Grant access
              </button>
            </div>
          ) : mode === "commands" ? (
            commands.map((cmd, i) => (
              <div
                key={cmd.id}
                style={styles.item(i === commandsIndex)}
                onClick={() => completeOrExecute(cmd)}
              >
                <span style={styles.favicon}>{cmd.icon}</span>
                <span style={styles.title}>{cmd.title}</span>
                <span style={{ ...styles.url, maxWidth: 300 }}>
                  {cmd.description}
                </span>
              </div>
            ))
          ) : (
            (currentItems as any[]).map((item: any, i) => (
              <div
                key={item.id ?? item.url ?? i}
                style={styles.item(i === selectedIndex)}
                onClick={() => {
                  if (mode === "tabs" && item.id && item.windowId) {
                    switchToTab(item.id, item.windowId)
                  }
                  if (mode === "history" && item.url) {
                    openItem(item.url)
                  }
                }}
              >
                <span style={styles.favicon}>
                  {mode === "tabs"
                    ? (item.favIconUrl && (
                        <img
                          src={item.favIconUrl}
                          alt=""
                          style={{ width: 16, height: 16 }}
                        />
                      )) || "🌐"
                    : "📜"}
                </span>
                <span style={styles.title}>{item.title}</span>
                {item.url && (
                  <span style={styles.url}>
                    {new URL(item.url).hostname}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
        <div style={styles.bar}>
          {MODE_ORDER.map((m) => (
            <div
              key={m}
              style={styles.barItem(mode === m)}
              onClick={() => {
                setMode(m)
                setQuery("")
              }}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default RofiOverlay

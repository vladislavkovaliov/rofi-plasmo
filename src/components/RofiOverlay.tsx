import { useState, useRef, useEffect, useCallback } from "react"
import { parseKeyCombo } from "~utils/parseKyCombo"
import { useChromeMessage } from "~hooks/useChromeMessage"
import { useKeyDown } from "~hooks/useKeyDown"
import { useEscape } from "~hooks/useEscape"
import { useVisibilityChange } from "~hooks/useVisibilityChange"
import { useTabList } from "~hooks/useTabList"
import { useHistoryList } from "~hooks/useHistoryList"
import { getStorageValue } from "~chrome/storage"

type Mode = "tabs" | "history"

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
  const shortcutRef = useRef("Ctrl+Space")

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

  const currentItems = mode === "tabs" ? tabs : historyItems
  const selectedIndex = mode === "tabs" ? tabIndex : historyIndex

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
        setMode("tabs")
        setQuery("")
      }

      if (e.key === "ArrowRight") {
        e.preventDefault()
        setMode("history")
        setQuery("")
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
          placeholder={
            mode === "tabs" ? "Search tabs..." : "Search history..."
          }
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
          ) : currentItems.map((item: any, i) => (
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
          ))}
        </div>
        <div style={styles.bar}>
          <div
            style={styles.barItem(mode === "tabs")}
            onClick={() => {
              setMode("tabs")
              setQuery("")
            }}
          >
            Tabs
          </div>
          <div
            style={styles.barItem(mode === "history")}
            onClick={() => {
              setMode("history")
              setQuery("")
            }}
          >
            History
          </div>
        </div>
      </div>
    </div>
  )
}

export default RofiOverlay

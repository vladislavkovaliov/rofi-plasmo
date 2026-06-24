import { useState, useEffect, useCallback, useMemo } from "react"
import { sendToBackground } from "@plasmohq/messaging"
import type { HistoryData } from "~background/messages/get-history"
import { useKeyDown } from "~hooks/useKeyDown"

export function useHistoryList(
  visible: boolean,
  query: string,
  container?: HTMLElement | null,
) {
  const [items, setItems] = useState<chrome.history.HistoryItem[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)

  const filteredItems = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return items
    return items.filter(
      (item) =>
        item.title?.toLowerCase().includes(q) ||
        item.url?.toLowerCase().includes(q),
    )
  }, [items, query])

  useEffect(() => {
    if (!visible) {
      setItems([])
      setSelectedIndex(0)
      return
    }

    sendToBackground<{}, HistoryData>({ name: "get-history" }).then((res) => {
      setItems(res.items)
    })
  }, [visible])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const selectNext = useCallback(() => {
    setSelectedIndex((i) => Math.min(i + 1, filteredItems.length - 1))
  }, [filteredItems.length])

  const selectPrev = useCallback(() => {
    setSelectedIndex((i) => Math.max(i - 1, 0))
  }, [])

  const openItem = useCallback((url: string) => {
    sendToBackground({ name: "open-url", body: { url } })
  }, [])

  useKeyDown(
    (e) => {
      if (!visible || filteredItems.length === 0) return

      if (e.key === "ArrowDown") {
        e.preventDefault()
        selectNext()
      }

      if (e.key === "ArrowUp") {
        e.preventDefault()
        selectPrev()
      }

      if (e.key === "Enter") {
        e.preventDefault()
        const item = filteredItems[selectedIndex]
        if (item?.url) openItem(item.url)
      }
    },
    container,
  )

  return { items: filteredItems, selectedIndex, openItem }
}

import { useState, useEffect, useCallback, useMemo } from "react"
import { sendToBackground } from "@plasmohq/messaging"
import type { WindowTabsData } from "~background/messages/get-window-tabs"
import { useKeyDown } from "~hooks/useKeyDown"

export function useTabList(
  visible: boolean,
  query: string,
  container?: HTMLElement | null,
) {
  const [tabs, setTabs] = useState<chrome.tabs.Tab[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)

  const filteredTabs = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return tabs
    return tabs.filter(
      (tab) =>
        tab.title?.toLowerCase().includes(q) ||
        tab.url?.toLowerCase().includes(q),
    )
  }, [tabs, query])

  useEffect(() => {
    if (!visible) {
      setTabs([])
      setSelectedIndex(0)
      return
    }

    sendToBackground<{}, WindowTabsData>({ name: "get-window-tabs" }).then(
      (res) => {
        setTabs(res.tabs)
      },
    )
  }, [visible])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const selectNext = useCallback(() => {
    setSelectedIndex((i) => Math.min(i + 1, filteredTabs.length - 1))
  }, [filteredTabs.length])

  const selectPrev = useCallback(() => {
    setSelectedIndex((i) => Math.max(i - 1, 0))
  }, [])

  const switchToTab = useCallback(
    (tabId: number, windowId: number) => {
      sendToBackground({
        name: "switch-to-tab",
        body: { tabId, windowId },
      })
    },
    [],
  )

  useKeyDown(
    (e) => {
      if (!visible || filteredTabs.length === 0) return

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
        const tab = filteredTabs[selectedIndex]
        if (tab?.id && tab.windowId) {
          switchToTab(tab.id, tab.windowId)
        }
      }
    },
    container,
  )

  return { tabs: filteredTabs, selectedIndex, switchToTab }
}

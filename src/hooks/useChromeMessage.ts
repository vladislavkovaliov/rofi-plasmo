import { useEffect, useRef } from "react"

export function useChromeMessage(handler: (msg: any) => void): void {
  const savedHandler = useRef(handler)
  savedHandler.current = handler

  useEffect(() => {
    const listener = (msg: any) => savedHandler.current(msg)
    chrome.runtime.onMessage.addListener(listener)
    return () => chrome.runtime.onMessage.removeListener(listener)
  }, [])
}

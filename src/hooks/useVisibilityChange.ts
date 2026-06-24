import { useEffect, useRef } from "react"

export function useVisibilityChange(handler: (hidden: boolean) => void): void {
  const savedHandler = useRef(handler)
  savedHandler.current = handler

  useEffect(() => {
    const listener = () => savedHandler.current(document.hidden)
    document.addEventListener("visibilitychange", listener)
    return () => document.removeEventListener("visibilitychange", listener)
  }, [])
}

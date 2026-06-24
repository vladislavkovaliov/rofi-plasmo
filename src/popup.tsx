import { useState, useRef } from "react"
import { parseKeyCombo } from "~utils/parseKyCombo"
import { useChromeStorage } from "~hooks/useChromeStorage"
import { sendMessageToActiveTab } from "~chrome/tabs"

function Popup() {
  const [shortcut, setShortcut] = useChromeStorage("toggleShortcut", "Ctrl+Space")
  const [recording, setRecording] = useState(false)
  const [saved, setSaved] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!recording) return
    e.preventDefault()
    const combo = parseKeyCombo(e)
    if (combo) setShortcut(combo)
  }

  const save = () => {
    setShortcut(shortcut)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
    sendMessageToActiveTab({ type: "shortcut-updated", shortcut })
  }

  const toggleOverlay = () => {
    sendMessageToActiveTab({ type: "toggle-rofi" })
  }

  return (
    <div style={{ padding: 16, width: 260, fontFamily: "sans-serif" }}>
      <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "#333" }}>Rofi Switcher</h3>

      <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>
        Keyboard shortcut
      </label>
      <input
        style={{
          width: "100%", padding: "8px 10px", marginBottom: 8, boxSizing: "border-box",
          border: "1px solid #ccc", borderRadius: 6, fontSize: 13, outline: "none"
        }}
        value={shortcut}
        onFocus={() => setRecording(true)}
        onBlur={() => setRecording(false)}
        onKeyDown={handleKeyDown}
        placeholder="Press keys..."
        readOnly
      />

      <button
        onClick={save}
        style={{
          width: "100%", padding: "8px", marginBottom: 8,
          background: saved ? "#2e7d32" : "#4a90d9", color: "#fff", border: "none",
          borderRadius: 6, cursor: "pointer", fontSize: 13
        }}
      >
        {saved ? "Saved!" : "Save shortcut"}
      </button>

      <button
        onClick={toggleOverlay}
        style={{
          width: "100%", padding: "8px",
          background: "#2b2b2b", color: "#fff", border: "none",
          borderRadius: 6, cursor: "pointer", fontSize: 13
        }}
      >
        Toggle overlay
      </button>
    </div>
  )
}

export default Popup

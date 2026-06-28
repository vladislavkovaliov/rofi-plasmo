import { useState, useEffect } from "react";
import { getStorageValue, setStorageValue } from "~chrome/storage";
import { sendMessageToActiveTab } from "~chrome/tabs";
import { useChromeStorage } from "~hooks/useChromeStorage";
import { parseKeyCombo } from "~utils/parseKyCombo";

const THEMES = ["default", "pink", "glass"];

function Popup() {
    const [shortcut, setShortcut] = useChromeStorage(
        "toggleShortcut",
        "Ctrl+Space",
    );
    const [recording, setRecording] = useState(false);
    const [saved, setSaved] = useState(false);
    const [historyGranted, setHistoryGranted] = useState<boolean | null>(null);
    const [currentTheme, setCurrentTheme] = useState("default");

    useEffect(() => {
        getStorageValue<string>("theme").then((val) => {
            if (val) {
                setCurrentTheme(val);
            }
        });
    }, []);

    const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const theme = e.target.value;

        setCurrentTheme(theme);
        setStorageValue("theme", theme);
        sendMessageToActiveTab({ type: "theme-changed", theme });
    };

    useEffect(() => {
        chrome.permissions
            .contains({ permissions: ["history"] })
            .then((res) => {
                setHistoryGranted(res);
            });
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!recording) {
            return;
        }

        e.preventDefault();
        const combo = parseKeyCombo(e);
        if (combo) {
            setShortcut(combo);
        }
    };

    const save = () => {
        setShortcut(shortcut);
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
        sendMessageToActiveTab({ type: "shortcut-updated", shortcut });
    };

    const toggleOverlay = () => {
        sendMessageToActiveTab({ type: "toggle-rofi" });
    };

    const grantHistory = async () => {
        const granted = await chrome.permissions.request({
            permissions: ["history"],
        });

        setHistoryGranted(granted);
    };

    return (
        <div style={{ padding: 16, width: 260, fontFamily: "sans-serif" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "#333" }}>
                Rofi Switcher
            </h3>

            <label
                style={{
                    fontSize: 12,
                    color: "#666",
                    display: "block",
                    marginBottom: 4,
                }}
            >
                Keyboard shortcut
            </label>
            <input
                style={{
                    width: "100%",
                    padding: "8px 10px",
                    marginBottom: 8,
                    boxSizing: "border-box",
                    border: "1px solid #ccc",
                    borderRadius: 6,
                    fontSize: 13,
                    outline: "none",
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
                    width: "100%",
                    padding: "8px",
                    marginBottom: 8,
                    background: saved ? "#2e7d32" : "#4a90d9",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 13,
                }}
            >
                {saved ? "Saved!" : "Save shortcut"}
            </button>

            <button
                onClick={toggleOverlay}
                style={{
                    width: "100%",
                    padding: "8px",
                    marginBottom: 12,
                    background: "#2b2b2b",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: 13,
                }}
            >
                Toggle overlay
            </button>

            <div
                style={{
                    borderTop: "1px solid #eee",
                    paddingTop: 12,
                    marginBottom: 12,
                }}
            >
                <label
                    style={{
                        fontSize: 12,
                        color: "#666",
                        display: "block",
                        marginBottom: 4,
                    }}
                >
                    Theme
                </label>
                <select
                    value={currentTheme}
                    onChange={handleThemeChange}
                    style={{
                        width: "100%",
                        padding: "8px 10px",
                        boxSizing: "border-box",
                        border: "1px solid #ccc",
                        borderRadius: 6,
                        fontSize: 13,
                        outline: "none",
                        background: "#fff",
                        color: "#333",
                    }}
                >
                    {THEMES.map((t) => (
                        <option key={t} value={t}>
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                        </option>
                    ))}
                </select>
            </div>

            <div
                style={{
                    borderTop: "1px solid #eee",
                    paddingTop: 12,
                }}
            >
                <label
                    style={{
                        fontSize: 12,
                        color: "#666",
                        display: "block",
                        marginBottom: 4,
                    }}
                >
                    History access
                </label>
                {historyGranted === null ? (
                    <div style={{ fontSize: 12, color: "#999" }}>
                        Checking...
                    </div>
                ) : historyGranted ? (
                    <div style={{ fontSize: 12, color: "#2e7d32" }}>
                        Access granted ✓
                    </div>
                ) : (
                    <button
                        onClick={grantHistory}
                        style={{
                            width: "100%",
                            padding: "8px",
                            background: "#e65100",
                            color: "#fff",
                            border: "none",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontSize: 13,
                        }}
                    >
                        Grant access to history
                    </button>
                )}
            </div>
        </div>
    );
}

export default Popup;

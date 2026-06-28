import { type Mode, MODE_ORDER } from "~utils/mode";
import { capitalize } from "~utils/text";

interface ModeBarProps {
    currentMode: Mode;
    onModeChange: (mode: Mode) => void;
}

const styles = {
    bar: {
        display: "flex",
        borderTop: "1px solid var(--rofi-border)",
    },
    barItem: (active: boolean) => ({
        flex: 1,
        textAlign: "center" as const,
        padding: "8px 0",
        fontSize: 12,
        color: active ? "var(--rofi-accent)" : "var(--rofi-fg-muted)",
        background: active ? "var(--rofi-bg-alt)" : "transparent",
        cursor: "pointer",
        userSelect: "none" as const,
    }),
};

export function ModeBar({ currentMode, onModeChange }: ModeBarProps) {
    return (
        <div style={styles.bar}>
            {MODE_ORDER.map((m) => (
                <div
                    key={m}
                    style={styles.barItem(currentMode === m)}
                    onClick={() => onModeChange(m)}
                >
                    {capitalize(m)}
                </div>
            ))}
        </div>
    );
}

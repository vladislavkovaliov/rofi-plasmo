import { isModifierKey, formatKeyName } from "./keyboard";

export function parseKeyCombo(e: {
    ctrlKey: boolean;
    altKey: boolean;
    shiftKey: boolean;
    metaKey: boolean;
    key: string;
}): string {
    const parts: string[] = [];
    if (e.ctrlKey) {
        parts.push("Ctrl");
    }

    if (e.altKey) {
        parts.push("Alt");
    }

    if (e.shiftKey) {
        parts.push("Shift");
    }

    if (e.metaKey) {
        parts.push("Meta");
    }

    const key = formatKeyName(e.key);
    if (!isModifierKey(e.key)) {
        parts.push(key);
    }

    return parts.join("+");
}

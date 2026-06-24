export function isModifierKey(key: string): boolean {
    return ["Control", "Alt", "Shift", "Meta"].includes(key);
}

export function formatKeyName(key: string): string {
    if (key === " ") {
        return "Space";
    }

    return key.length === 1 ? key.toUpperCase() : key;
}

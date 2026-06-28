export function isModifierKey(key: string): boolean {
    return ["Control", "Alt", "Shift", "Meta"].includes(key);
}

export function formatKeyName(key: string): string {
    if (key === " ") {
        return "Space";
    }

    return key.length === 1 ? key.toUpperCase() : key;
}

export const KEYS = {
    ARROW_UP: "ArrowUp",
    ARROW_DOWN: "ArrowDown",
    ARROW_LEFT: "ArrowLeft",
    ARROW_RIGHT: "ArrowRight",
    ENTER: "Enter",
    ESCAPE: "Escape",
} as const;

export const MODIFIER = {
    MAC: "Meta",
    PC: "Ctrl",
} as const;

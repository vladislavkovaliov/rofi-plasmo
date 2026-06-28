export type Mode = "tabs" | "history" | "commands";

export const MODE_ORDER: Mode[] = ["tabs", "history", "commands"];

export function cycleMode(
    current: Mode,
    direction: -1 | 1,
    order: Mode[],
): Mode {
    const idx = order.indexOf(current);
    const next = (idx + direction + order.length) % order.length;

    return order[next];
}

import type { Command } from "~utils/commands";

export type CommandAction =
    | { type: "set-query"; value: string }
    | { type: "focus-input" }
    | { type: "open-url"; url: string }
    | { type: "show-themes" }
    | { type: "hide-overlay" };

export function getCommandCompletion(
    fragment: string,
    command: Command,
): string | null {
    const cmdPart = fragment.split(/\s+/)[0];

    if (cmdPart !== command.id) {
        return `/${command.id} `;
    }

    return null;
}

export function getCommandAction(
    command: Command,
    query: string,
): CommandAction[] {
    const actions: CommandAction[] = [];

    if (command.id === "themes") {
        actions.push({ type: "show-themes" }, { type: "set-query", value: "" });

        return actions;
    }

    if (command.id === "settings") {
        actions.push(
            { type: "open-url", url: "chrome://settings" },
            { type: "hide-overlay" },
        );

        return actions;
    }

    if (command.id === "open") {
        const param = query.slice("/open".length).trim();

        if (!param) {
            return actions;
        }

        const url = param.includes("://") ? param : `https://${param}`;

        actions.push({ type: "open-url", url }, { type: "hide-overlay" });

        return actions;
    }

    return actions;
}

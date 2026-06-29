export type Command = {
    id: string;
    title: string;
    icon: string;
    description: string;
};

export const COMMANDS: Command[] = [
    {
        id: "open",
        title: "Open URL",
        icon: "🔗",
        description: "/open <url> — opens URL in a new tab",
    },
    {
        id: "tabs",
        title: "Open tabs",
        icon: "🔗",
        description: "/tabs — opens active tabs list",
    },
    {
        id: "history",
        title: "Open history",
        icon: "🔗",
        description: "/hist (/history) — opens history list",
    },
    {
        id: "settings",
        title: "Open Settings",
        icon: "⚙️",
        description: "/settings — opens chrome://settings in a new tab",
    },
    {
        id: "themes",
        title: "Select Theme",
        icon: "🎨",
        description: "/themes — change the overlay theme",
    },
];

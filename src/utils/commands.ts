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

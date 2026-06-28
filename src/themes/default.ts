import type { Theme } from "./types";

export const defaultTheme: Theme = {
    name: "default",
    colors: {
        bg: "#1e1e2e",
        bgAlt: "#181825",
        bgSelected: "#313244",
        fg: "#cdd6f4",
        fgMuted: "#6c7086",
        fgMutedAlt: "#585b70",
        accent: "#89b4fa",
        accentHover: "#74c7ec",
        overlay: "rgba(0, 0, 0, 0.5)",
        border: "#313244",
    },
    typography: {
        fontFamily: "sans-serif",
        fontSize: "14px",
        fontSizeSm: "12px",
        fontSizeLg: "16px",
    },
    layout: {
        borderRadius: "12px",
        windowWidth: "600px",
        spacing: "16px",
    },
    shadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
    overlayBackdrop: "none",
};

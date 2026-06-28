import type { Theme } from "./types";

export const pinkTheme: Theme = {
    name: "pink",
    colors: {
        bg: "#2b1a2b",
        bgAlt: "#231123",
        bgSelected: "#3d243d",
        fg: "#f5d6e6",
        fgMuted: "#8f5e7a",
        fgMutedAlt: "#704d63",
        accent: "#f5a0c8",
        accentHover: "#f08ab8",
        overlay: "rgba(30, 10, 20, 0.6)",
        border: "#3d243d",
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

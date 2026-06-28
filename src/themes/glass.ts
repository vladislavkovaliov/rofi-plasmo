import type { Theme } from "./types";

export const glassTheme: Theme = {
    name: "glass",
    colors: {
        bg: "rgba(255, 255, 255, 0.08)",
        bgAlt: "rgba(255, 255, 255, 0.03)",
        bgSelected: "rgba(255, 255, 255, 0.12)",
        fg: "#f0eef3",
        fgMuted: "rgba(240, 238, 243, 0.5)",
        fgMutedAlt: "rgba(240, 238, 243, 0.35)",
        accent: "#c4b5e0",
        accentHover: "#d4c7ed",
        overlay: "rgba(20, 18, 30, 0.4)",
        border: "rgba(255, 255, 255, 0.12)",
    },
    typography: {
        fontFamily: "sans-serif",
        fontSize: "14px",
        fontSizeSm: "12px",
        fontSizeLg: "16px",
    },
    layout: {
        borderRadius: "16px",
        windowWidth: "600px",
        spacing: "16px",
    },
    shadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
    overlayBackdrop: "blur(16px)",
};

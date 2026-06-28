import { forwardRef, type ReactNode } from "react";

interface OverlayWindowProps {
    children: ReactNode;
}

const styles = {
    window: {
        width: "var(--rofi-window-width)",
        maxHeight: "60vh",
        background: "var(--rofi-bg)",
        borderRadius: "var(--rofi-radius)",
        overflow: "hidden",
        fontFamily: "var(--rofi-font)",
        fontSize: "var(--rofi-font-size)",
        boxShadow: "var(--rofi-shadow)",
        display: "flex",
        flexDirection: "column" as const,
    },
};

export const OverlayWindow = forwardRef<HTMLDivElement, OverlayWindowProps>(
    ({ children }, ref) => (
        <div
            ref={ref}
            style={styles.window}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
        >
            {children}
        </div>
    ),
);
OverlayWindow.displayName = "OverlayWindow";

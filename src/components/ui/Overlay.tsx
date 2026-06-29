import { type ReactNode } from "react";

interface OverlayProps {
    children: ReactNode;
    onClick: () => void;
}

const styles = {
    overlay: {
        position: "fixed" as const,
        inset: 0,
        zIndex: 2147483647,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--rofi-overlay)",
        backdropFilter: "var(--rofi-overlay-backdrop)",
        WebkitBackdropFilter: "var(--rofi-overlay-backdrop)",
    },
};

export function Overlay({ children, onClick }: OverlayProps) {
    return (
        <div style={styles.overlay} onClick={onClick}>
            {children}
        </div>
    );
}

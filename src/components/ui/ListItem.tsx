import { type ReactNode } from "react";

interface ListItemProps {
    selected: boolean;
    onClick: () => void;
    favicon: ReactNode;
    title: string;
    url?: string;
}

const styles = {
    item: (selected: boolean) => ({
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 16px",
        cursor: "pointer",
        background: selected ? "var(--rofi-bg-selected)" : "transparent",
        color: "var(--rofi-fg)",
    }),
    favicon: {
        width: 16,
        height: 16,
        flexShrink: 0,
        textAlign: "center" as const,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    title: {
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap" as const,
        flex: 1,
    },
    url: {
        color: "var(--rofi-fg-muted)",
        fontSize: "var(--rofi-font-size-sm)",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap" as const,
        maxWidth: 250,
    },
};

export function ListItem({
    selected,
    onClick,
    favicon,
    title,
    url,
}: ListItemProps) {
    return (
        <div style={styles.item(selected)} onClick={onClick}>
            <span style={styles.favicon}>{favicon}</span>
            <span style={styles.title}>{title}</span>
            {url && <span style={styles.url}>{url}</span>}
        </div>
    );
}

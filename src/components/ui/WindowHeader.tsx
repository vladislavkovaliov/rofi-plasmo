interface WindowHeaderProps {
    title: string;
}

const styles = {
    windowHeader: {
        padding: "6px 16px",
        fontSize: 11,
        fontWeight: 600,
        color: "var(--rofi-fg-muted-alt)",
        textTransform: "uppercase" as const,
        letterSpacing: "0.5px",
        background: "var(--rofi-bg-alt)",
        borderBottom: "1px solid var(--rofi-border)",
    },
};

export function WindowHeader({ title }: WindowHeaderProps) {
    return <div style={styles.windowHeader}>{title}</div>;
}

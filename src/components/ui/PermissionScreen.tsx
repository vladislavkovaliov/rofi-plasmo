interface PermissionScreenProps {
    onRequest: () => void;
}

const styles = {
    container: {
        padding: 32,
        textAlign: "center" as const,
        color: "#6c7086",
    },
    message: {
        marginBottom: 12,
    },
    button: {
        padding: "8px 24px",
        background: "#e65100",
        color: "#fff",
        border: "none",
        borderRadius: 6,
        cursor: "pointer",
        fontSize: 13,
    },
};

export function PermissionScreen({ onRequest }: PermissionScreenProps) {
    return (
        <div style={styles.container}>
            <div style={styles.message}>
                Grant history access in extension settings
            </div>
            <button style={styles.button} onClick={onRequest}>
                Grant access
            </button>
        </div>
    );
}

import { forwardRef } from "react";

interface SearchInputProps {
    query: string;
    onChange: (value: string) => void;
}

const styles = {
    input: {
        width: "100%",
        padding: "14px 16px",
        border: "none",
        borderBottom: "1px solid var(--rofi-border)",
        background: "var(--rofi-bg-alt)",
        color: "var(--rofi-fg)",
        fontSize: "var(--rofi-font-size-lg)",
        outline: "none",
        boxSizing: "border-box" as const,
    },
};

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
    ({ query, onChange }, ref) => (
        <input
            ref={ref}
            style={styles.input}
            placeholder="Type / for commands, or search..."
            value={query}
            onChange={(e) => onChange(e.target.value)}
        />
    ),
);
SearchInput.displayName = "SearchInput";

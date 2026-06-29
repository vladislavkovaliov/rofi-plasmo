import { themes } from "~themes/registry";

import { ListItem } from "./ListItem";

interface ThemeItemListProps {
    themeNames: string[];
    themeListIndex: number;
    themeName: string;
    onSelect: (name: string) => void;
}

export function ThemeItemList({
    themeNames,
    themeListIndex,
    themeName,
    onSelect,
}: ThemeItemListProps) {
    return (
        <>
            {themeNames.map((name, i) => (
                <ListItem
                    key={name}
                    selected={i === themeListIndex}
                    onClick={() => onSelect(name)}
                    favicon={
                        <span
                            style={{
                                width: 12,
                                height: 12,
                                borderRadius: "50%",
                                background: themes[name].colors.accent,
                                display: "inline-block",
                            }}
                        />
                    }
                    title={name.charAt(0).toUpperCase() + name.slice(1)}
                    url={name === themeName ? "Active" : "Press Enter to apply"}
                />
            ))}
        </>
    );
}

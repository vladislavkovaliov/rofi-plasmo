import type { Theme } from "~themes/types";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    useRef,
    useCallback,
    type ReactNode,
} from "react";
import { getStorageValue, setStorageValue } from "~chrome/storage";
import { themes } from "~themes/registry";

interface ThemeContextValue {
    theme: Theme;
    setTheme: (name: string) => void;
    themeName: string;
}

const ThemeContext = createContext<ThemeContextValue>({
    theme: themes.default,
    setTheme: () => {},
    themeName: "default",
});

function applyTheme(root: HTMLElement, theme: Theme): void {
    const { colors, typography, layout } = theme;

    root.style.setProperty("--rofi-bg", colors.bg);
    root.style.setProperty("--rofi-bg-alt", colors.bgAlt);
    root.style.setProperty("--rofi-bg-selected", colors.bgSelected);
    root.style.setProperty("--rofi-fg", colors.fg);
    root.style.setProperty("--rofi-fg-muted", colors.fgMuted);
    root.style.setProperty("--rofi-fg-muted-alt", colors.fgMutedAlt);
    root.style.setProperty("--rofi-accent", colors.accent);
    root.style.setProperty("--rofi-accent-hover", colors.accentHover);
    root.style.setProperty("--rofi-overlay", colors.overlay);
    root.style.setProperty("--rofi-border", colors.border);

    root.style.setProperty("--rofi-font", typography.fontFamily);
    root.style.setProperty("--rofi-font-size", typography.fontSize);
    root.style.setProperty("--rofi-font-size-sm", typography.fontSizeSm);
    root.style.setProperty("--rofi-font-size-lg", typography.fontSizeLg);

    root.style.setProperty("--rofi-radius", layout.borderRadius);
    root.style.setProperty("--rofi-window-width", layout.windowWidth);
    root.style.setProperty("--rofi-spacing", layout.spacing);

    root.style.setProperty("--rofi-shadow", theme.shadow);
    root.style.setProperty("--rofi-overlay-backdrop", theme.overlayBackdrop);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [themeName, setThemeName] = useState("default");
    const rootRef = useRef<HTMLDivElement>(null);

    const changeTheme = useCallback((name: string) => {
        const t = themes[name];

        if (!t) {
            return;
        }

        setThemeName(name);
        if (rootRef.current) {
            applyTheme(rootRef.current, t);
        }

        setStorageValue("theme", name);
    }, []);

    useEffect(() => {
        getStorageValue<string>("theme").then((saved) => {
            if (saved && themes[saved]) {
                setThemeName(saved);
            }
        });
    }, []);

    useEffect(() => {
        if (rootRef.current) {
            applyTheme(rootRef.current, themes[themeName]);
        }
    }, [themeName]);

    return (
        <ThemeContext.Provider
            value={{
                theme: themes[themeName],
                setTheme: changeTheme,
                themeName,
            }}
        >
            <div ref={rootRef} style={{ all: "initial" }}>
                {children}
            </div>
        </ThemeContext.Provider>
    );
}

export function useTheme(): ThemeContextValue {
    return useContext(ThemeContext);
}

import { useState, useMemo } from "react";
import { useKeyDown } from "~hooks/useKeyDown";
import { themes } from "~themes/registry";
import { type Mode } from "~utils/mode";

interface UseThemeNavigationResult {
    showThemeList: boolean;
    setShowThemeList: (v: boolean) => void;
    setThemeListIndex: (v: number) => void;
    themeListIndex: number;
    themeNames: string[];
}

export function useThemeNavigation(
    visible: boolean,
    mode: Mode,
    container: HTMLElement | null,
): UseThemeNavigationResult {
    const [showThemeList, setShowThemeList] = useState(false);
    const [themeListIndex, setThemeListIndex] = useState(0);
    const themeNames = useMemo(() => Object.keys(themes), []);

    useKeyDown(
        (e) => {
            if (!visible || mode !== "commands" || !showThemeList) {
                return;
            }

            if (e.key === "ArrowDown") {
                e.preventDefault();
                setThemeListIndex((i) =>
                    Math.min(i + 1, themeNames.length - 1),
                );
            }

            if (e.key === "ArrowUp") {
                e.preventDefault();
                setThemeListIndex((i) => Math.max(i - 1, 0));
            }
        },
        visible ? container : null,
    );

    return {
        showThemeList,
        setShowThemeList,
        themeListIndex,
        setThemeListIndex,
        themeNames,
    };
}

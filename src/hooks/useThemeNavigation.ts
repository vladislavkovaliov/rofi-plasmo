import { useState, useMemo, useCallback } from "react";
import { themes } from "~themes/registry";

interface UseThemeNavigationResult {
    showThemeList: boolean;
    setShowThemeList: (v: boolean) => void;
    setThemeListIndex: (v: number) => void;
    themeListIndex: number;
    themeNames: string[];
    selectNext: () => void;
    selectPrev: () => void;
}

export function useThemeNavigation(): UseThemeNavigationResult {
    const [showThemeList, setShowThemeList] = useState(false);
    const [themeListIndex, setThemeListIndex] = useState(0);
    const themeNames = useMemo(() => Object.keys(themes), []);

    const selectNext = useCallback(() => {
        setThemeListIndex((i) => Math.min(i + 1, themeNames.length - 1));
    }, [themeNames.length]);

    const selectPrev = useCallback(() => {
        setThemeListIndex((i) => Math.max(i - 1, 0));
    }, []);

    return {
        showThemeList,
        setShowThemeList,
        themeListIndex,
        setThemeListIndex,
        themeNames,
        selectNext,
        selectPrev,
    };
}

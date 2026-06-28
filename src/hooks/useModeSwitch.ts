import { useEffect, useRef, type MutableRefObject } from "react";
import { type Mode } from "~utils/mode";

interface UseModeSwitchResult {
    prevModeRef: MutableRefObject<Mode>;
}

export function useModeSwitch(
    query: string,
    showThemeList: boolean,
    mode: Mode,
    setMode: (m: Mode) => void,
): UseModeSwitchResult {
    const prevModeRef = useRef<Mode>("tabs");

    useEffect(() => {
        if (query.startsWith("/") && mode !== "commands") {
            prevModeRef.current = mode;
            setMode("commands");
        } else if (
            !query.startsWith("/") &&
            mode === "commands" &&
            !showThemeList
        ) {
            setMode(prevModeRef.current);
        }
    }, [query, mode, showThemeList, setMode]);

    return { prevModeRef };
}

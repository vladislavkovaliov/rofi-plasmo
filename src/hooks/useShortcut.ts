import { useEffect, useRef, type MutableRefObject } from "react";
import { getStorageValue } from "~chrome/storage";
import { useKeyDown } from "~hooks/useKeyDown";
import { parseKeyCombo } from "~utils/parseKyCombo";

interface UseShortcutResult {
    shortcutRef: MutableRefObject<string>;
}

export function useShortcut(
    setVisible: React.Dispatch<React.SetStateAction<boolean>>,
): UseShortcutResult {
    const shortcutRef = useRef("Ctrl+.");

    useEffect(() => {
        getStorageValue<string>("toggleShortcut").then((val) => {
            if (val) {
                shortcutRef.current = val;
            }
        });
    }, []);

    useKeyDown((e) => {
        const combo = parseKeyCombo(e);

        if (combo && combo === shortcutRef.current) {
            e.preventDefault();
            setVisible((v) => !v);
        }
    });

    return { shortcutRef };
}

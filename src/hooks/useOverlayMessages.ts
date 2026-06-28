import type { MutableRefObject } from "react";

import { useChromeMessage } from "~hooks/useChromeMessage";

type OverlayMessage =
    | { type: "toggle-rofi" }
    | { type: "shortcut-updated"; shortcut: string }
    | { type: "theme-changed"; theme: string };

interface UseOverlayMessagesOptions {
    toggleVisible: () => void;
    shortcutRef: MutableRefObject<string>;
    onThemeChanged: (theme: string) => void;
}

export function useOverlayMessages({
    toggleVisible,
    shortcutRef,
    onThemeChanged,
}: UseOverlayMessagesOptions): void {
    useChromeMessage<OverlayMessage>((msg) => {
        if (msg.type === "toggle-rofi") {
            toggleVisible();
        }

        if (msg.type === "shortcut-updated") {
            shortcutRef.current = msg.shortcut;
        }

        if (msg.type === "theme-changed") {
            onThemeChanged(msg.theme);
        }
    });
}

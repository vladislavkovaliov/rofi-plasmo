import type { HistoryData } from "~background/messages/get-history";

import { sendToBackground } from "~utils/messaging";
import { useState, useEffect, useCallback, useMemo } from "react";


export function useHistoryList(
    visible: boolean,
    query: string,
    container?: HTMLElement | null,
) {
    const [items, setItems] = useState<chrome.history.HistoryItem[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [permissionGranted, setPermissionGranted] = useState(true);

    const filteredItems = useMemo(() => {
        const q = query.toLowerCase().trim();

        if (!q) {
            return items;
        }

        return items.filter((item) => {
            return (
                item.title?.toLowerCase().includes(q) ||
                item.url?.toLowerCase().includes(q)
            );
        });
    }, [items, query]);

    useEffect(() => {
        if (!visible) {
            setItems([]);
            setSelectedIndex(0);
            setPermissionGranted(true);

            return;
        }

        sendToBackground({ name: "get-history" }).then(
            (res) => {
                setItems(res.items);
                setPermissionGranted(res.granted);
            },
        );
    }, [visible]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    const selectNext = useCallback(() => {
        setSelectedIndex((i) => Math.min(i + 1, filteredItems.length - 1));
    }, [filteredItems.length]);

    const selectPrev = useCallback(() => {
        setSelectedIndex((i) => Math.max(i - 1, 0));
    }, []);

    const openItem = useCallback((url: string) => {
        sendToBackground({ name: "open-url", body: { url } });
    }, []);

    const requestPermission = useCallback(async () => {
        const res = await sendToBackground<{ granted: boolean }>({
            name: "request-history-permission",
        });

        if (res.granted) {
            setPermissionGranted(true);

            const data = await sendToBackground<HistoryData>({
                name: "get-history",
            });

            setItems(data.items);
        }

        return res.granted;
    }, []);

    return {
        items: filteredItems,
        selectedIndex,
        openItem,
        permissionGranted,
        requestPermission,
        selectNext,
        selectPrev,
    };
}

import type {
    WindowTabsData,
    TabData,
} from "~background/messages/get-window-tabs";

import { sendToBackground } from "@plasmohq/messaging";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useKeyDown } from "~hooks/useKeyDown";

export type DisplayItem =
    | { type: "header"; windowId: number; title: string }
    | { type: "tab"; tab: TabData };

export function useTabList(
    visible: boolean,
    query: string,
    container?: HTMLElement | null,
) {
    const [tabs, setTabs] = useState<TabData[]>([]);
    const [focusedWindowId, setFocusedWindowId] = useState<number | null>(null);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const filteredTabs = useMemo(() => {
        const q = query.toLowerCase().trim();

        if (!q) {
            return tabs;
        }

        return tabs.filter((tab) => {
            return (
                tab.title.toLowerCase().includes(q) ||
                tab.url.toLowerCase().includes(q)
            );
        });
    }, [tabs, query]);

    const displayItems = useMemo(() => {
        const seen = new Set<number>();
        const windowIds: number[] = [];

        for (const tab of filteredTabs) {
            if (!seen.has(tab.windowId)) {
                seen.add(tab.windowId);
                windowIds.push(tab.windowId);
            }
        }

        windowIds.sort((a, b) => {
            if (a === focusedWindowId) {
                return -1;
            }

            if (b === focusedWindowId) {
                return 1;
            }

            return a - b;
        });

        const items: DisplayItem[] = [];

        let windowCounter = 0;

        for (const wid of windowIds) {
            const winTabs = filteredTabs.filter((t) => t.windowId === wid);

            if (winTabs.length === 0) {
                continue;
            }

            windowCounter++;

            items.push({
                type: "header",
                windowId: wid,
                title:
                    wid === focusedWindowId
                        ? "Current Window"
                        : `Window ${windowCounter}`,
            });

            for (const tab of winTabs) {
                items.push({ type: "tab", tab });
            }
        }

        return items;
    }, [filteredTabs, focusedWindowId]);

    console.log(
        "[rofi] useTabList: allTabs",
        tabs.length,
        "filtered",
        filteredTabs.length,
        "displayItems",
        displayItems.length,
    );
    for (const item of displayItems) {
        if (item.type === "header") {
            console.log(
                "[rofi]   header:",
                item.title,
                "windowId:",
                item.windowId,
            );
        }
    }

    const selectableCount = useMemo(
        () => displayItems.filter((i) => i.type === "tab").length,
        [displayItems],
    );

    useEffect(() => {
        if (!visible) {
            setTabs([]);
            setFocusedWindowId(null);
            setSelectedIndex(0);

            return;
        }

        sendToBackground<object, WindowTabsData>({
            name: "get-window-tabs",
        }).then((res) => {
            console.log(
                "[rofi] received from background: tabs",
                res.tabs.length,
                "focused",
                res.focusedWindowId,
            );
            for (const t of res.tabs) {
                console.log(
                    "[rofi]   tab windowId:",
                    t.windowId,
                    "title:",
                    t.title.slice(0, 40),
                );
            }

            setTabs(res.tabs);
            setFocusedWindowId(res.focusedWindowId);
        });
    }, [visible]);

    useEffect(() => {
        const idx = displayItems.findIndex((i) => i.type === "tab");

        setSelectedIndex(idx >= 0 ? idx : 0);
    }, [displayItems]);

    const selectNext = useCallback(() => {
        setSelectedIndex((i) => {
            let next = i + 1;
            while (
                next < displayItems.length &&
                displayItems[next].type === "header"
            ) {
                next++;
            }

            return Math.min(next, displayItems.length - 1);
        });
    }, [displayItems]);

    const selectPrev = useCallback(() => {
        setSelectedIndex((i) => {
            let prev = i - 1;
            while (prev >= 0 && displayItems[prev].type === "header") {
                prev--;
            }

            return Math.max(prev, 0);
        });
    }, [displayItems]);

    const switchToTab = useCallback((tabId: number, windowId: number) => {
        sendToBackground({
            name: "switch-to-tab",
            body: { tabId, windowId },
        });
    }, []);

    useKeyDown((e) => {
        if (!visible || selectableCount === 0) {
            return;
        }

        if (e.key === "ArrowDown") {
            e.preventDefault();
            selectNext();
        }

        if (e.key === "ArrowUp") {
            e.preventDefault();
            selectPrev();
        }

        if (e.key === "Enter") {
            e.preventDefault();
            const item = displayItems[selectedIndex];
            if (item?.type === "tab" && item.tab.id && item.tab.windowId) {
                switchToTab(item.tab.id, item.tab.windowId);
            }
        }
    }, container);

    return { items: displayItems, selectedIndex, switchToTab };
}

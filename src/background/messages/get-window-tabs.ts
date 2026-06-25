import type { PlasmoMessaging } from "@plasmohq/messaging";

export type TabData = {
    id: number;
    title: string;
    url: string;
    favIconUrl: string;
    windowId: number;
    active: boolean;
};

export type WindowTabsData = {
    tabs: TabData[];
    focusedWindowId: number | null;
};

const handler: PlasmoMessaging.MessageHandler<
    object,
    WindowTabsData
> = async () => {
    const [tabs, focusedWindow] = await Promise.all([
        chrome.tabs.query({}).catch(() => [] as chrome.tabs.Tab[]),
        chrome.windows.getLastFocused().catch(() => null),
    ]);

    const tabData: TabData[] = tabs.map((t) => ({
        id: t.id ?? 0,
        title: t.title ?? "(no title)",
        url: t.url ?? "",
        favIconUrl: t.favIconUrl ?? "",
        windowId: t.windowId ?? 0,
        active: t.active ?? false,
    }));

    res.send({ tabs: tabData, focusedWindowId: focusedWindow?.id ?? null });
};

export default handler;

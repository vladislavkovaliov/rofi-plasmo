import type { PlasmoMessaging } from "@plasmohq/messaging";

export type HistoryData = {
    items: chrome.history.HistoryItem[];
    granted: boolean;
};

const handler: PlasmoMessaging.MessageHandler<object, HistoryData> = async (
    _req,
    res,
) => {
    const hasPermission = await chrome.permissions.contains({
        permissions: ["history"],
    });

    if (!hasPermission) {
        res.send({ items: [], granted: false });

        return;
    }

    const items = await chrome.history
        .search({ text: "", maxResults: 50, startTime: 0 })
        .catch(() => []);

    res.send({ items, granted: true });
};

export default handler;

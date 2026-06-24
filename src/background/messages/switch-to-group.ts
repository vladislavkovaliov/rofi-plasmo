import type { PlasmoMessaging } from "@plasmohq/messaging";

type Request = { groupId: number };

const handler: PlasmoMessaging.MessageHandler<Request> = async (req) => {
    const [tab] = await chrome.tabs.query({ groupId: req.body.groupId });
    if (tab?.id && tab?.windowId) {
        await Promise.all([
            chrome.tabs.update(tab.id, { active: true }),
            chrome.windows.update(tab.windowId, { focused: true }),
        ]);
    }
};

export default handler;

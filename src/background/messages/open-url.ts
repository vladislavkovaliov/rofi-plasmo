import type { PlasmoMessaging } from "@plasmohq/messaging";

type Request = { url: string };

const handler: PlasmoMessaging.MessageHandler<Request> = async (req) => {
    await chrome.tabs.create({ url: req.body!.url, active: true });
};

export default handler;

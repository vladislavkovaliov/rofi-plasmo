import type { PlasmoMessaging } from "@plasmohq/messaging";

const handler: PlasmoMessaging.MessageHandler<
    object,
    { granted: boolean }
> = async (_req, res) => {
    const granted = await chrome.permissions.request({
        permissions: ["history"],
    });

    res.send({ granted });
};

export default handler;

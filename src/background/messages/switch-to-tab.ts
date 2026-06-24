import type { PlasmoMessaging } from "@plasmohq/messaging"

type Request = { tabId: number; windowId: number }

const handler: PlasmoMessaging.MessageHandler<Request> = async (req, res) => {
  await Promise.all([
    chrome.tabs.update(req.body.tabId, { active: true }),
    chrome.windows.update(req.body.windowId, { focused: true })
  ])
}

export default handler

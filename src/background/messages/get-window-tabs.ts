import type { PlasmoMessaging } from "@plasmohq/messaging"

export type WindowTabsData = {
  tabs: chrome.tabs.Tab[]
}

const handler: PlasmoMessaging.MessageHandler<{}, WindowTabsData> = async (req, res) => {
  const tabs = await chrome.tabs
    .query({ currentWindow: true })
    .catch(() => [])
  res.send({ tabs })
}

export default handler

import type { PlasmoMessaging } from "@plasmohq/messaging"

export type HistoryData = {
  items: chrome.history.HistoryItem[]
}

const handler: PlasmoMessaging.MessageHandler<{}, HistoryData> = async (
  _req,
  res,
) => {
  const items = await chrome.history
    .search({ text: "", maxResults: 50, startTime: 0 })
    .catch(() => [])
  res.send({ items })
}

export default handler

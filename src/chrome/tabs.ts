export function getActiveTab(): Promise<chrome.tabs.Tab | undefined> {
    return chrome.tabs
        .query({ active: true, currentWindow: true })
        .then(([tab]) => tab);
}

export function sendMessageToActiveTab(
    msg: unknown,
): ReturnType<typeof chrome.tabs.sendMessage> {
    return getActiveTab().then((tab) => {
        if (tab?.id) {
            return chrome.tabs.sendMessage(tab.id, msg);
        }
    });
}

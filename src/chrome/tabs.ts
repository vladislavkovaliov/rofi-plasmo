export function getActiveTab(): Promise<chrome.tabs.Tab | undefined> {
    return chrome.tabs
        .query({ active: true, currentWindow: true })
        .then(([tab]) => tab);
}

export function sendMessageToActiveTab(msg: unknown): void {
    getActiveTab().then((tab) => {
        if (tab?.id) {
            chrome.tabs.sendMessage(tab.id, msg);
        }
    });
}

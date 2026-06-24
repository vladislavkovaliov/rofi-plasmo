const toggleRofi = async () => {
    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
    });
    if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, { type: "toggle-rofi" });
    }
};

chrome.commands.onCommand.addListener((command) => {
    if (command === "toggle-rofi") {
        toggleRofi();
    }
});

export {};

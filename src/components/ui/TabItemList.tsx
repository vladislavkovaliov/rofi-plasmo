import type { DisplayItem } from "~hooks/useTabList";

import { extractHostname } from "~utils/text";

import { ListItem } from "./ListItem";
import { WindowHeader } from "./WindowHeader";

interface TabItemListProps {
    items: DisplayItem[];
    tabIndex: number;
    onSwitchToTab: (tabId: number, windowId: number) => void;
}

export function TabItemList({
    items,
    tabIndex,
    onSwitchToTab,
}: TabItemListProps) {
    let itemCounter = 0;

    return (
        <>
            {items.map((item, i) => {
                if (item.type === "header") {
                    return (
                        <WindowHeader
                            key={`h-${item.windowId}`}
                            title={item.title}
                        />
                    );
                }

                const tab = item.tab;
                const idx = itemCounter++;

                return (
                    <ListItem
                        key={`t-${tab.id ?? i}`}
                        selected={idx === tabIndex}
                        onClick={() => {
                            if (tab.id && tab.windowId) {
                                onSwitchToTab(tab.id, tab.windowId);
                            }
                        }}
                        favicon={
                            tab.favIconUrl ? (
                                <img
                                    src={tab.favIconUrl}
                                    alt=""
                                    style={{ width: 16, height: 16 }}
                                />
                            ) : (
                                "🌐"
                            )
                        }
                        title={tab.title}
                        url={tab.url ? extractHostname(tab.url) : undefined}
                    />
                );
            })}
        </>
    );
}

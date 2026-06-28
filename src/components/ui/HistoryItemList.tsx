import { ListItem } from "./ListItem";
import { extractHostname } from "~utils/text";

interface HistoryItemListProps {
    items: chrome.history.HistoryItem[];
    historyIndex: number;
    onOpen: (url: string) => void;
}

export function HistoryItemList({
    items,
    historyIndex,
    onOpen,
}: HistoryItemListProps) {
    return (
        <>
            {items.map((item, i) => (
                <ListItem
                    key={item.url ?? i}
                    selected={i === historyIndex}
                    onClick={() => {
                        if (item.url) {
                            onOpen(item.url);
                        }
                    }}
                    favicon={<span>{"📜"}</span>}
                    title={item.title ?? ""}
                    url={item.url ? extractHostname(item.url) : undefined}
                />
            ))}
        </>
    );
}

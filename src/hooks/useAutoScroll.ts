import { useEffect, type RefObject } from "react";

export function useAutoScroll(
    selectedIndex: number,
    itemCount: number,
    listRef: RefObject<HTMLDivElement | null>,
): void {
    useEffect(() => {
        if (!listRef.current) {
            return;
        }

        const el = listRef.current.children[selectedIndex] as HTMLElement;

        el?.scrollIntoView({ block: "nearest" });
    }, [selectedIndex, itemCount, listRef]);
}

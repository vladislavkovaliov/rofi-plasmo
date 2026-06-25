import { useEffect, useRef } from "react";

export function useEscape(
    handler: () => void,
    element?: HTMLElement | Document | null,
): void {
    const savedHandler = useRef(handler);

    savedHandler.current = handler;

    useEffect(() => {
        const target = element === undefined ? document : element;

        if (!target) {
            return;
        }

        const listener = (e: Event) => {
            if ((e as KeyboardEvent).key === "Escape") {
                savedHandler.current();
            }
        };

        target.addEventListener("keydown", listener);

        return () => target.removeEventListener("keydown", listener);
    }, [element]);
}

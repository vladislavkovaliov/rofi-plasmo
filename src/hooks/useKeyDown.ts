import { useEffect, useRef } from "react";

export function useKeyDown(
    handler: (e: KeyboardEvent) => void,
    element?: HTMLElement | Document | null,
): void {
    const savedHandler = useRef(handler);

    savedHandler.current = handler;

    useEffect(() => {
        const target = element === undefined ? document : element;
        
        if (!target) {
            return;
        }

        const listener = (e: Event) => savedHandler.current(e as KeyboardEvent);

        target.addEventListener("keydown", listener);

        return () => target.removeEventListener("keydown", listener);
    }, [element]);
}

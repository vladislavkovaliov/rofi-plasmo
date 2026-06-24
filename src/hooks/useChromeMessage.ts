import { useEffect, useRef } from "react";

export function useChromeMessage<T>(handler: (msg: T) => void): void {
    const savedHandler = useRef(handler);

    savedHandler.current = handler;

    useEffect(() => {
        const listener = (msg: T) => savedHandler.current(msg);

        chrome.runtime.onMessage.addListener(listener);

        return () => chrome.runtime.onMessage.removeListener(listener);
    }, []);
}

import { useState, useEffect, useCallback, useMemo } from "react";
import { useKeyDown } from "~hooks/useKeyDown";
import { COMMANDS } from "~utils/commands";

export function useCommandsList(
    visible: boolean,
    query: string,
    container?: HTMLElement | null,
) {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const filteredCommands = useMemo(() => {
        if (!query.startsWith("/")) {
            return [];
        }

        const fragment = query.slice(1).trim();
        if (!fragment) {
            return COMMANDS;
        }

        const cmdPart = fragment.split(/\s+/)[0].toLowerCase();

        return COMMANDS.filter(
            (cmd) =>
                cmd.id.toLowerCase().includes(cmdPart) ||
                cmd.title.toLowerCase().includes(cmdPart),
        );
    }, [query]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    const selectNext = useCallback(() => {
        setSelectedIndex((i) => Math.min(i + 1, filteredCommands.length - 1));
    }, [filteredCommands.length]);

    const selectPrev = useCallback(() => {
        setSelectedIndex((i) => Math.max(i - 1, 0));
    }, []);

    useKeyDown((e) => {
        if (!visible || filteredCommands.length === 0) {
            return;
        }

        if (e.key === "ArrowDown") {
            e.preventDefault();
            selectNext();
        }

        if (e.key === "ArrowUp") {
            e.preventDefault();
            selectPrev();
        }
    }, container);

    return { commands: filteredCommands, selectedIndex };
}

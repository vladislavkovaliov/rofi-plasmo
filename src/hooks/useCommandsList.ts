import { useState, useEffect, useCallback, useMemo } from "react";
import { COMMANDS } from "~utils/commands";
import { getCommandFragment } from "~utils/query";

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

        const fragment = getCommandFragment(query);
        
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

    return { commands: filteredCommands, selectedIndex, selectNext, selectPrev };
}

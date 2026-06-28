import type { Command } from "~utils/commands";
import { ListItem } from "./ListItem";

interface CommandItemListProps {
    commands: Command[];
    commandsIndex: number;
    onSelect: (cmd: Command) => void;
}

export function CommandItemList({
    commands,
    commandsIndex,
    onSelect,
}: CommandItemListProps) {
    return (
        <>
            {commands.map((cmd, i) => (
                <ListItem
                    key={cmd.id}
                    selected={i === commandsIndex}
                    onClick={() => onSelect(cmd)}
                    favicon={<span>{cmd.icon}</span>}
                    title={cmd.title}
                    url={cmd.description}
                />
            ))}
        </>
    );
}

export function getCommandFragment(query: string): string {
    return query.slice(1).trim();
}

export function getCommandParam(query: string, commandId: string): string {
    const fragment = getCommandFragment(query);

    return fragment.slice(commandId.length).trim();
}

export function getCommandName(fragment: string): string {
    return fragment.split(/\s+/)[0].toLowerCase();
}

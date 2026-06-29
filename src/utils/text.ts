export function capitalize(str: string): string {
    if (!str) {
        return str;
    }

    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function extractHostname(url: string): string {
    try {
        return new URL(url).hostname;
    } catch {
        return url;
    }
}

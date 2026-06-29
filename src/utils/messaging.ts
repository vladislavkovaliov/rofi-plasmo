import { sendToBackground as plasmoSendToBackground } from "@plasmohq/messaging";

export function sendToBackground<T = any>(req: {
    name: string;
    body?: any;
}): Promise<T> {
    return plasmoSendToBackground(req as any);
}

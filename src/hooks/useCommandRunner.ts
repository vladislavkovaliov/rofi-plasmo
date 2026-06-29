import type { Command } from "~utils/commands";

import { useCallback, type RefObject } from "react";
import { getCommandAction, getCommandCompletion } from "~utils/executeCommand";
import { getCommandFragment } from "~utils/query";

interface CommandRunnerCallbacks {
    onOpenUrl: (url: string) => void;
    onShowThemes: () => void;
    onHide: () => void;
    onSetQuery: (value: string) => void;
    onFocusInput: () => void;
}

export function useCommandRunner(
    query: string,
    inputRef: RefObject<HTMLInputElement | null>,
    callbacks: CommandRunnerCallbacks,
): (cmd: Command) => void {
    return useCallback(
        (cmd: Command) => {
            const fragment = getCommandFragment(query);
            const completion = getCommandCompletion(fragment, cmd);

            if (completion) {
                callbacks.onSetQuery(completion);
                setTimeout(() => {
                    inputRef.current?.focus();
                }, 0);

                return;
            }

            const actions = getCommandAction(cmd, query);

            for (const action of actions) {
                switch (action.type) {
                    case "set-query":
                        callbacks.onSetQuery(action.value);

                        break;
                    case "focus-input":
                        setTimeout(() => {
                            inputRef.current?.focus();
                        }, 0);

                        break;
                    case "open-url":
                        callbacks.onOpenUrl(action.url);

                        break;
                    case "show-themes":
                        callbacks.onShowThemes();

                        break;
                    case "hide-overlay":
                        callbacks.onHide();

                        break;
                }
            }
        },
        [query, callbacks, inputRef],
    );
}

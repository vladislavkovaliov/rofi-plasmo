import { sendToBackground } from "~utils/messaging";
import { useState, useRef, useEffect } from "react";
import { ConditionBuilder } from "wi-condition-builder";
import { useTheme } from "~contexts/ThemeContext";
import { useAutoScroll } from "~hooks/useAutoScroll";
import { useCommandsList } from "~hooks/useCommandsList";
import { useHistoryList } from "~hooks/useHistoryList";
import { useModeSwitch } from "~hooks/useModeSwitch";
import { useOverlayMessages } from "~hooks/useOverlayMessages";
import { useShortcut } from "~hooks/useShortcut";
import { useCommandRunner } from "~hooks/useCommandRunner";
import { useRofiKeyboard } from "~hooks/useRofiKeyboard";
import { useTabList, type DisplayItem } from "~hooks/useTabList";
import { useThemeNavigation } from "~hooks/useThemeNavigation";
import { useVisibilityChange } from "~hooks/useVisibilityChange";
import type { Command } from "~utils/commands";
import { type Mode, MODE_ORDER, cycleMode } from "~utils/mode";
import {
    Overlay,
    OverlayWindow,
    SearchInput,
    ModeBar,
    PermissionScreen,
    ThemeItemList,
    CommandItemList,
    TabItemList,
    HistoryItemList,
} from "~components/ui";

const RofiOverlay = () => {
    const [visible, setVisible] = useState(false);
    const [query, setQuery] = useState("");
    const [mode, setMode] = useState<Mode>("tabs");
    const [container, setContainer] = useState<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const { shortcutRef } = useShortcut(setVisible);
    const { setTheme, themeName } = useTheme();
    const {
        showThemeList,
        setShowThemeList,
        themeListIndex,
        themeNames,
        selectNext: selectNextTheme,
        selectPrev: selectPrevTheme,
    } = useThemeNavigation(visible, mode, container);
    const { prevModeRef } = useModeSwitch(query, showThemeList, mode, setMode);

    const {
        items: tabItems,
        selectedIndex: tabIndex,
        switchToTab,
        selectNext: selectNextTab,
        selectPrev: selectPrevTab,
    } = useTabList(
        visible && mode === "tabs",
        query,
        visible ? container : null,
    );
    const {
        items: historyItems,
        selectedIndex: historyIndex,
        openItem,
        permissionGranted,
        requestPermission,
        selectNext: selectNextHistory,
        selectPrev: selectPrevHistory,
    } = useHistoryList(
        visible && mode === "history",
        query,
        visible ? container : null,
    );
    const {
        commands,
        selectedIndex: commandsIndex,
        selectNext: selectNextCmd,
        selectPrev: selectPrevCmd,
    } = useCommandsList(
        visible && mode === "commands" && !showThemeList,
        query,
        visible ? container : null,
    );

    const currentItems = new ConditionBuilder<
        DisplayItem[] | chrome.history.HistoryItem[] | Command[]
    >()
        .on(() => mode === "tabs", tabItems)
        .on(() => mode === "history", historyItems)
        .build(() => commands);

    const selectedIndex = new ConditionBuilder<number>()
        .on(() => mode === "tabs", tabIndex)
        .on(() => mode === "history", historyIndex)
        .build(() => commandsIndex);

    const dispatchCommand = useCommandRunner(query, inputRef, {
        onOpenUrl: (url) =>
            sendToBackground({ name: "open-url", body: { url } }),
        onShowThemes: () => setShowThemeList(true),
        onHide: () => setVisible(false),
        onSetQuery: setQuery,
        onFocusInput: () => setTimeout(() => inputRef.current?.focus(), 0),
    });

    useRofiKeyboard({
        visible,
        mode,
        container: visible ? container : null,
        showThemeList,
        onArrowUp: () => {
            if (mode === "tabs") {
                selectPrevTab();
            } else if (mode === "history") {
                selectPrevHistory();
            } else if (showThemeList) {
                selectPrevTheme();
            } else {
                selectPrevCmd();
            }
        },
        onArrowDown: () => {
            if (mode === "tabs") {
                selectNextTab();
            } else if (mode === "history") {
                selectNextHistory();
            } else if (showThemeList) {
                selectNextTheme();
            } else {
                selectNextCmd();
            }
        },
        onArrowLeft: () => {
            setMode(cycleMode(mode, -1, MODE_ORDER));
            setQuery("");
        },
        onArrowRight: () => {
            setMode(cycleMode(mode, 1, MODE_ORDER));
            setQuery("");
        },
        onEnter: () => {
            if (mode === "commands") {
                if (showThemeList) {
                    const selected = themeNames[themeListIndex];

                    if (selected) {
                        setTheme(selected);
                    }
                } else {
                    const cmd = commands[commandsIndex];

                    if (cmd) {
                        dispatchCommand(cmd);
                    }
                }
            }
        },
        onEscape: () => {
            if (showThemeList) {
                setShowThemeList(false);
                setMode(prevModeRef.current);
            } else {
                setVisible(false);
            }
        },
    });

    useEffect(() => {
        if (!query.startsWith("/")) {
            return;
        }

        const fragment = query.slice(1).trim().toLowerCase();

        if (fragment === "tabs" && mode !== "tabs") {
            setMode("tabs");
            setQuery("");
        } else if (
            (fragment === "hist" || fragment === "history") &&
            mode !== "history"
        ) {
            setMode("history");
            setQuery("");
        } else if (fragment === "commands") {
            if (mode !== "commands") {
                setMode("commands");
            }
            setQuery("/");
        }
    }, [query, mode]);

    useEffect(() => {
        if (visible) {
            setQuery("");
            setMode("tabs");
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [visible]);

    useAutoScroll(selectedIndex, currentItems.length, listRef);
    useOverlayMessages({
        toggleVisible: () => setVisible((v) => !v),
        shortcutRef,
        onThemeChanged: (theme) => setTheme(theme),
    });
    useVisibilityChange((hidden) => {
        if (hidden && visible) {
            setVisible(false);
        }
    });

    if (!visible) {
        return null;
    }

    return (
        <Overlay onClick={() => setVisible(false)}>
            <OverlayWindow ref={setContainer}>
                <SearchInput
                    ref={inputRef}
                    query={query}
                    onChange={setQuery}
                />
                <div ref={listRef} style={{ overflow: "auto", flex: 1 }}>
                    {mode === "history" && !permissionGranted && (
                        <PermissionScreen onRequest={requestPermission} />
                    )}
                    {mode === "commands" && showThemeList && (
                        <ThemeItemList
                            themeNames={themeNames}
                            themeListIndex={themeListIndex}
                            themeName={themeName}
                            onSelect={setTheme}
                        />
                    )}
                    {mode === "commands" && !showThemeList && (
                        <CommandItemList
                            commands={commands}
                            commandsIndex={commandsIndex}
                            onSelect={dispatchCommand}
                        />
                    )}
                    {mode === "tabs" && (
                        <TabItemList
                            items={tabItems}
                            tabIndex={tabIndex}
                            onSwitchToTab={switchToTab}
                        />
                    )}
                    {mode === "history" && permissionGranted && (
                        <HistoryItemList
                            items={historyItems}
                            historyIndex={historyIndex}
                            onOpen={openItem}
                        />
                    )}
                </div>
                <ModeBar
                    currentMode={mode}
                    onModeChange={(m) => {
                        setMode(m);
                        setQuery("");
                    }}
                />
            </OverlayWindow>
        </Overlay>
    );
};

export default RofiOverlay;

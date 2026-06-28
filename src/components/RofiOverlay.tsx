import { sendToBackground } from "@plasmohq/messaging";
import { useState, useRef, useEffect, useCallback } from "react";
import { ConditionBuilder } from "wi-condition-builder";
import { useTheme } from "~contexts/ThemeContext";
import { useAutoScroll } from "~hooks/useAutoScroll";
import { useCommandsList } from "~hooks/useCommandsList";
import { useEscape } from "~hooks/useEscape";
import { useHistoryList } from "~hooks/useHistoryList";
import { useKeyDown } from "~hooks/useKeyDown";
import { useModeSwitch } from "~hooks/useModeSwitch";
import { useOverlayMessages } from "~hooks/useOverlayMessages";
import { useShortcut } from "~hooks/useShortcut";
import { useTabList, type DisplayItem } from "~hooks/useTabList";
import { useThemeNavigation } from "~hooks/useThemeNavigation";
import { useVisibilityChange } from "~hooks/useVisibilityChange";
import { themes } from "~themes/registry";
import { Command } from "~utils/commands";
import { getCommandAction, getCommandCompletion } from "~utils/executeCommand";
import { type Mode, MODE_ORDER, cycleMode } from "~utils/mode";

const styles = {
    overlay: {
        position: "fixed" as const,
        inset: 0,
        zIndex: 2147483647,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--rofi-overlay)",
        backdropFilter: "var(--rofi-overlay-backdrop)",
        WebkitBackdropFilter: "var(--rofi-overlay-backdrop)",
    },
    window: {
        width: "var(--rofi-window-width)",
        maxHeight: "60vh",
        background: "var(--rofi-bg)",
        borderRadius: "var(--rofi-radius)",
        overflow: "hidden",
        fontFamily: "var(--rofi-font)",
        fontSize: "var(--rofi-font-size)",
        boxShadow: "var(--rofi-shadow)",
        display: "flex",
        flexDirection: "column" as const,
    },
    input: {
        width: "100%",
        padding: "14px 16px",
        border: "none",
        borderBottom: "1px solid var(--rofi-border)",
        background: "var(--rofi-bg-alt)",
        color: "var(--rofi-fg)",
        fontSize: "var(--rofi-font-size-lg)",
        outline: "none",
        boxSizing: "border-box" as const,
    },
    list: {
        overflow: "auto",
        flex: 1,
    },
    item: (selected: boolean) => ({
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 16px",
        cursor: "pointer",
        background: selected ? "var(--rofi-bg-selected)" : "transparent",
        color: "var(--rofi-fg)",
    }),
    favicon: {
        width: 16,
        height: 16,
        flexShrink: 0,
        textAlign: "center" as const,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    title: {
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap" as const,
        flex: 1,
    },
    url: {
        color: "var(--rofi-fg-muted)",
        fontSize: "var(--rofi-font-size-sm)",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap" as const,
        maxWidth: 250,
    },
    bar: {
        display: "flex",
        borderTop: "1px solid var(--rofi-border)",
    },
    windowHeader: {
        padding: "6px 16px",
        fontSize: 11,
        fontWeight: 600,
        color: "var(--rofi-fg-muted-alt)",
        textTransform: "uppercase" as const,
        letterSpacing: "0.5px",
        background: "var(--rofi-bg-alt)",
        borderBottom: "1px solid var(--rofi-border)",
    },
    barItem: (active: boolean) => ({
        flex: 1,
        textAlign: "center" as const,
        padding: "8px 0",
        fontSize: 12,
        color: active ? "var(--rofi-accent)" : "var(--rofi-fg-muted)",
        background: active ? "var(--rofi-bg-alt)" : "transparent",
        cursor: "pointer",
        userSelect: "none" as const,
    }),
};

const RofiOverlay = () => {
    const [visible, setVisible] = useState(false);
    const [query, setQuery] = useState("");
    const [mode, setMode] = useState<Mode>("tabs");
    const [container, setContainer] = useState<HTMLDivElement | null>(null);
    const { shortcutRef } = useShortcut(setVisible);
    const { setTheme, themeName } = useTheme();
    const { showThemeList, setShowThemeList, themeListIndex, themeNames } =
        useThemeNavigation(visible, mode, container);

    const { prevModeRef } = useModeSwitch(query, showThemeList, mode, setMode);

    const containerRef = useCallback((el: HTMLDivElement | null) => {
        setContainer(el);
    }, []);

    const {
        items: tabItems,
        selectedIndex: tabIndex,
        switchToTab,
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
    } = useHistoryList(
        visible && mode === "history",
        query,
        visible ? container : null,
    );
    const { commands, selectedIndex: commandsIndex } = useCommandsList(
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

    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

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

    // Режим переключения — на контейнере оверлея
    useKeyDown(
        (e) => {
            if (!visible) {
                return;
            }

            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                e.preventDefault();

                setMode(
                    cycleMode(mode, e.key === "ArrowLeft" ? -1 : 1, MODE_ORDER),
                );
                setQuery("");
            }
        },
        visible ? container : null,
    );

    const dispatchCommand = useCallback(
        (cmd: (typeof commands)[number]) => {
            const fragment = query.slice(1).trim();
            const completion = getCommandCompletion(fragment, cmd);

            if (completion) {
                setQuery(completion);
                setTimeout(() => {
                    inputRef.current?.focus();
                }, 0);

                return;
            }

            const actions = getCommandAction(cmd, query);

            for (const action of actions) {
                switch (action.type) {
                    case "set-query":
                        setQuery(action.value);

                        break;
                    case "focus-input":
                        setTimeout(() => {
                            inputRef.current?.focus();
                        }, 0);

                        break;
                    case "open-url":
                        sendToBackground({
                            name: "open-url",
                            body: { url: action.url },
                        });

                        break;
                    case "show-themes":
                        setShowThemeList(true);

                        break;
                    case "hide-overlay":
                        setVisible(false);

                        break;
                }
            }
        },
        [query],
    );

    // Enter handler for commands mode
    useKeyDown(
        (e) => {
            if (!visible || mode !== "commands") {
                return;
            }

            if (e.key === "Enter") {
                e.preventDefault();

                if (showThemeList) {
                    const selected = themeNames[themeListIndex];

                    if (selected) {
                        setTheme(selected);
                    }

                    return;
                }

                const cmd = commands[commandsIndex];

                if (!cmd) {
                    return;
                }

                dispatchCommand(cmd);
            }
        },
        visible ? container : null,
    );

    useEscape(
        () => {
            if (showThemeList) {
                setShowThemeList(false);
                setMode(prevModeRef.current);
            } else {
                setVisible(false);
            }
        },
        visible ? container : null,
    );

    useVisibilityChange((hidden) => {
        if (hidden && visible) {
            setVisible(false);
        }
    });

    if (!visible) {
        return null;
    }

    return (
        <div style={styles.overlay} onClick={() => setVisible(false)}>
            <div
                ref={containerRef}
                style={styles.window}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
            >
                <input
                    ref={inputRef}
                    style={styles.input}
                    placeholder="Type / for commands, or search..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <div ref={listRef} style={styles.list}>
                    {mode === "history" && !permissionGranted ? (
                        <div
                            style={{
                                padding: 32,
                                textAlign: "center" as const,
                                color: "#6c7086",
                            }}
                        >
                            <div style={{ marginBottom: 12 }}>
                                Grant history access in extension settings
                            </div>
                            <button
                                onClick={requestPermission}
                                style={{
                                    padding: "8px 24px",
                                    background: "#e65100",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: 6,
                                    cursor: "pointer",
                                    fontSize: 13,
                                }}
                            >
                                Grant access
                            </button>
                        </div>
                    ) : mode === "commands" && showThemeList ? (
                        themeNames.map((name, i) => (
                            <div
                                key={name}
                                style={styles.item(i === themeListIndex)}
                                onClick={() => setTheme(name)}
                            >
                                <span style={styles.favicon}>
                                    <span
                                        style={{
                                            width: 12,
                                            height: 12,
                                            borderRadius: "50%",
                                            background:
                                                themes[name].colors.accent,
                                            display: "inline-block",
                                        }}
                                    />
                                </span>
                                <span style={styles.title}>
                                    {name.charAt(0).toUpperCase() +
                                        name.slice(1)}
                                </span>
                                <span style={{ ...styles.url, maxWidth: 300 }}>
                                    {name === themeName
                                        ? "Active"
                                        : "Press Enter to apply"}
                                </span>
                            </div>
                        ))
                    ) : mode === "commands" ? (
                        commands.map((cmd, i) => (
                            <div
                                key={cmd.id}
                                style={styles.item(i === commandsIndex)}
                                onClick={() => dispatchCommand(cmd)}
                            >
                                <span style={styles.favicon}>{cmd.icon}</span>
                                <span style={styles.title}>{cmd.title}</span>
                                <span style={{ ...styles.url, maxWidth: 300 }}>
                                    {cmd.description}
                                </span>
                            </div>
                        ))
                    ) : mode === "tabs" ? (
                        tabItems.map((item, i) => {
                            if (item.type === "header") {
                                return (
                                    <div
                                        key={`h-${item.windowId}`}
                                        style={styles.windowHeader}
                                    >
                                        {item.title}
                                    </div>
                                );
                            }

                            const tab = item.tab;

                            return (
                                <div
                                    key={`t-${tab.id ?? i}`}
                                    style={styles.item(i === tabIndex)}
                                    onClick={() => {
                                        if (tab.id && tab.windowId) {
                                            switchToTab(tab.id, tab.windowId);
                                        }
                                    }}
                                >
                                    <span style={styles.favicon}>
                                        {(tab.favIconUrl && (
                                            <img
                                                src={tab.favIconUrl}
                                                alt=""
                                                style={{
                                                    width: 16,
                                                    height: 16,
                                                }}
                                            />
                                        )) ||
                                            "🌐"}
                                    </span>
                                    <span style={styles.title}>
                                        {tab.title}
                                    </span>
                                    {tab.url && (
                                        <span style={styles.url}>
                                            {new URL(tab.url).hostname}
                                        </span>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        historyItems.map((item, i) => (
                            <div
                                key={item.url ?? i}
                                style={styles.item(i === historyIndex)}
                                onClick={() => {
                                    if (item.url) {
                                        openItem(item.url);
                                    }
                                }}
                            >
                                <span style={styles.favicon}>{"📜"}</span>
                                <span style={styles.title}>{item.title}</span>
                                {item.url && (
                                    <span style={styles.url}>
                                        {new URL(item.url).hostname}
                                    </span>
                                )}
                            </div>
                        ))
                    )}
                </div>
                <div style={styles.bar}>
                    {MODE_ORDER.map((m) => (
                        <div
                            key={m}
                            style={styles.barItem(mode === m)}
                            onClick={() => {
                                setMode(m);
                                setQuery("");
                            }}
                        >
                            {m.charAt(0).toUpperCase() + m.slice(1)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RofiOverlay;

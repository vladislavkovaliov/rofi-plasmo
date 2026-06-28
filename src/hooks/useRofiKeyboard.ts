import { useKeyDown } from "~hooks/useKeyDown";
import { KEYS } from "~utils/keyboard";
import { type Mode } from "~utils/mode";

interface RofiKeyboardDeps {
    visible: boolean;
    mode: Mode;
    container: HTMLElement | null;
    showThemeList: boolean;
    onArrowUp: () => void;
    onArrowDown: () => void;
    onArrowLeft: () => void;
    onArrowRight: () => void;
    onEnter: () => void;
    onEscape: () => void;
}

export function useRofiKeyboard({
    visible,
    mode,
    container,
    showThemeList,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onEnter,
    onEscape,
}: RofiKeyboardDeps): void {
    useKeyDown(
        (e) => {
            if (!visible) {
                return;
            }

            if (e.key === KEYS.ARROW_UP) {
                e.preventDefault();
                onArrowUp();
            } else if (e.key === KEYS.ARROW_DOWN) {
                e.preventDefault();
                onArrowDown();
            } else if (e.key === KEYS.ARROW_LEFT) {
                e.preventDefault();
                onArrowLeft();
            } else if (e.key === KEYS.ARROW_RIGHT) {
                e.preventDefault();
                onArrowRight();
            } else if (e.key === KEYS.ENTER) {
                e.preventDefault();
                onEnter();
            } else if (e.key === KEYS.ESCAPE) {
                e.preventDefault();
                onEscape();
            }
        },
        visible ? container : null,
    );
}

import type { PlasmoGetStyle } from "plasmo";

import cssText from "data-text:./style.css";

export const config = {
    matches: ["<all_urls>"],
};

export const getStyle: PlasmoGetStyle = () => {
    const style = document.createElement("style");

    style.textContent = cssText;

    return style;
};

import RofiOverlay from "~components/RofiOverlay";

const Content = () => {
    return <RofiOverlay />;
};

export default Content;

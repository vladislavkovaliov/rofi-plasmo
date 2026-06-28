import type { Theme } from "./types";

import { defaultTheme } from "./default";
import { glassTheme } from "./glass";
import { pinkTheme } from "./pink";

export const themes: Record<string, Theme> = {
    default: defaultTheme,
    pink: pinkTheme,
    glass: glassTheme,
};

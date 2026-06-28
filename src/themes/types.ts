export interface ThemeColors {
    bg: string;
    bgAlt: string;
    bgSelected: string;
    fg: string;
    fgMuted: string;
    fgMutedAlt: string;
    accent: string;
    accentHover: string;
    overlay: string;
    border: string;
}

export interface ThemeTypography {
    fontFamily: string;
    fontSize: string;
    fontSizeSm: string;
    fontSizeLg: string;
}

export interface ThemeLayout {
    borderRadius: string;
    windowWidth: string;
    spacing: string;
}

export interface Theme {
    name: string;
    colors: ThemeColors;
    typography: ThemeTypography;
    layout: ThemeLayout;
    shadow: string;
    overlayBackdrop: string;
}

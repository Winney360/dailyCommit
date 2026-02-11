import { Platform } from "react-native";

export const Colors = {
  text: "#E9E2F5",
  textSecondary: "#A59CB0",
  buttonText: "#E9E2F5",
  tabIconDefault: "#A59CB0",
  tabIconSelected: "#7C3AED",
  link: "#7C3AED",
  primary: "#7C3AED",
  secondary: "#1A142C",
  accent: "#9F7AEA",
  success: "#34D399",
  warning: "#F59E0B",
  error: "#EF4444",
  backgroundRoot: "#0A071B",
  backgroundDefault: "#1A142C",
  backgroundSecondary: "#241C35",
  backgroundTertiary: "#2D2440",
  border: "#2D2440",
  borderSubtle: "#1F1830",
  cardShadow: "rgba(124, 58, 237, 0.08)",
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  "6xl": 64,
  inputHeight: 48,
  buttonHeight: 52,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700",
  },
  h2: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700",
  },
  h3: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "600",
  },
  h4: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600",
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400",
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400",
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400",
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400",
  },
};

export const Shadows = {
  card: Platform.select({
    web: {
      boxShadow: '0 2px 8px rgba(124, 58, 237, 0.12), 0 0 0 1px rgba(159, 122, 234, 0.08)',
    },
    default: {
      shadowColor: "#7C3AED",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 3,
    },
  }),
  cardLarge: Platform.select({
    web: {
      boxShadow: '0 4px 12px rgba(124, 58, 237, 0.18), 0 0 0 1px rgba(159, 122, 234, 0.12)',
    },
    default: {
      shadowColor: "#7C3AED",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 6,
    },
  }),
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
import { Platform, TextStyle } from "react-native";

/**
 * Haute De Hallen - Typography System
 * Pairs epicurean serif for headlines with clear geometric sans-serif for body
 */
export const FontFamilies = {
  serif: Platform.select({
    ios: "Georgia",
    android: "serif",
    default: "serif",
  }),
  sans: Platform.select({
    ios: "System",
    android: "sans-serif",
    default: "sans-serif",
  }),
};

export const Typography: Record<string, TextStyle> = {
  // Headlines (Newsreader / Serif)
  headlineXl: {
    fontFamily: FontFamilies.serif,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "600",
  },
  headlineLg: {
    fontFamily: FontFamilies.serif,
    fontSize: 26,
    lineHeight: 34,
    fontWeight: "600",
  },
  headlineMd: {
    fontFamily: FontFamilies.serif,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "600",
  },
  headlineSm: {
    fontFamily: FontFamilies.serif,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "600",
  },

  // Body text (Plus Jakarta Sans / Sans-serif)
  bodyLg: {
    fontFamily: FontFamilies.sans,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400",
  },
  bodyMd: {
    fontFamily: FontFamilies.sans,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400",
  },
  bodySm: {
    fontFamily: FontFamilies.sans,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "400",
  },

  // Labels & Chips
  labelLg: {
    fontFamily: FontFamilies.sans,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  labelMd: {
    fontFamily: FontFamilies.sans,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  labelSm: {
    fontFamily: FontFamilies.sans,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
};

export default Typography;

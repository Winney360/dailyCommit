import { useWindowDimensions } from "react-native";

export const BREAKPOINTS = {
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
};

/**
 * Returns screen dimensions, breakpoint flags, and helpers for
 * building responsive layouts across mobile, tablet and desktop/web.
 */
export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const isSmall = width < BREAKPOINTS.sm;
  const isMedium = width >= BREAKPOINTS.sm && width < BREAKPOINTS.md;
  const isLarge = width >= BREAKPOINTS.md && width < BREAKPOINTS.lg;
  const isXLarge = width >= BREAKPOINTS.lg;

  const isTablet = width >= BREAKPOINTS.md;
  const isDesktop = width >= BREAKPOINTS.lg;

  // Maximum content width — undefined on mobile (fills the screen)
  const contentMaxWidth = isDesktop ? 900 : isTablet ? 720 : undefined;

  // Number of columns for grid layouts
  const gridColumns = isDesktop ? 4 : isTablet ? 3 : 2;

  return {
    width,
    height,
    isSmall,
    isMedium,
    isLarge,
    isXLarge,
    isTablet,
    isDesktop,
    contentMaxWidth,
    gridColumns,
  };
}

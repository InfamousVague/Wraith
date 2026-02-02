import { useWindowDimensions } from "react-native";
import { useMemo } from "react";

export const BREAKPOINTS = {
  phone: 480,
  tablet: 768,
  desktop: 1024,
  wide: 1280,
} as const;

export type Breakpoint = "phone" | "tablet" | "desktop" | "wide";

export function useBreakpoint() {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const breakpoint: Breakpoint =
      width <= BREAKPOINTS.phone ? "phone" :
      width <= BREAKPOINTS.tablet ? "tablet" :
      width <= BREAKPOINTS.desktop ? "desktop" : "wide";

    return {
      breakpoint,
      width,
      height,
      isMobile: breakpoint === "phone",
      isTablet: breakpoint === "tablet",
      isDesktop: breakpoint === "desktop" || breakpoint === "wide",
      isNarrow: breakpoint === "phone" || breakpoint === "tablet",
    };
  }, [width, height]);
}

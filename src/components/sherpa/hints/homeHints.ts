/**
 * Home Page Hints
 *
 * Hint definitions for the Dashboard/Home page.
 */

import type { SherpaHint, SherpaHintGroup } from "../types";

export const HOME_HINTS_ID = "home-hints";

export const homeHints: SherpaHint[] = [
  {
    id: "home-fear-greed",
    title: "Market Sentiment",
    content:
      "The Fear & Greed Index shows current market sentiment. Values below 25 indicate extreme fear (potential buying opportunity), while values above 75 suggest extreme greed (potential correction ahead).",
    target: '[data-sherpa="fear-greed-card"]',
    indicatorStyle: "hotspot",
    hotspotIcon: "i",
    color: "#A78BFA",
    category: "home",
  },
  {
    id: "home-view-controls",
    title: "View Controls",
    content:
      "Switch between list and chart views, sort by different metrics, and filter assets. Your preferences are saved automatically.",
    target: '[data-sherpa="view-controls"]',
    indicatorStyle: "hotspot",
    hotspotIcon: "?",
    color: "#3B82F6",
    category: "home",
  },
  {
    id: "home-search",
    title: "Quick Search",
    content:
      "Find any asset instantly by typing its name or symbol.",
    target: '[data-sherpa="asset-search"]',
    indicatorStyle: "hotspot",
    hotspotIcon: "!",
    color: "#22C55E",
    category: "home",
  },
];

export const homeHintGroup: SherpaHintGroup = {
  id: HOME_HINTS_ID,
  name: "Home Page",
  hints: homeHints,
};

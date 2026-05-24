import { addons } from "@storybook/manager-api";
import { create } from "@storybook/theming/create";

// Custom Storybook theme for the published michi-vz docs site, so the
// GitHub Pages build reads as the library's own page rather than stock
// Storybook. Accent colour matches the Introduction landing page.
const michiVzTheme = create({
  base: "light",

  brandTitle: "michi-vz — React + D3 charts",
  brandUrl: "https://github.com/beany-vu/michi-vz",
  brandTarget: "_blank",

  colorPrimary: "#4f46e5",
  colorSecondary: "#4f46e5",

  appBg: "#f7f7fb",
  appContentBg: "#ffffff",
  appPreviewBg: "#ffffff",
  appBorderColor: "#e6e6ef",
  appBorderRadius: 8,

  barSelectedColor: "#4f46e5",
  barHoverColor: "#4f46e5",
  barBg: "#ffffff",

  inputBorderRadius: 6,
});

addons.setConfig({ theme: michiVzTheme });

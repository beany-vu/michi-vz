// Storybook 10: manager-api + theming live under the top-level `storybook`
// package now, not the `@storybook/*` scope.
import { addons } from "storybook/manager-api";
import { create } from "storybook/theming/create";

// Swiss-style theme — warm red, true Helvetica, near-black ink, tight white
// surfaces. The accent (#C84B3F) is the modernist-Swiss-poster red used by
// Calder/Hofmann-era graphic design — warmer than flag red, more design,
// less alarm. Font stack puts Helvetica Neue first so users with the system
// face get the real thing; Arimo / Liberation Sans cover Linux machines that
// ship metric-compatible substitutes; Arial is the last-resort fallback.
const HELVETICA_STACK =
  '"Helvetica Neue", Helvetica, "Arimo", "Liberation Sans", Arial, sans-serif';

const michiVzTheme = create({
  base: "light",

  brandTitle: "michi-vz",
  brandImage: "./michi-logo-small.png",
  brandUrl: "https://github.com/beany-vu/michi-vz",
  brandTarget: "_blank",

  // Accents.
  colorPrimary: "#C84B3F",
  colorSecondary: "#C84B3F",

  // Surfaces — pure white content over a near-white shell.
  appBg: "#FAFAFA",
  appContentBg: "#FFFFFF",
  appPreviewBg: "#FFFFFF",
  appBorderColor: "#E5E5E5",
  appBorderRadius: 0,

  // Text — high-contrast charcoal hierarchy.
  textColor: "#0A0A0A",
  textInverseColor: "#FFFFFF",
  textMutedColor: "#525252",

  // Toolbar and topbar.
  barTextColor: "#525252",
  barSelectedColor: "#C84B3F",
  barHoverColor: "#C84B3F",
  barBg: "#FFFFFF",

  // Inputs.
  inputBg: "#FFFFFF",
  inputBorder: "#E5E5E5",
  inputTextColor: "#0A0A0A",
  inputBorderRadius: 2,

  // Typography — real Helvetica.
  fontBase: HELVETICA_STACK,
  fontCode:
    '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
});

addons.setConfig({
  theme: michiVzTheme,
  // Hide the native sidebar entirely — we provide our own nav via MichiTopnav
  // and the ChartRail sidebar. Without showNav: false, Storybook's JS still
  // allocates ~265px of left offset even when the sidebar is CSS-hidden.
  showNav: false,
  // Collapse the addon panel so first-time visitors aren't greeted by
  // fn() callback logs.
  showPanel: false,
  panelPosition: "bottom",
  // Full-width layout so the preview pane uses all available horizontal space.
  isFullscreen: false,
});

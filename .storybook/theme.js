import { create } from "storybook/theming/create";

const HELVETICA_STACK =
  '"Helvetica Neue", Helvetica, "Arimo", "Liberation Sans", Arial, sans-serif';

export const michiVzTheme = create({
  base: "light",

  brandTitle: "michi-vz",
  brandImage: "./michi-logo-small.png",
  brandUrl: "https://github.com/beany-vu/michi-vz",
  brandTarget: "_blank",

  colorPrimary: "#C84B3F",
  colorSecondary: "#C84B3F",

  appBg: "#FAFAFA",
  appContentBg: "#FFFFFF",
  appPreviewBg: "#FFFFFF",
  appBorderColor: "#E5E5E5",
  appBorderRadius: 2,

  textColor: "#0A0A0A",
  textInverseColor: "#FFFFFF",
  textMutedColor: "#525252",

  barTextColor: "#525252",
  barSelectedColor: "#C84B3F",
  barHoverColor: "#C84B3F",
  barBg: "#FFFFFF",

  inputBg: "#FFFFFF",
  inputBorder: "#E5E5E5",
  inputTextColor: "#0A0A0A",
  inputBorderRadius: 2,

  fontBase: HELVETICA_STACK,
  fontCode:
    '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
});

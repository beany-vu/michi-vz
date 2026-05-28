import { addons } from "storybook/manager-api";
import { michiVzTheme } from "./theme.js";

addons.setConfig({
  theme: michiVzTheme,
  showPanel: false,
  panelPosition: "bottom",
  isFullscreen: false,
});

/** @type { import('@storybook/react').Preview } */
const preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    options: {
      // Landing page first, then the chart catalog, then examples.
      storySort: {
        order: ["Introduction", "Charts", "Examples", "*"],
      },
    },
  },
};

export default preview;

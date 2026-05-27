const path = require("path");

/** @type { import('storybook').StorybookConfig } */
const config = {
  stories: [
    "../stories/**/*.mdx",
    "../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)",
  ],
  // Storybook 10: addon-essentials, addon-interactions, addon-mdx-gfm all
  // collapsed into the core / addon-docs. We register only the addons that
  // still exist as standalone packages.
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-webpack5-compiler-babel",
    "@storybook/addon-docs",
  ],
  framework: {
    name: "@storybook/react-webpack5",
    options: {
      reactOptions: {
        fastRefresh: true,
      },
    },
  },
  docs: {
    autodocs: "tag",
  },
  // Serve .storybook/public/ at the site root so the brand logo + any other
  // static assets are referenceable as `/michi-logo.png`.
  staticDirs: ["./public"],
  // Storybook 10 surfaces these as top-level features instead of addon-
  // essentials options. Disable on the public docs site to hide dev-only
  // chrome (backgrounds picker, measure overlay, outline overlay, highlight).
  features: {
    backgrounds: false,
    measure: false,
    outline: false,
    highlight: false,
  },
  webpackFinal: async (config) => {
    config.module.rules.push({
      test: /\.(ts|tsx)$/,
      use: [
        {
          loader: require.resolve("babel-loader"),
          options: {
            presets: [
              "@babel/preset-env",
              "@babel/preset-react",
              "@babel/preset-typescript",
            ],
          },
        },
      ],
    });
    config.resolve.alias = {
      ...config.resolve.alias,
      src: path.resolve(__dirname, "../src"),
    };
    config.resolve.extensions.push(".ts", ".tsx");
    return config;
  },
};

module.exports = config;

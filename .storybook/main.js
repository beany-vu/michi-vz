const path = require('path');

/** @type { import('storybook').StorybookConfig } */
const config = {
  stories: [
    "../stories/**/*.mdx",
    "../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)",
  ],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-onboarding",
    "@storybook/addon-interactions",
    '@storybook/addon-mdx-gfm',
    '@storybook/addon-webpack5-compiler-babel'
  ],
  framework: {
    name: "@storybook/react-webpack5",
    options: {
      reactOptions: {
        fastRefresh: true, // Enable React Fast Refresh
      },
    },
  },
  docs: {
    autodocs: "tag",
  },
  webpackFinal: async (config) => {
    // Add TypeScript and Babel support
    config.module.rules.push({
      test: /\.(ts|tsx)$/,
      use: [
        {
          loader: require.resolve('babel-loader'),
          options: {
            presets: [
              '@babel/preset-env',
              '@babel/preset-react',
              '@babel/preset-typescript',
            ],
          },
        },
      ],
    });

    // Add the 'src' alias
    config.resolve.alias = {
      ...config.resolve.alias,
      src: path.resolve(__dirname, '../src'),
    };

    // Update extensions
    config.resolve.extensions.push('.ts', '.tsx');

    return config;
  },
};
module.exports = config;

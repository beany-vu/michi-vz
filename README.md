# Overview

- `react`/`typescript`
- `storybook` for component development
- `eslint` and `prettier` to harmonize the code base
- `styled-components` for styling
- `d3` for data visualization

# Project structure

    - `/src`: all source files go here
        - `/components`: individual components shared across the project
    - `/node_modules`: handled by npm, don't touch this
    - `stories`: contains stories for storybook

# Console commands

    - `npm run storybook`: start dev server
    - `npm publish`: publish the package to npm, we need to update the package.json version before publishing

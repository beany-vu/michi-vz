# Overview

- `react`/`typescript`
- `storybook` for component development
- `eslint` and `prettier` to harmonize the code base
- `styled-components` for styling
- `d3` for data visualization

# Project structure

    - `/src`: all source files go here
        - `/components`: individual components shared across the project
        - `/components/__tests__`: test files for components
    - `/node_modules`: handled by npm, don't touch this
    - `stories`: contains stories for storybook

# Configure your project

1. **Install dependencies**:
   ```
   npm install
   ```

2. **Configure TypeScript**:
   - The `tsconfig.json` file is already set up to handle both source code and Storybook stories
   - Make sure your stories match the component interfaces to avoid type errors

3. **Setup Storybook**:
   - Storybook is configured to run on port 6006
   - Component stories should be placed in the `stories/` directory
   - Use the MichiVzProvider to provide theme and color settings for your components

4. **Linting and Formatting**:
   - Run `npm run lint` to check for linting errors
   - Run `npm run lint:fix` to automatically fix linting issues

# Testing

1. **Running Tests**:
   ```
   npm run test          # Run all tests
   npm run test:watch    # Run tests in watch mode
   npm run test -- -u    # Update snapshots
   ```

2. **Test Structure**:
   - Tests are located in `src/components/__tests__/`
   - Each component should have a corresponding `ComponentName.test.tsx` file
   - Utility functions and mocks are in `test-utils.tsx`
   - Global mocks for React 19 are in `setupTests.js`

3. **React 19 Compatibility**:
   - Tests are set up to handle React 19's concurrent rendering features
   - We use longer timeouts for async operations due to React 19's rendering behavior
   - Some React 19 APIs are mocked in the test environment for stability
   - Make sure to use the latest `@testing-library/react` (v15+) for compatibility

4. **Writing Tests**:
   - Use the `customRender` function from test-utils to render components with the MichiVzProvider
   - SVG methods used by D3 are automatically mocked
   - Sample data is provided for common chart types
   - Use `waitFor` with increased timeouts for React 19 asynchronous rendering

5. **Code Coverage**:
   ```
   npm run test -- --coverage
   ```
   - This will generate a coverage report in the `/coverage` directory

# Console commands

    - `npm run storybook`: start dev server
    - `npm run test`: run tests
    - `npm publish`: publish the package to npm, we need to update the package.json version before publishing

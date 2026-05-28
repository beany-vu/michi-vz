import React from "react";
import { DocsContainer } from "@storybook/addon-docs/blocks";
import { michiVzTheme } from "./theme.js";

// Global chart typography + layout polish — applied to every story without
// touching individual chart code. Keeps SVG text legible at small sizes, lifts
// titles into a bolder hierarchy, and gives the preview pane a calm light-gray
// shell so every story reads like a magazine spread rather than the default
// dev-mode white void.
const globalChartCss = `
  /* Brand palette — single source of truth. Anything below references these
     via var(--mv-*); the same names are mirrored in Configure.mdx and the
     CrossChartHighlighting story so all surfaces stay in lockstep. */
  :root {
    --mv-accent: #C84B3F;
    --mv-accent-dark: #A33A30;
    --mv-accent-ink: #6E2A22;
    --mv-accent-soft: #FBEDEB;
    --mv-ink: #0A0A0A;
    --mv-ink-2: #525252;
    --mv-ink-3: #9A9A9A;
    --mv-line: #E5E5E5;
    --mv-line-soft: #F0F0F0;
    --mv-surface: #FFFFFF;
    --mv-shell: #FAFAFA;
    --mv-font: "Helvetica Neue", Helvetica, "Arimo", "Liberation Sans",
               Arial, sans-serif;
    --mv-font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo,
                    Monaco, Consolas, monospace;
  }

  /* Story preview surround: light shell + centred content. */
  body.sb-show-main {
    background: var(--mv-shell) !important;
    font-family: var(--mv-font);
  }
  .sb-show-main .sb-main-padded { padding: 32px 28px; }
  /* Centre the story content in the preview pane WITHOUT turning the story
     root into a flex container — that breaks multi-element stories like
     CrossChartHighlighting whose top-level siblings (hint pill + dashboard)
     would otherwise lay out side-by-side. We use max-width + auto margins on
     direct children instead. */
  #storybook-root, .docs-story { width: 100%; }
  #storybook-root > *, .docs-story > * { margin-left: auto; margin-right: auto; }

  /* SVG chart typography defaults — apply to every chart's text elements
     produced by our D3 code, but only when the consumer hasn't set inline
     styles. Lifts default weight/colour without overriding any per-chart
     customisations. */
  #storybook-root svg text,
  .docs-story svg text {
    font-family: var(--mv-font) !important;
    fill: var(--mv-ink);
  }

  /* Axis ticks: smaller, muted. */
  #storybook-root svg .tick text,
  #storybook-root svg .x-axis text,
  #storybook-root svg .y-axis text,
  .docs-story svg .tick text {
    font-size: 11px;
    fill: var(--mv-ink-2);
  }

  /* Chart titles when rendered via SVG <text class="title"> or h2 inside the
     chart's surrounding wrapper: bolder, larger. */
  #storybook-root svg .title,
  #storybook-root svg text.title,
  .docs-story svg .title {
    font-size: 14px;
    font-weight: 700;
    fill: var(--mv-ink);
    letter-spacing: -0.01em;
  }

  /* Pole / radar axis labels: distinct from tick text. */
  #storybook-root svg .pole-label,
  .docs-story svg .pole-label {
    font-size: 12px;
    font-weight: 600;
    fill: var(--mv-ink);
  }
  #storybook-root svg .radial-label,
  .docs-story svg .radial-label {
    font-size: 10px;
    fill: var(--mv-ink-3);
  }

  /* Legend (where charts emit a styled HTML legend). */
  #storybook-root .legend,
  .docs-story .legend {
    font-family: var(--mv-font);
    font-size: 12px;
    color: var(--mv-ink);
  }

  /* ComparableHorizontalBarChart: when both bars use the same country color,
     opacity alone can't distinguish the overlap region (same_color * x +
     same_color * (1-x) = same_color). multiply blend darkens the overlap so
     it's always visually distinct from either bar alone. */
  #storybook-root svg .value-based,
  .docs-story svg .value-based {
    opacity: 1;
  }
  #storybook-root svg .value-compared,
  .docs-story svg .value-compared {
    mix-blend-mode: multiply;
    opacity: 1;
  }

  /* Card wrapper around every story preview — each demo block reads as a
     contained example with its own surface, the way real docs sites layout
     code samples. Story content is rendered inside .mv-story-card via the
     decorator below. */
  .mv-story-card {
    background: var(--mv-surface);
    border: 1px solid var(--mv-line);
    border-radius: 6px;
    padding: 28px 28px 22px;
    margin: 8px 0 12px;
    box-shadow: 0 1px 2px rgba(10, 10, 10, 0.03);
    overflow-x: auto;
  }
  /* In docs view (autodocs), Storybook already wraps each story in its own
     surface (.docs-story). Skip the extra card there so we don't double-frame. */
  .sbdocs .mv-story-card {
    background: transparent;
    border: 0;
    box-shadow: none;
    padding: 0;
    margin: 0;
  }
`;

function MichiTopnav() {
  return (
    <nav className="mv-topnav" aria-label="Site navigation">
      <div className="mv-topnav-inner">
        <a className="mv-topnav-brand" href="./?path=/docs/introduction--docs">
          <img src="./michi-logo-small.png" alt="michi-vz" className="mv-topnav-logo" />
          <span className="mv-topnav-star" aria-hidden="true">✦</span>
        </a>
        <div className="mv-topnav-links">
          <a href="./?path=/docs/charts-line-chart--docs">Charts</a>
          <a href="./?path=/story/examples-cross-chart-highlighting--two-charts-one-state">Examples</a>
          <a href="https://github.com/beany-vu/michi-vz" target="_blank" rel="noreferrer">GitHub</a>
          <a href="https://www.npmjs.com/package/michi-vz" target="_blank" rel="noreferrer">npm</a>
        </div>
      </div>
    </nav>
  );
}

function MichiDocsContainer({ children, context, ...props }) {
  const storyId =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("id") || ""
      : "";
  const isIntroPage = storyId.startsWith("introduction");
  const pageType = isIntroPage ? "intro" : "other";

  return (
    <div data-page-type={pageType}>
      <MichiTopnav />
      <DocsContainer context={context} {...props}>
        {children}
      </DocsContainer>
    </div>
  );
}

const CenteringDecorator = (Story, context) => (
  <>
    <style>{globalChartCss}</style>
    {/* Topnav only in standalone story view — docs pages get it from MichiDocsContainer */}
    {context?.viewMode === "story" && <MichiTopnav />}
    <div className="mv-story-card">
      <Story />
    </div>
  </>
);

/** @type { import('@storybook/react').Preview } */
const preview = {
  decorators: [CenteringDecorator],
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    layout: "centered",
    docs: {
      container: MichiDocsContainer,
      theme: michiVzTheme,
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

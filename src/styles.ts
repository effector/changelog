import {DOMProperty, AttributeStore} from 'forest'

export const styles = {
  topFiller() {
    css`
      position: fixed;
      width: 100%;
      line-height: var(--viewportPaddingTop);
      top: 0;
      background: var(--white-3);
      z-index: 5;
      color: var(--white-3);
    `
  },
  anchor() {
    css`
      display: block;
      position: relative;
      top: var(--top, 0);

      &[data-anchor='group'] {
        --top: var(--md-6);
      }
      &[data-anchor='release'] {
        --top: calc(var(--md-5) * -1);
      }

      &[data-anchor='group']:first-of-type {
        --top: var(--md-2);
      }
      @media only screen and (max-width: 768px) {
        &[data-anchor='group'] {
          --top: var(--md-2);
        }
        &[data-anchor='group']:first-of-type {
          --top: calc(var(--md-2) * -1);
        }
        &[data-anchor='release'] {
          --top: calc(var(--md-9) * -1);
        }
      }
      @media only screen and (min-width: 769px) and (max-width: 980px) {
        &[data-anchor='group']:first-of-type {
          --top: var(--md-2);
        }
        &[data-anchor='release'] {
          --top: calc(var(--md-5) * -1);
        }
      }
    `
  },
  releaseList() {
    css`
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      position: relative;

      & > header {
        grid-column: span 1;
      }
      @media only screen and (max-width: 768px) {
        & > header {
          grid-column: span 3;
        }
      }
    `
  },
  navigation() {
    css`
      grid-column: span 2 / -1;
      display: grid;
      grid-auto-flow: column;
      align-self: end;
      line-height: var(--md-5);
      font-size: var(--navFontSize);
      font-style: italic;
      position: -webkit-sticky;
      position: sticky;
      top: var(--viewportPaddingTop);
      z-index: 2;
      background: var(--white-3);

      & > a {
        text-decoration: underline dashed var(--gray-3-half);
      }
      & > a:last-child {
        padding-right: var(--md-2);
      }
      @media only screen and (max-width: 768px) {
        & > a:last-child {
          padding-right: 0;
          justify-self: end;
        }
        & > a:not(:first-child):not(:last-child) {
          justify-self: center;
        }
      }

      @media only screen and (min-width: 769px) {
        & {
          justify-self: end;
          column-gap: var(--md-2);
        }
      }

      @media only screen and (max-width: 320px) {
        & {
          column-gap: var(--md-05);
        }
      }
      @media only screen and (min-width: 321px) and (max-width: 480px) {
        & {
          column-gap: var(--md);
        }
      }

      @media only screen and (min-width: 481px) and (max-width: 768px) {
        & {
          column-gap: var(--md-2);
        }
      }
      @media only screen and (max-width: 768px) {
        & {
          grid-column: span 3;
          z-index: 4;
        }
      }
    `
  },
  releaseGroup() {
    css`
      position: relative;
      grid-column: span 3;

      & > header {
        position: -webkit-sticky;
        position: sticky;
        top: var(--viewportPaddingTop);
        background: var(--white-3);
        z-index: 1;
        line-height: var(--md-4);
      }
      & > header a {
        text-decoration: none;
      }

      @media only screen and (max-width: 768px) {
        & > header {
          z-index: 3;
          top: calc(var(--viewportPaddingTop) + var(--md-5));
        }
      }

      &:first-of-type > header > [data-head-link='2'] {
        margin-block-start: var(--md-5);
        -webkit-margin-before: var(--md-5);
      }
    `
  },
  release() {
    css`
      position: relative;
      display: grid;

      & > header {
        background: var(--white-3);
        top: calc(var(--viewportPaddingTop));
        line-height: var(--md-5);
        display: grid;
        grid-template-columns: minmax(max-content, 80px) auto;
        justify-content: start;
        column-gap: var(--md);
      }

      &[data-large-article] > header,
      &[data-many-lines] > header {
        position: -webkit-sticky;
        position: sticky;
      }

      & > header > time {
        align-self: end;
        font-style: italic;
        color: var(--gray-1);
      }

      & > header a {
        text-decoration: none;
      }

      @media only screen and (max-width: 768px) {
        & > header {
          z-index: 1;
          top: calc(var(--viewportPaddingTop) + var(--md-5));
        }
      }
    `
  }
}

createGlobalStyle`
:root {
  --ligatures: 'kern' 1, 'liga' 1, 'calt' 1, 'tnum' 0, 'ss03' 1, 'cv05' 1,
    'cv06' 1, 'cv08' 1, 'cv10' 1, 'dlig' 1, 'cv02' 1;
  --ligatures-titles: 'cpsp' 1;
  --font-features-titles: var(--ligatures), var(--ligatures-titles);
}
:root {
  --md: 8px;
  --md-2: calc(var(--md) * 2);
  --md-3: calc(var(--md) * 3);
  --md-4: calc(var(--md) * 4);
  --md-5: calc(var(--md) * 5);
  --md-6: calc(var(--md) * 6);
  --md-7: calc(var(--md) * 7);
  --md-8: calc(var(--md) * 8);
  --md-9: calc(var(--md) * 9);
  --md-10: calc(var(--md) * 10);
  --md-16: calc(var(--md) * 16);
  --md-32: calc(var(--md) * 32);
  --md-64: calc(var(--md) * 64);
  --md-075: calc(var(--md-025) * 3);
  --md-05: calc(var(--md) / 2);
  --md-025: calc(var(--md) / 4);
}

:root {
  --black: #120309;
  --orange: #e95801;
  --white: #fdf5ed;
  --red: #bb1f25;
  --white-1: #fef7f1;
  --white-2: #fefaf6;
  --white-3: #fffcfa;
  --gray-1: #443b3c;
  --gray-2: #7d7472;
  --gray-3: #bbb2ae;
  --gray-3-half: #bbb2ae80;
  --white-unsafe: white;
  --shadow-1: 1px 2px 3px var(--gray-3-half);
  --shadow-2: 2px 3px 5px var(--gray-3-half);
  --syntax-const: #d73a49;
  --syntax-variable: #005cc5;
  --syntax-number: #005cc5;
  --syntax-string: #aa1111;
  --syntax-method: #6f42c1;
}
@media (prefers-color-scheme: dark) {
 :root {
  --black: #e6f0f6;
  --orange: #ffab76;
  --white: #20232a;
  --red: #ff6a70;
  --white-1: #32363e;
  --white-2: #2c2f36;
  --white-3: #25262b;
  --gray-1: #bbc4c9;
  --gray-2: #828b93;
  --gray-3: #444b51;
  --gray-3-half: rgba(68, 75, 81, 0.5019607843137255);
  --white-unsafe: #1a1b1e;
  --shadow-1: 1px 2px 3px var(--dark-gray-3-half);
  --shadow-2: 2px 3px 5px var(--dark-gray-3-half);
  --syntax-const: #ff7588;
  --syntax-variable: #6ba4ff;
  --syntax-number: #6ba4ff;
  --syntax-string: #ff6670;
  --syntax-method: #c7a8ff;
 }
}
* {
  box-sizing: border-box;
}
@font-face {
  font-family: 'Inter var';
  font-weight: 100 900;
  font-display: fallback;
  font-style: normal;
  font-named-instance: 'Regular';
  src: url('/assets/Inter-upright.var.woff2') format('woff2');
}
@font-face {
  font-family: 'Inter var';
  font-weight: 100 900;
  font-display: fallback;
  font-style: italic;
  font-named-instance: 'Italic';
  src: url('/assets/Inter-italic.var.woff2') format('woff2');
}
body {
  font-family: 'Inter var', sans-serif;
  -webkit-font-variant-ligatures: contextual common-ligatures;
  font-variant-ligatures: contextual common-ligatures;
  font-feature-settings: var(--ligatures);
  -webkit-text-size-adjust: 100%;
  font-kerning: normal;
  -webkit-font-kerning: normal;
}

body {
  --safeAreaTop: 0;
  --safeAreaBottom: 0;
  --safeAreaLeft: 0;
  --safeAreaRight: 0;
  --viewportTargetPadding: var(--md-4);
  --navFontSize: var(--md-3);
  font-size: var(--md-2);
  color: var(--black);
  margin: 0;
  background: var(--white-3);
  display: grid;
  grid-template-columns: auto auto;
  column-gap: var(--md);
  hyphens: auto;
}
@media only screen and (max-width: 480px) {
  body {
    --viewportTargetPadding: var(--md-3);
  }
}
@supports (padding-top: env(safe-area-inset-top, 0)) {
  body {
    --safeAreaTop: env(safe-area-inset-top, 0);
    --safeAreaBottom: env(safe-area-inset-bottom, 0);
    --safeAreaLeft: env(safe-area-inset-left, 0);
    --safeAreaRight: env(safe-area-inset-right, 0);
  }
}
body {
  --viewportPaddingTop: calc(var(--viewportTargetPadding) + var(--safeAreaTop));
  --viewportPaddingBottom: calc(
    var(--viewportTargetPadding) + var(--safeAreaBottom)
  );
  --viewportPaddingLeft: calc(
    var(--viewportTargetPadding) + var(--safeAreaLeft)
  );
  --viewportPaddingRight: calc(
    var(--viewportTargetPadding) + var(--safeAreaRight)
  );
}
@supports (padding: max(0px)) {
  body {
    --viewportPaddingTop: max(
      calc(var(--viewportTargetPadding) / 2),
      var(--safeAreaTop)
    );
    --viewportPaddingBottom: max(
      calc(var(--viewportTargetPadding) / 2),
      var(--safeAreaBottom)
    );
    --viewportPaddingLeft: max(
      var(--viewportTargetPadding),
      var(--safeAreaLeft)
    );
    --viewportPaddingRight: max(
      var(--viewportTargetPadding),
      var(--safeAreaRight)
    );
  }
}
body {
  padding-top: var(--viewportPaddingTop);
  padding-bottom: var(--viewportPaddingBottom);
  padding-left: var(--viewportPaddingLeft);
  padding-right: var(--viewportPaddingRight);
  height: calc(
    100vh - var(--viewportPaddingTop) - var(--viewportPaddingBottom)
  );
  /* width: calc(100vw - var(--viewportPaddingLeft) - var(--viewportPaddingRight)); */
}
a {
  color: var(--black);
  hyphens: none;
}
a:visited {
  color: var(--gray-2);
}

code {
  hyphens: none;
}

[data-app-section='menu'] {
  grid-column: 1 / span 1;
  overflow-y: scroll;
  padding-right: var(--md-2);
}
[data-app-section='docs'] {
  grid-column: 2 / span 1;
}

@media only screen and (max-width: 768px) {
  [data-app-section='menu'] {
    grid-column: span 2 / -1;
  }
  [data-app-section='docs'] {
    grid-column: span 2 / -1;
  }
  [data-toc-level='3'] {
    display: none;
  }
}
[data-head-link='1'] {
  margin-block-start: 0;
  -webkit-margin-before: 0;
  margin-block-end: 0;
  -webkit-margin-after: 0;
  font-size: var(--md-5);
}
[data-head-link='2'] {
  margin-block-start: var(--md-9);
  -webkit-margin-before: var(--md-9);
  margin-block-end: 0;
  -webkit-margin-after: 0;
  font-size: var(--md-4);
}
[data-head-link='3'] {
  margin-block-start: var(--md-3);
  -webkit-margin-before: var(--md-3);
  margin-block-end: 0;
  -webkit-margin-after: 0;
  font-size: var(--md-3);
}
@media only screen and (min-width: 769px) {
  [data-head-link='2'] {
    font-size: calc(var(--md-4) + var(--md-05));
  }
}

@media only screen and (max-width: 768px) {
  [data-head-link='3'] {
    font-size: calc(var(--md-2) + var(--md-05));
  }
}

[data-head-link] > a,
[data-toc-level] > a {
  color: var(--black);
  hyphens: none;
}
[data-toc-level] {
  padding-right: 0;
  padding-left: var(--toc-padding, 0);
}
[data-toc-level] > a {
  text-decoration: none;
}
[data-toc-level='1'] {
  --toc-padding: 0;
}
[data-toc-level='2'] {
  --toc-padding: 0;
}
[data-toc-level='3'] {
  --toc-padding: var(--md-2);
  font-size: calc(var(--md) + var(--md-05));
}
[data-md-element='paragraph'] {
  margin-block-start: var(--md);
  -webkit-margin-before: var(--md);
  margin-block-end: 0;
  -webkit-margin-after: 0;
}
[data-md-element='list'] {
  padding-inline-start: var(--md-3);
  -webkit-padding-start: var(--md-3);
  margin-block-start: 0;
  -webkit-margin-before: 0;
  margin-block-end: 0;
  -webkit-margin-after: 0;
}

[data-section-header] {
  grid-column: 1 / span 2;
  margin-inline-start: var(--md-16);
  -webkit-margin-start: var(--md-16);
  margin-block-start: var(--md-8);
  -webkit-margin-before: var(--md-8);
  margin-block-end: var(--md-3);
  -webkit-margin-after: var(--md-3);
}

[data-element='code'] {
  white-space: pre-wrap;
  width: -moz-fit-content;
  width: fit-content;
  hyphens: none;
}

@media only screen and (min-width: 769px) and (max-width: 980px) {
  body {
    --navFontSize: calc(var(--md-2) + var(--md-05));
  }
}

@media only screen and (max-width: 320px) {
  body {
    --navFontSize: calc(var(--md) + var(--md-05));
  }
}
@media only screen and (min-width: 321px) and (max-width: 480px) {
  body {
    --navFontSize: var(--md-2);
  }
}

@media only screen and (min-width: 481px) and (max-width: 768px) {
  body {
    --navFontSize: calc(var(--md-2) + var(--md-025));
  }
}

`

declare const css: (
  words: TemplateStringsArray,
  ...values: Array<DOMProperty | AttributeStore>
) => void
declare const createGlobalStyle: (
  words: TemplateStringsArray,
  ...values: Array<DOMProperty | AttributeStore>
) => void

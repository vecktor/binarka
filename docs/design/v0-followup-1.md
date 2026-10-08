# v0 follow-up 1

Paste everything below the line into the same v0 chat.

---

Thanks, the structure and the CSS are exactly what I need. Please make these changes; keep everything else (DOM, classes, data attributes, texts, tokens, the five routes) unchanged.

1. **No external font.** Remove the Google Fonts `@import` from `app/binarka.css`. The page must make no network requests at runtime, and screenshots must not depend on a web font loading in time. Use a system font stack (`system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`), and re-check spacing, the logo text and the cell digits with it. If the design really needs Rubik, instead self-host it: put the `woff2` files in `public/fonts/`, use `@font-face` with `font-display: block`, and tell me the licence.
2. **Static export.** Set `output: 'export'` in `next.config.mjs` (with `trailingSlash: true`), so `next build` writes plain HTML for all five routes to `out/`. Remove `typescript.ignoreBuildErrors`: the build must pass type checking.
3. **Remove template leftovers** that the pages do not use: `app/globals.css`, `components/ui/button.tsx`, `lib/utils.ts`, `components.json`, the `public/placeholder*` files, and the unused dependencies (`shadcn`, `@base-ui/react`, `lucide-react`, `@vercel/analytics`, `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css`, `tailwindcss`, `@tailwindcss/postcss`, and `postcss` with `postcss.config.mjs` if nothing needs it). Keep only Next.js, React, React DOM, TypeScript and their types.
4. **The logo word as shapes, not text.** Draw «БІНАРКА» inside the SVG as paths (outlined glyphs) instead of an SVG `<text>` element, so the heading's text content is only «Бінарка» and the logo looks the same without any font. Keep `aria-hidden="true"` on the SVG.
5. **Tell me** the exact commands to build and serve the static export locally (for example `pnpm install && pnpm build`, then a static file server on `out/`), and which Node and pnpm versions you assume.

# AGENTS.md

Penpot's fork of `svg/svgo`. Heavily diverged from upstream: assume nothing carries over from upstream svgo docs without checking the source here.

## Toolchain

- Package manager: **pnpm** (`pnpm-lock.yaml`, `pnpm-workspace.yaml`). `npm`/`yarn` will desync the lockfile.
- Source is **CommonJS** (`require`/`module.exports`) — do not switch to ESM.
- `pnpm-workspace.yaml` allow-lists `esbuild` and `opencode-ai` install scripts; new native deps need entries here.

## Scripts (`package.json`)

- `pnpm build` → `dist/svgo.mjs` (browser ESM bundle of `src/svgo.js`).
- `pnpm build:node` → `dist/svgo-cli.js` (minified Node CLI bundle of `src/svgoCli.js`).
- `pnpm test` → Jest 29. Auto-discovers `test/**/*.test.js`.

There is **no `lint`, `typecheck`, or `format` script**. Do not invent one.

## Tests

`pnpm test` runs Jest 29 against `test/`. 332 cases pass, 4 are intentionally skipped (upstream plugin regressions — see the exclude list in `test/plugins/_index.test.js`):

- `test/svgo/path.test.js`, `test/svgo/xast.test.js`, `test/svgo/style.test.js` — direct unit tests for `src/svgo/{path,xast,style}.js`.
- `test/svgo/_index.test.js` — pretty-print, entities, empty tag, plugin ordering (fixture-driven).
- `test/svgo/svgo.test.js` — fork-API contract: `optimize()` returns a string, default plugins = `safePreset`, `multipass` caps at 10, `floatPrecision` global override, `SvgoParserError` shape.
- `test/svg2js/_index.test.js` — `parseSvg()` AST shape.
- `test/plugins/_index.test.js` — auto-discovered fixtures under `test/plugins/<plugin>.[NN].svg` (50 plugins × ~5 fixtures = 273 enabled cases + 4 skipped). Fixture format: `description === \n original @@@ expected @@@ params(JSON)`.
- `test/plugins/prefixIds.test.js` — explicit case for `prefixIds` since the fixture loader only handles stateless plugins.
- `test/cli/cli.test.js` — single stdin → stdout smoke test of `src/svgoCli.js` via `child_process.spawn`.

Two infra files back the suite:

- `jest.config.js` — registers an esbuild-based transformer (`jest.transform.js`) and a `transformIgnorePatterns` that whitelists the ESM-only deps transitively required by `css-select@7`: `css-select`, `boolbase`, `css-what`, `dom-serializer`, `domelementtype`, `domhandler`, `domutils`, `entities`, `nth-check`. The pattern intentionally also accepts the pnpm-symlinked `node_modules/.pnpm/<pkg>@<ver>/node_modules/<pkg>/` form.
- `jest.transform.js` — `esbuild.transformSync` with `format: 'cjs'`, `target: 'node16'`. Required because the fork's CJS source still `require()`s packages that published ESM-only.

Test conventions specific to this fork (the upstream Jest suite has been pruned):

- `optimize()` returns a **string**, not `{ data, error }`. Tests assert against the return value directly.
- Stringifier config keys (`pretty`, `indent`, `eol`, `finalNewline`) are read at the **top level** of the `optimize()` config, not nested under `js2svg`. `js2svg: { pretty }` is silently ignored.
- `datauri: 'enc'` is **not** implemented in this fork (not present in `src/svgo.js` or `src/svgo/stringifier.js`).

## Library API (diverges from upstream)

`src/svgo.js` exports:

```js
const { optimize, defaultOptions } = require('./src/svgo.js');
```

- `optimize(input, config)` returns the **optimized SVG string directly** (not `{ data, error }`). Errors throw.
- `config` is **required** and must be a plain object — `optimize(input)` with no second arg throws `'Config should be an object'`.
- `config.plugins` defaults to `['safePreset']` when omitted (i.e. `optimize(svg, {})` uses `safePreset`). `defaultOptions.plugins` is `['safeAndFastPreset']` — that is what `svgoCli.js` passes.
- `config.multipass: true` caps at 10 passes and stops early when size stops shrinking.
- `config.floatPrecision` is forwarded as a global override to every plugin (note: code currently checks `!== null`, so passing `undefined` still sets it — be careful when threading config).
- `info.path` is set to `config.path` per pass, so plugins like `prefixIds` that derive a prefix from the file basename work.

## Preset names

Presets use **camelCase, no hyphens** (set in `src/svgo/plugins/{default,safe,safeAndFast}.js`):

- `defaultPreset` — full upstream-style preset (not wired into any default code path).
- `safePreset` — default for `optimize()` when no plugins given.
- `safeAndFastPreset` — CLI default; has `multipass: true` baked in and runs `inlineStyles` with `onlyMatchedOnce: false`. Diverges from `safePreset` mainly by dropping `convertPathData`/`convertTransform`/`convertEllipseToCircle` and tweaking `inlineStyles`.

Anything referencing `preset-default` / `preset-safe` is upstream-shaped and will break here.

## CLI (`src/svgoCli.js`)

Stdin → stdout pipe only. No flags, no file args, no `--config`. Always uses `defaultOptions` (`safeAndFastPreset`). The upstream `bin/svgo` entrypoint does **not** exist here; ignore tests that spawn it.

## Layout

- `src/svgo.js` — public entrypoint.
- `src/svgoCli.js` — CLI wrapper.
- `src/svgo/` — core: `parser.js` (SAX-based, throws `SvgoParserError`), `stringifier.js`, `plugins.js` (resolves plugin specs), `tools.js` (`invokePlugins`, `createPreset`), `xast.js` (`visit`), `style.js`, `path.js`, `css-select-adapter.js`.
- `src/svgo/plugins/` — 50+ plugin modules + the three preset files. Plugin id = file basename (camelCase). New plugins must be added to `src/svgo/builtin.js` to be resolvable by string id.
- `dist/svgo.mjs` and `dist/svgo.mjs.map` are **committed** even though `dist/` is in `.gitignore`. Don't delete them unrelated to a build refresh.

## Gotchas

- `src/svgo/parser.js` parses `<!ENTITY …>` declarations out of doctype and injects them into the SAX entity table; SAX is in strict mode with `trim:false`/`normalize:false`.
- `.gitattributes` enforces LF endings; do not commit CRLF.
- Upstream's `preset-default` plugin parameter shape (`{ name: 'preset-default', params: { overrides: {...} } }`) is **not** implemented by this fork's `resolvePlugin`. Plugin configs here are flat (`{ name, params, fn? }`).

## Security: CVE-2026-29074

The fork depends on `sax@^1.6.0` (not the older `@trysound/sax@0.2.0`) and the parser config in `src/svgo/parser.js` sets `unparsedEntities: true`. This combination is what makes the recursive entity expansion safe: `sax >= 1.4` introduced `maxEntityCount` (default 512) and `maxEntityDepth` (default 4) guards around the expansion path, and `unparsedEntities: true` is required to opt in to that path in the first place.

**Do not**:
- Downgrade `sax` below 1.4.
- Remove `unparsedEntities: true` from the parser config (entity expansion of DTD entities in SVGs like the Adobe Illustrator `entities.svg` test fixture would silently stop working).
- Switch back to `@trysound/sax` (it lacks the entity-count/depth guards; pre-1.4 `sax` behaviour).

A regression test in `test/svgo/svgo.test.js` (the `CVE-2026-29074 — billion-laughs guard` describe) feeds the advisory's 9-level PoC and asserts that the parser throws `SvgoParserError` mentioning entity depth/count, not OOM.

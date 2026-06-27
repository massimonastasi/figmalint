# FigmaLint

An AI-powered Figma plugin that audits components for design system compliance, accessibility, and developer readiness — then helps you fix what it finds.

FigmaLint analyzes your components against real standards, surfaces hard-coded values and naming issues, and produces structured documentation ready for developer handoff or AI code generation.

> **This is an enhanced fork of [southleft/figmalint](https://github.com/southleft/figmalint).** It adds a 4th AI provider (GitHub Models), a reorganized tabbed UI, a header model indicator, build/security fixes, and a dead-code cleanup. See [What's new in this fork](#whats-new-in-this-fork).

**[Install from Figma Community](https://www.figma.com/community/plugin/1521241390290871981/figmalint)**

## Features

### Multi-Provider AI Analysis

Choose your preferred AI provider and model:

- **Anthropic** — Claude Opus 4.7, Sonnet 4.6, Haiku 4.5
- **OpenAI** — GPT-5.5, GPT-5.4 Mini, GPT-5.4 Nano
- **Google** — Gemini 3.1 Pro, Gemini 3 Flash, Gemini 3.1 Flash-Lite
- **GitHub Models** — GPT-4o, GPT-4o mini, Llama 3.3 70B (OpenAI-compatible API, authenticated with a GitHub fine-grained PAT; separate quota from a Copilot subscription)

Switch providers and models at any time. API keys are stored per provider and auto-detected from key format.

### Component Analysis

- Detects missing interactive states (hover, focus, disabled, pressed, active)
- Evaluates accessibility against WCAG standards — contrast ratio, touch target size, focus indicators, font size
- Checks component readiness — property configuration, descriptions, structure
- Identifies component variants and maps their relationships
- Lists nested component instances used within the design

### Design Token Detection

- Detects Figma Variables, Named Styles, and hard-coded values
- Categorizes tokens by type: colors, spacing, typography, effects, borders
- Distinguishes actual design tokens from hard-coded values with per-node deduplication
- Provides AI-driven suggestions for mapping hard-coded values to tokens
- Filters wrapper/boundary elements from scoring to reduce false positives

### Auto-Fix

Apply fixes directly from the analysis results:

- **Token binding** — Bind hard-coded colors and spacing values to design system variables. Searches both local and published library variables, so your tokens can live in a separate file. Fuzzy matching finds the closest token with property-aware scoring (stroke weight matches stroke tokens, padding matches spacing tokens, etc.)
- **Layer renaming** — Detects generic Figma names (Frame 1, Rectangle 4) and suggests semantic alternatives. Six naming strategies: Semantic, BEM, prefix-based, kebab-case, camelCase, snake_case. Recognizes 30+ semantic layer types.
- **Add component properties** — Stage recommended Boolean, Text, Instance Swap, or Variant properties from AI suggestions.
- **Batch operations** — Fix All buttons to resolve all token or naming issues at once.

### AI-Powered Descriptions

Generates structured component descriptions with:

- Brief summary of the component and its variants
- PURPOSE, BEHAVIOR, COMPOSITION, USAGE, and CODE GENERATION NOTES sections
- Nested component inventory so AI tools know what sub-components already exist
- Comparison UI showing whether the Figma description matches the AI-generated one
- Side-by-side review modal for approving description updates

### Component Audit Scoring

Each component receives a readiness score based on:

- Design token adoption (weighted 2x)
- Interactive state coverage (weighted 3x)
- Accessibility checks (contrast, touch targets, focus, font size)
- Component readiness checks (descriptions, property configuration)
- Score-aware AI Interpretation that adapts messaging to actual results

### Design Systems Chat

A conversational interface for asking questions about your selected component. Supports multi-turn conversation with context about the component's properties, tokens, states, and structure.

### Developer Handoff

Three export formats:

- **Markdown** — Comprehensive documentation with variants table, properties API, property quick reference, states with pass/fail status, slots, design token breakdown (tokens in use vs hard-coded), accessibility info and audit results, component readiness, naming issues, and AI interpretation. Ready for ZeroHeight, Knapsack, or Supernova.
- **AI Prompt** — A structured specification you can paste into any AI tool to generate production-ready component code. Includes the full component spec, design tokens, accessibility requirements, and implementation notes.
- **JSON** — Complete analysis data including metadata, token analysis, audit results, naming issues, and properties for programmatic use.

## Getting Started

### From Figma Community

1. Visit [FigmaLint on Figma Community](https://www.figma.com/community/plugin/1521241390290871981/figmalint)
2. Click "Install"

### Manual Installation (Development)

1. Clone this repository
2. `npm install`
3. `npm run build`
4. In Figma: Plugins > Development > Import plugin from manifest
5. Select `manifest.json` from the project root (build it first — it points to `dist/code.js`)

### Setup

1. Open the **Configuration** tab
2. Select a provider (Anthropic, OpenAI, Google, or GitHub Models)
3. Choose a model
4. Enter your API key (for GitHub Models, a GitHub fine-grained PAT with the **Models** permission)
5. Save the key — the **Analyze** and **Chat** tabs unlock once a provider is configured
6. Select a component and click Analyze

## Architecture

```
src/
├── code.ts                      # Plugin entry point
├── types.ts                     # TypeScript definitions
├── api/
│   ├── claude.ts                # Prompt construction and AI integration
│   └── providers/
│       ├── types.ts             # Provider type system
│       ├── index.ts             # Provider registry and routing
│       ├── anthropic.ts         # Anthropic (Claude) provider
│       ├── openai.ts            # OpenAI (GPT) provider
│       ├── google.ts            # Google (Gemini) provider
│       └── github.ts            # GitHub Models provider (OpenAI-compatible)
├── core/
│   ├── component-analyzer.ts    # Component analysis and prompt building
│   ├── token-analyzer.ts        # Design token detection and categorization
│   └── consistency-engine.ts    # Design system consistency checks
├── fixes/
│   ├── token-fixer.ts           # Token binding (color + spacing variables)
│   └── naming-fixer.ts          # Layer renaming with semantic detection
├── ui/
│   └── message-handler.ts       # Plugin ↔ UI message routing
└── utils/
    └── figma-helpers.ts         # Figma API utilities

scripts/
└── selfcheck.ts                 # Runnable self-check for provider key detection/validation

ui-enhanced.html                 # Plugin interface (single-file HTML/CSS/JS) — Analyze / Chat / Configuration tabs
```

> The build bundles `src/code.ts` → `dist/code.js` with esbuild. `dist/` is generated, not committed — run `npm run build` before importing into Figma. The root `manifest.json` references `dist/code.js` and `ui-enhanced.html`.

## Development

### Prerequisites

- Node.js 16+
- An API key from [Anthropic](https://console.anthropic.com), [OpenAI](https://platform.openai.com), [Google AI Studio](https://aistudio.google.com), or a [GitHub fine-grained PAT](https://github.com/settings/personal-access-tokens) with the **Models** permission

### Commands

```bash
npm install          # Install dependencies
npm run dev          # Development build with watch mode
npm run build        # Production build (outputs dist/code.js)
npm run lint         # Type checking
npm run test         # Run the provider key-detection/validation self-check
npm run clean        # Clean build artifacts
```

## Privacy & Security

- API keys stored in Figma's local storage per provider
- Component data is never stored externally
- Analysis calls go directly to the selected provider's API
- Auto-fix operations modify only the properties you approve
- Open source

## What's new in this fork

Changes made on top of the original [southleft/figmalint](https://github.com/southleft/figmalint):

### New features

- **GitHub Models provider (4th provider).** OpenAI-compatible inference via `https://models.github.ai`, authenticated with a GitHub fine-grained PAT (Models permission). Same per-provider key storage and auto-detection as the others. This is GitHub Models' own rate-limited quota — *not* a Copilot subscription. (GitHub Copilot's editor API is undocumented and against its Terms of Service, so it is intentionally not integrated.)
- **Tabbed interface.** The UI is now organized into **Analyze**, **Chat**, and **Configuration** tabs. Provider/key/model setup lives in its own Configuration tab instead of an inline card.
- **Provider gating.** Until a provider is configured, the Analyze and Chat tabs are disabled and the plugin opens on Configuration. Saving a key unlocks them and jumps to Analyze.
- **Header model indicator.** The active provider and model are shown in the header, right-aligned opposite the logo, and stay in sync with the dropdowns.
- **Version in the title.** The plugin version is shown in the UI title and the Figma plugin name (`manifest.json`).

### Fixes & maintenance

- **Security:** the Google API key (passed as a `?key=` query param) is no longer written to the console — it's redacted in request logging.
- **Build:** fixed `npm run build` on Windows — replaced unix `rm`/`cp` scripts with cross-platform Node, and removed an invalid `--global-name=''` esbuild flag that broke the bundle. `dist/` is no longer committed (generated by `npm run build`); the root `manifest.json` now points at `dist/code.js`.
- **Dead code removed:** unused `fetchClaude`, `createDesignAnalysisPrompt`, `createMCPAugmentedPrompt`, and the entire unused `createMCPEnhancedAnalysis` MCP chain (~380 lines).
- **De-duplication:** provider model lists now have a single source of truth in `api/providers/types.ts` instead of being redefined per provider file.
- **Tests:** added `npm run test` — a dependency-free self-check (`scripts/selfcheck.ts`, bundled with esbuild) for provider key detection and format validation.
- **Docs:** corrected the model lineups and manual-installation steps.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Push and open a Pull Request

## License

ISC — see [LICENSE](LICENSE) for details.

## Support

- **Issues (this fork)**: [GitHub Issues](https://github.com/massimonastasi/figmalint/issues)
- **Discussions**: Share ideas and get help from the community

---

Originally built by [Southleft](https://southleft.com) ([southleft/figmalint](https://github.com/southleft/figmalint)); this fork maintained by [massimonastasi](https://github.com/massimonastasi).

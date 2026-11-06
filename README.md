# Plain-English browser tests

A small TypeScript CLI uses Gemini to interpret a new English test case and Playwright to execute browser actions. Website behavior and credentials are inputs, not site-specific code.

## Setup

Install Node.js 22+, Google Chrome, and obtain a [Gemini API key](https://ai.google.dev/gemini-api/docs/api-key).

```sh
npm ci
npm run build
export GEMINI_API_KEY='your-key'
export GEMINI_MODEL='gemini-2.5-flash' # configurable
npm start -- --url https://example.com --test 'Verify the page shows Example Domain'
```

Chrome is the default browser channel. To use Playwright-managed Chromium: `npx playwright install chromium`, then set `BROWSER_CHANNEL=chromium`. Use `--headed` to show the browser, `--video` to save local browser video, `--out artifacts/my-run` for a stable report directory, `--steps 40` and `--timeout 120000` for limits. Timeout is milliseconds; startup and artifact finalization add overhead. All limits must be positive integers.

For customer login, store credentials in an ignored file named `credentials.local.json` with string values `customerEmail` and `customerPassword`. Copy the structure from `examples/data.example.json`, replacing the placeholders locally.

```sh
npm start -- --url https://phptravels.net/login --file examples/phptravels.txt --data credentials.local.json --headed
```

Alternatively pass any new English case using `--test`, or use `--file path/to/case.txt`. Reference named data as `{{key}}`. The model receives keys and placeholders; the executor substitutes values only when needed. Missing data is a blocker. Test intent and page observations are sent to Gemini; do not run against sensitive pages without authorization.

## How it works

1. Observe the URL, visible page text and numbered controls across frames, plus open tabs. Hidden controls are excluded; Playwright discovery also reaches open shadow roots.
2. Ask Gemini for one action using a JSON response schema; validate again with Zod.
3. Observe again. If the page changed, discard the proposed action and replan. Otherwise execute the action against the current locator.
4. Verify assertions with browser checks. Completion requires at least one successful assertion. Fail on a failed assertion or invalid model action. Replan after up to three consecutive browser action errors; bound time, steps and repeated actions. Transient provider responses are retried up to three times.

Allowed actions: navigate, click, fill, select native dropdown, set checkbox, press key, scroll, switch tab, assert, done and blocked. The executor does not run model-generated code. A single action uses a current target number, never a hard-coded PHPTRAVELS selector. Popups are listed as tabs; frames are included in discovery.

## Results and debugging

Exit 0: `PASS`. Exit 1: `FAIL`. Exit 2: `BLOCKED` or invalid CLI configuration. Reports appear in `artifacts/<timestamp>/`:

- `result.json`: action history, verified assertion count, status and reason.
- `summary.txt`: short status.
- `final.png`: screenshot with editable controls masked.
- `trace.zip`: local Playwright trace (`npx playwright show-trace artifacts/RUN/trace.zip`).
- Optional `.webm`: actual browser video.

Named data values are redacted from text reports. **Traces, videos and DOM snapshots can contain credentials**, so the entire artifacts directory is ignored and must not be published without inspection. Keep credentials in named data files; do not embed them in English cases or command lines. Sanitize evidence manually before publication.

## Validation

```sh
npm run build
npm test
npm audit
```

Try the independent local catalogue example:

```sh
node scripts/demo-server.mjs
# In another terminal, with GEMINI_API_KEY set:
GEMINI_MODEL=gemini-3-flash-preview npm start -- --url http://127.0.0.1:4173 --file examples/library.txt
```

Tests use actual Chrome and an explicitly scripted planner, independently of Gemini. They cover execution, incorrect assertions, missing data, limits and action validation. They do not prove model accuracy. [Verification notes](evidence/VERIFICATION.md) separately document real Gemini runs, including PHPTRAVELS. `examples/phptravels.txt` is test input, not runner logic.

## Approach and limitations

Gemini decides the semantics of the test and expected outcomes; Playwright verifies the assertions it requests. A successful browser assertion is not a formal proof that the model covered every clause of an arbitrary English case. The model can misunderstand intent, choose an inadequate assertion, or fail to use a complex widget. Deterministic scripted tests remain preferable for established critical workflows.

CAPTCHA, MFA, gated credentials, inaccessible or closed-shadow controls, file upload, drag-and-drop, visual-only assertions and complex custom dropdowns are outside this small runner's supported action set. Dynamic pages may exhaust replanning limits. Ambiguous tests should include more context. Page content is treated as untrusted in the prompt, but prompt injection cannot be ruled out; use only authorized test sites and test accounts. This tool is not sandboxed from normal browser side effects requested by a test.

## Five-minute walkthrough

[Watch/download the silent captioned recording](https://github.com/SpaceCypher/plain-english-browser-tests/releases/tag/v1.0.0). The recording distinguishes live Selenium execution, recorded real Gemini browser footage, and verification notes.

To reproduce the walkthrough locally, install the sibling C# project and run a successful `--video` case into `artifacts/library-gemini-3-live`, then run `DOTNET=/path/to/dotnet node scripts/record-walkthrough.mjs`. Chrome debugging port 9333 must be free. The script takes five minutes and writes a WebM under `artifacts/walkthrough`.

# Verification · 6 November 2026

Environment: macOS ARM64, Node 22.22.3, Google Chrome 156. Model names are runtime configuration.

## Deterministic local checks

- `npm run build`: PASS.
- `npm test`: PASS. Real Chrome with a scripted planner. Includes positive login, negative assertion, missing data, completion without assertions, step/time limits, navigation, dropdowns, checkbox, keyboard, frame assertions, action schema rejection and escaped-secret redaction.
- `npm audit`: zero known vulnerabilities at verification time.

These checks exercise the executor and reports; scripted-planner success is not model success.

## Gemini 3.8 Flash default

After switching the default to `gemini-3.8-flash`, the build and scripted browser tests passed. Two live PHPTRAVELS runs were blocked by repeated Gemini HTTP 503 responses, before a verified assertion. A complete live dashboard pass with 3.8 Flash remains unverified. The 3.1 Flash Lite pass below remains valid for that model; set `GEMINI_MODEL=gemini-3.1-flash-lite` to select it explicitly.

## Actual Gemini and browser checks

- PHPTRAVELS customer login page, Gemini 2.5 Flash: PASS. Browser assertions verified the Email Address and Password fields. `phptravels-fields.json` is the sanitized actual action log. This was not a dashboard login test.
- Independent Reading Room catalogue fixture, Gemini 3 Flash Preview: PASS. The English case requested Orbit search, Science Fiction selection, Available-only filtering, and verification of Orbit Atlas. The model chose fill, select, check, assert, done. See `library-gemini.json`.
- Other attempts encountered HTTP 429, 503, unsupported-model 404 and a provider timeout. Those unsuccessful runs were not counted as passes. The final runner retries transient HTTP responses at most three times and reports provider errors as BLOCKED. Negative executor behavior was verified deterministically; a separate live-Gemini negative attempt hit rate limits and remains unverified.

## Shared demo account follow-up

The published PHPTRAVELS demo credentials later became available. An independent scripted Playwright check signed in as the shared customer account and reached `/dashboard`, displaying Demo User and Dashboard. This verifies the credentials and site flow.

The full plain-English AI flow subsequently passed with Gemini 3.1 Flash Lite: the runner dismissed the notice, entered the shared credentials, clicked Sign In, reached `/dashboard`, and verified visible text `Dashboard`. The sanitized action log is `phptravels-dashboard.json`. Earlier attempts encountered a timeout and HTTP 429; an initial run with this model reached the dashboard but exposed an omitted assertion target. The action schema now requires a target for element assertions. The results below describe the earlier registration attempts.

## PHPTRAVELS registration / dashboard boundary

Registration was explicitly authorized and used a unique reserved example.com email address, a generated password, and a fictional US phone number, rather than another person's contact information. A POST returned 302 to login, which displayed:

> Registration successful! We are unable to send verification email. Please contact admin to activate your account.

A subsequent real Gemini run dismissed the demo dialog, filled named credentials and clicked Sign In. The page displayed "Please verify your email address before logging in." The next model request timed out, so that run was unsuccessful and did not report a dashboard pass. See the inspected, input-masked `phptravels-activation.png`. That individually registered account remained blocked by activation. The shared demo account was verified separately as described above. Credentials, traces and credential-bearing video are not published.

The registration was repeated with a real receiving disposable inbox created through [Mail.tm](https://mail.tm). The site again returned the same verification-email failure and admin-activation message. The inbox API was reachable (HTTP 200) and contained zero messages. A temporary mailbox therefore did not resolve the site's outgoing-email failure. Mailbox credentials and tokens remain local.

## Recording

The five-minute silent captioned recording shows live C#/Selenium execution, playback of actual Gemini browser footage at normal speed, and explanations of architecture, setup, evidence and limitations. It is edited for presentation; it is not a continuous five-minute end-to-end login test.

# Verification · 6 November 2026

Environment: macOS ARM64, Node 22.22.3, Google Chrome 156. Model names are runtime configuration.

## Deterministic local checks

- `npm run build`: PASS.
- `npm test`: PASS. Real Chrome with a scripted planner. Includes positive login, negative assertion, missing data, completion without assertions, step/time limits, navigation, dropdowns, checkbox, keyboard, frame assertions, action schema rejection and escaped-secret redaction.
- `npm audit`: zero known vulnerabilities at verification time.

These checks exercise the executor and reports; scripted-planner success is not model success.

## Actual Gemini and browser checks

- PHPTRAVELS customer login page, Gemini 2.5 Flash: PASS. Browser assertions verified the Email Address and Password fields. `phptravels-fields.json` is the sanitized actual action log. This was not a dashboard login test.
- Independent Reading Room catalogue fixture, Gemini 3 Flash Preview: PASS. The English case requested Orbit search, Science Fiction selection, Available-only filtering, and verification of Orbit Atlas. The model chose fill, select, check, assert, done. See `library-gemini.json`.
- Other attempts encountered HTTP 429, 503, unsupported-model 404 and a provider timeout. Those unsuccessful runs were not counted as passes. The final runner retries transient HTTP responses at most three times and reports provider errors as BLOCKED. Negative executor behavior was verified deterministically; a separate live-Gemini negative attempt hit rate limits and remains unverified.

## PHPTRAVELS registration / dashboard boundary

Registration was explicitly authorized and used a unique reserved example.com email address, a generated password, and a fictional US phone number, rather than another person's contact information. A POST returned 302 to login, which displayed:

> Registration successful! We are unable to send verification email. Please contact admin to activate your account.

A subsequent real Gemini run dismissed the demo dialog, filled named credentials and clicked Sign In. The page displayed "Please verify your email address before logging in." The next model request timed out, so that run was unsuccessful and did not report a dashboard pass. See the inspected, input-masked `phptravels-activation.png`. Dashboard login remains BLOCKED by activation; it has not been verified. Credentials, traces and credential-bearing video are not published.

## Recording

The five-minute silent captioned recording shows live C#/Selenium execution, playback of actual Gemini browser footage at normal speed, and explanations of architecture, setup, evidence and limitations. It is edited for presentation; it is not a continuous five-minute end-to-end login test.

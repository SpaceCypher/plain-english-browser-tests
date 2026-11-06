import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { Action, redact } from "../src/actions.js";
import { run, type Planner } from "../src/runner.js";
const html = `<main><h1>Customer portal</h1><label>Email<input type=email></label><label>Password<input type=password></label><button onclick="document.querySelector('main').innerHTML='<h1>Dashboard</h1><p>Welcome customer</p>'">Sign in</button></main>`;
test("reject arbitrary code, invalid navigation, malformed actions; redact data", () => {
  assert.equal(
    Action.safeParse({ type: "evaluate", code: "x" }).success,
    false,
  );
  assert.equal(
    Action.safeParse({ type: "navigate", url: "javascript:alert(1)" }).success,
    false,
  );
  assert.equal(Action.safeParse({ type: "click", target: -1 }).success, false);
  assert.ok(
    !redact({ password: "secret" }, { password: "secret" }).includes("secret"),
  );
});
test("redacts secrets containing JSON escapes", () => {
  const secret = 'a"b\\c';
  const parsed = JSON.parse(redact({ value: secret }, { password: secret }));
  assert.equal(parsed.value, "[REDACTED]");
});

test("real browser with scripted planner: positive, negative, missing data, limits", async () => {
  const server = createServer((q, r) => {
    r.setHeader("content-type", "text/html");
    r.end(html);
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const addr = server.address() as any;
  const url = `http://127.0.0.1:${addr.port}`;
  try {
    const scripted =
      (actions: any[]): Planner =>
      async (view: any) => {
        const a = actions.shift();
        if (a.label) {
          a.target = view.elements.find((x: any) =>
            x.label.includes(a.label),
          )?.target;
          delete a.label;
        }
        if (a.text) {
          a.target = view.elements.find((x: any) => x.text === a.text)?.target;
          delete a.text;
        }
        return a;
      };
    const config = {
      url,
      test: "Log in as customer and verify Dashboard",
      data: { email: "demo@example.test", password: "secret" },
      timeout: 30000,
    };
    const positive = await run(
      { ...config, out: "artifacts/test-positive" },
      scripted([
        { type: "fill", label: "Email", value: "{{email}}" },
        { type: "fill", label: "Password", value: "{{password}}" },
        { type: "click", text: "Sign in" },
        {
          type: "assert",
          kind: "visible",
          text: "Dashboard",
          expected: "Dashboard",
        },
        { type: "done" },
      ]),
    );
    assert.equal(positive.status, "PASS");
    const negative = await run(
      { ...config, out: "artifacts/test-negative" },
      scripted([
        { type: "assert", kind: "url", expected: "/missing" },
        { type: "done" },
      ]),
    );
    assert.equal(negative.status, "FAIL");
    const missing = await run(
      { ...config, out: "artifacts/test-missing" },
      scripted([{ type: "fill", label: "Email", value: "{{missing}}" }]),
    );
    assert.equal(missing.status, "BLOCKED");
    const noAssertion = await run(
      { ...config, out: "artifacts/test-no-assertion" },
      scripted([{ type: "done" }]),
    );
    assert.equal(noAssertion.status, "FAIL");
    const limits = await run(
      { ...config, out: "artifacts/test-limit", steps: 1 },
      scripted([{ type: "scroll", pixels: 100 }]),
    );
    assert.equal(limits.status, "FAIL");
    const timeout = await run(
      { ...config, out: "artifacts/test-timeout", timeout: 200 },
      async () => new Promise(() => {}),
    );
    assert.equal(timeout.status, "FAIL");
  } finally {
    server.close();
  }
});

test("navigation, native select, checkbox, keyboard and frame assertions", async () => {
  const fixture = `<h1>Settings</h1><label>Colour<select><option>Blue</option><option>Green</option></select></label><label><input type=checkbox>Notifications</label><label>Message<input></label><iframe srcdoc="<h2>Frame ready</h2>"></iframe>`;
  const server = createServer((q, r) => {
    r.setHeader("content-type", "text/html");
    r.end(fixture);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${(server.address() as any).port}`;
  const actions: any[] = [
    { type: "navigate", url: url + "/settings" },
    { type: "select", label: "Colour", value: "Green" },
    { type: "check", label: "Notifications", checked: true },
    { type: "fill", label: "Message", value: "Hello" },
    { type: "press", label: "Message", key: "End" },
    { type: "assert", kind: "value", label: "Message", expected: "Hello" },
    { type: "assert", kind: "value", label: "Colour", expected: "Green" },
    {
      type: "assert",
      kind: "visible",
      text: "Frame ready",
      expected: "Frame ready",
    },
    { type: "done" },
  ];
  try {
    const result = await run(
      {
        url,
        test: "Update settings and verify the frame",
        data: {},
        out: "artifacts/test-actions",
      },
      async (view: any) => {
        const a = actions.shift();
        if (a.label) {
          a.target = view.elements.find(
            (e: any) => e.label === a.label,
          )?.target;
          delete a.label;
        }
        if (a.text) {
          a.target = view.elements.find((e: any) => e.text === a.text)?.target;
          delete a.text;
        }
        return a;
      },
    );
    assert.equal(result.status, "PASS");
    assert.equal(result.assertions, 3);
  } finally {
    server.close();
  }
});

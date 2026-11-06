// Records a captioned five-minute browser walkthrough. Requires sibling C# repo,
// DOTNET executable, installed Chrome, and a successful --video Task 2 run.
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
const root = path.resolve(".."),
  out = path.resolve("artifacts/walkthrough");
await mkdir(out, { recursive: true });
const fixture =
  '<form><section><label>Billing State</label><select><option>Canada</option></select></section><section><label>State</label><div><select><option>Canada</option><option>India</option></select></div></section><section><label>Gender</label><div><input type="radio" name="new-group" value="Female"><span>Female</span><input type="radio" name="new-group" value="Male"><span>Male</span></div></section><section><label for="broken">First Name</label><div><input id="new-random"></div></section></form>';
const server = createServer(async (req, res) => {
  if (req.url === "/fixture" || req.url === "/ambiguous") {
    res.setHeader("content-type", "text/html");
    res.end(
      "<style>body{font:22px system-ui;padding:45px}section{margin:24px}input,select{font:20px system-ui}</style><h1>Mutation fixture</h1>" +
        fixture +
        (req.url === "/ambiguous" ? fixture : ""),
    );
    return;
  }
  if (req.url === "/task2.webm") {
    try {
      const dir =
        process.env.TASK2_VIDEO_DIR || "artifacts/library-gemini-3-live";
      const file = (await readdir(dir)).find((x) => x.endsWith(".webm"));
      const data = await readFile(path.join(dir, file));
      res.setHeader("content-type", "video/webm");
      res.end(data);
    } catch {
      res.statusCode = 404;
      res.end();
    }
    return;
  }
  res.end("Walkthrough");
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const address = `http://127.0.0.1:${server.address().port}`;
const context = await chromium.launchPersistentContext(out + "/profile", {
  channel: "chrome",
  headless: true,
  args: ["--remote-debugging-port=9333"],
  viewport: { width: 1280, height: 800 },
  recordVideo: { dir: out, size: { width: 1280, height: 800 } },
});
const page = context.pages()[0];
const video = page.video();
const start = Date.now();
const waitUntil = async (seconds) => {
  const remaining = seconds * 1000 - (Date.now() - start);
  if (remaining > 0) await new Promise((r) => setTimeout(r, remaining));
};
const caption = async (text) => {
  await page.evaluate((text) => {
    let e = document.getElementById("walkthrough-caption");
    if (!e) {
      e = document.createElement("aside");
      e.id = "walkthrough-caption";
      e.style.cssText =
        "position:fixed;bottom:0;left:0;right:0;padding:20px 34px;background:#101b30;color:white;font:20px/1.5 system-ui;z-index:2147483647;white-space:pre-line;border-top:4px solid #56cdb8";
      document.body.append(e);
    }
    e.textContent = text;
  }, text);
};
async function selenium(url) {
  return new Promise((resolve) => {
    const child = spawn(
      process.env.DOTNET || "dotnet",
      [
        "run",
        "--project",
        root + "/cloudqa-resilient-selenium",
        "--",
        "--debugger-address",
        "127.0.0.1:9333",
        "--url",
        url,
      ],
      { cwd: root + "/cloudqa-resilient-selenium" },
    );
    let output = "";
    child.stdout.on("data", (x) => (output += x));
    child.stderr.on("data", (x) => (output += x));
    child.on("exit", (code) => resolve({ code, output }));
  });
}
const evidence = [];
await page.goto("https://app.cloudqa.io/home/AutomationPracticeForm");
await caption(
  "00:00 · TASK 1 — C# + Selenium\nConfigurable URL. Resolve visible meaning and form context, then verify browser values.",
);
await waitUntil(8);
let result = await selenium(
  "https://app.cloudqa.io/home/AutomationPracticeForm",
);
evidence.push(result);
await caption(
  "LIVE CLOUDQA RESULT · " +
    (result.code === 0 ? "PASS" : "FAIL") +
    "\nFirst Name, Gender, State verified. The form is never submitted.",
);
await waitUntil(30);
await caption(
  "HOW FIELD RESOLUTION WORKS\nLabels and accessible names → control types → bounded nearby context. No fixed IDs or positional XPath.",
);
await waitUntil(48);
await page.goto(address + "/fixture");
await caption(
  "MUTATION TEST\nFields reordered, wrappers added, IDs replaced, broken label reference and Billing State distractor.",
);
await waitUntil(56);
result = await selenium(address + "/fixture");
evidence.push(result);
await caption(
  "MUTATED PAGE · " +
    (result.code === 0 ? "PASS" : "FAIL") +
    "\nThe same C# program discovers and verifies the three fields after the changes.",
);
await waitUntil(78);
await page.goto(address + "/ambiguous");
await caption(
  "AMBIGUITY TEST\nTwo equally plausible forms. The program must fail without guessing.",
);
await waitUntil(86);
result = await selenium(address + "/ambiguous");
evidence.push(result);
await caption(
  "AMBIGUOUS PAGE · " +
    (result.code !== 0 ? "EXPECTED FAILURE" : "UNEXPECTED PASS") +
    "\nCandidate diagnostics explain why automation stopped.",
);
await waitUntil(105);
await caption(
  "TASK 1 LIMITS\nRecognizable labels must survive. Indistinguishable duplicates require context. Main-document forms only.",
);
await waitUntil(120);
await page.goto(address);
await page.setContent(
  `<style>body{margin:0;background:#101b30;color:white;font:20px system-ui}h1{margin:18px 30px}video{width:100%;height:640px;background:white;object-fit:contain}</style><h1>Task 2 · Recorded Gemini + Playwright browser run</h1><video autoplay muted src="${address}/task2.webm"></video>`,
);
await caption(
  "02:00 · TASK 2 — PLAIN ENGLISH → BROWSER ACTIONS\nPlayback of the real Gemini run, at normal speed. The test case and URL are supplied at runtime.",
);
await waitUntil(145);
await caption(
  "OBSERVE → PLAN → ACT → VERIFY\nGemini sees numbered visible controls. A schema validates one action. The browser is observed again before acting.",
);
await waitUntil(170);
await caption(
  "ASSERTIONS DETERMINE THE RESULT\nPlaywright checks actual visibility, text, URL or value. “Done” without a verified assertion is a failure.",
);
await waitUntil(195);
await page.evaluate(() => {
  const v = document.querySelector("video");
  if (v) v.currentTime = 0;
  v?.play();
});
await caption(
  "PORTABILITY AND BOUNDS\nNo PHPTRAVELS selectors in the runner. Named credentials are separate data. Step, time and repetition limits bound execution.",
);
await waitUntil(220);
await caption(
  "REPORTS\nPASS / FAIL / BLOCKED, JSON action log, screenshot and trace. Raw traces and videos stay local because they can contain credentials.",
);
await waitUntil(240);
await page.setContent(
  '<style>body{background:#101b30;color:#eef6ff;font:24px/1.7 system-ui;padding:55px}h1{color:#56cdb8}code{color:#a5d8ff}</style><h1>Setup, evidence and limitations</h1><p>Task 1: .NET 8 SDK + Chrome → <code>dotnet run -- --url URL</code></p><p>Task 2: Node 22 + Chrome → <code>npm ci && npm run build</code><br>Set GEMINI_API_KEY. Then <code>npm start -- --url URL --test "..."</code></p><p>Each repository contains a README, test commands and sanitized evidence.</p>',
);
await caption(
  "04:00 · VERIFICATION\nTask 1: live page plus mutation fixtures. Task 2: scripted browser tests and separate live Gemini evidence.",
);
await waitUntil(260);
await caption(
  "LIMITATIONS\nCAPTCHA, MFA, missing data and inaccessible controls can block execution. Semantic interpretation still depends on the model.",
);
await waitUntil(280);
await caption(
  "DELIVERABLES\nTwo standalone public repositories with setup, approach, limitations and verification notes. This recording shows actual browser output.",
);
await waitUntil(300);
await writeFile(
  out + "/selenium-recording-evidence.json",
  JSON.stringify(evidence, null, 2),
);
await context.close();
const file = await video.path();
await writeFile(out + "/video-path.txt", file);
server.close();
console.log("Recording:", file);

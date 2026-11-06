import { readFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { redact } from "./actions.js";
import { run } from "./runner.js";
try {
  const { values: v } = parseArgs({
    options: {
      url: { type: "string" },
      test: { type: "string" },
      file: { type: "string" },
      data: { type: "string" },
      headed: { type: "boolean" },
      video: { type: "boolean" },
      steps: { type: "string" },
      timeout: { type: "string" },
      out: { type: "string" },
    },
  });
  if (!v.url || (!v.test && !v.file))
    throw Error(
      'Usage: npm start -- --url URL --test "English test" [--data credentials.local.json] [--headed]',
    );
  if (!/^https?:\/\//.test(v.url)) throw Error("URL must be HTTP(S)");
  const data = v.data ? JSON.parse(await readFile(v.data, "utf8")) : {};
  if (!data || Array.isArray(data) || typeof data !== "object")
    throw Error("Named data must be an object");
  if (Object.values(data).some((x) => typeof x !== "string"))
    throw Error("Named data must be string values");
  for (const n of [Number(v.steps || 40), Number(v.timeout || 120000)])
    if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n))
      throw Error("Limits must be positive integers");
  const result = await run({
    url: v.url,
    test: v.test || (await readFile(v.file!, "utf8")),
    data,
    headed: v.headed,
    video: v.video,
    steps: Number(v.steps || 40),
    timeout: Number(v.timeout || 120000),
    out: v.out || "artifacts/" + Date.now(),
  });
  console.log(redact(result, data));
  process.exitCode =
    result.status === "PASS" ? 0 : result.status === "BLOCKED" ? 2 : 1;
} catch (e) {
  console.error(e instanceof Error ? e.message : "Invalid configuration");
  process.exitCode = 2;
}

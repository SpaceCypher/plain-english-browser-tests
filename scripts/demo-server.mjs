import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
const html = await readFile(new URL("../tests/library.html", import.meta.url));
createServer((req, res) => {
  res.setHeader("content-type", "text/html");
  res.end(html);
}).listen(4173, "127.0.0.1", () =>
  console.log("Reading Room fixture: http://127.0.0.1:4173"),
);

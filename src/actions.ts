import { z } from "zod";
const target = { target: z.number().int().nonnegative() };
export const Action = z.union([
  z.object({ type: z.literal("click"), ...target }),
  z.object({ type: z.literal("fill"), ...target, value: z.string() }),
  z.object({ type: z.literal("select"), ...target, value: z.string() }),
  z.object({ type: z.literal("check"), ...target, checked: z.boolean() }),
  z.object({ type: z.literal("press"), ...target, key: z.string() }),
  z.object({
    type: z.literal("navigate"),
    url: z
      .string()
      .url()
      .refine((x) => /^https?:/.test(x)),
  }),
  z.object({
    type: z.literal("scroll"),
    pixels: z.number().int().min(-2000).max(2000),
  }),
  z.object({ type: z.literal("tab"), index: z.number().int().nonnegative() }),
  z.object({
    type: z.literal("assert"),
    kind: z.literal("url"),
    target: z.number().int().nonnegative().optional(),
    expected: z.string().min(1),
  }),
  z.object({
    type: z.literal("assert"),
    kind: z.enum(["visible", "text", "value"]),
    ...target,
    expected: z.string().min(1),
  }),
  z.object({ type: z.literal("done") }),
  z.object({ type: z.literal("blocked"), reason: z.string().min(1) }),
]);
export type ActionType = z.infer<typeof Action>;
export function redact(value: unknown, data: Record<string, string>) {
  let s = JSON.stringify(value);
  for (const v of Object.values(data).sort((a, b) => b.length - a.length))
    if (v) s = s.split(JSON.stringify(v).slice(1, -1)).join("[REDACTED]");
  return s;
}

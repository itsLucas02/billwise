import { parsePrefs, recommend } from "@/lib/recommend";
import { jsonError, readJson } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const prefs = parsePrefs(await readJson(req));
  return prefs ? Response.json(recommend(prefs)) : jsonError("Pick home fibre or mobile and a budget first.");
}

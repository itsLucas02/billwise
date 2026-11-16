import { parsePrefs, recommend } from "@/lib/recommend";
import { readJson } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return Response.json(recommend(parsePrefs(await readJson(req))));
}

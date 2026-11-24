const MAX_BYTES = 2_000_000;

function json(data, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}

export async function onRequest({ request, env }) {
  if (!env.STUDIO_KEY || !env.DB) return json({ error: "not_configured" }, 503);
  if (!["GET", "PUT"].includes(request.method)) return json({ error: "method" }, 405);
  const origin = request.headers.get("Origin");
  if (origin && origin !== new URL(request.url).origin) return json({ error: "origin" }, 403);
  if (request.headers.get("Authorization") !== "Bearer " + env.STUDIO_KEY) return json({ error: "unauthorized" }, 401);
  if (request.method === "GET") {
    const row = await env.DB.prepare("SELECT revision, payload FROM studio WHERE id = 1").first();
    return json(row ? { revision: row.revision, data: JSON.parse(row.payload) } : { revision: 0, data: null });
  }
  if (!request.headers.get("Content-Type")?.startsWith("application/json")) return json({ error: "content_type" }, 415);
  if (Number(request.headers.get("Content-Length")) > MAX_BYTES) return json({ error: "size" }, 413);
  const bytes = await request.arrayBuffer();
  if (bytes.byteLength > MAX_BYTES) return json({ error: "size" }, 413);
  let body;
  try { body = JSON.parse(new TextDecoder().decode(bytes)); } catch { return json({ error: "invalid_json" }, 400); }
  const revision = body?.revision;
  const data = body?.data;
  if (!Number.isSafeInteger(revision) || revision < 0 || !data ||
      !["posts","ideas","contacts","reminders"].every(k => Array.isArray(data[k])) ||
      !data.checks || typeof data.checks !== "object") return json({ error: "invalid_data" }, 400);
  const payload = JSON.stringify(data);
  const result = revision === 0
    ? await env.DB.prepare("INSERT OR IGNORE INTO studio (id, revision, payload) VALUES (1, 1, ?)").bind(payload).run()
    : await env.DB.prepare("UPDATE studio SET revision=revision+1, payload=? WHERE id=1 AND revision=?").bind(payload, revision).run();
  if (result.meta.changes !== 1) return json({ error: "conflict" }, 409);
  return json({ revision: revision + 1 });
}

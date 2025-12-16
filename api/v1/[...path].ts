import type { VercelRequest, VercelResponse } from "@vercel/node";
const GATEWAY_API_BASE_URL = process.env.GATEWAY_API_BASE_URL;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!GATEWAY_API_BASE_URL) {
    res.status(500).json({
      message: "GATEWAY_API_BASE_URL environment variable is not set",
    });
    return;
  }

  try {
    const pathAfterApi = req.url?.replace(/^\/api\/v1/, "") || "";
    const targetUrl = `${GATEWAY_API_BASE_URL}/api/v1${pathAfterApi}`;
    console.log("req.query.path:", req.query.path);
    console.log("req.url:", req.url);
    console.log("targetUrl:", targetUrl);
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (value == null) continue;
      if (key.toLowerCase() === "host") continue;
      headers[key] = Array.isArray(value) ? value.join(",") : value.toString();
    }

    let body: BodyInit | undefined;
    if (req.method && !["GET", "HEAD"].includes(req.method)) {
      if (req.body) {
        if (typeof req.body === "string" || req.body instanceof Buffer) {
          body = req.body as any;
        } else {
          body = JSON.stringify(req.body);
          if (!headers["content-type"]) {
            headers["content-type"] = "application/json";
          }
        }
      }
    }

    const upstreamResponse = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
    });

    res.status(upstreamResponse.status);

    upstreamResponse.headers.forEach((value, key) => {
      if (key.toLowerCase() === "transfer-encoding") return;
      res.setHeader(key, value);
    });

    const buffer = Buffer.from(await upstreamResponse.arrayBuffer());
    res.send(buffer);
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(502).json({ message: "Bad gateway", error: String(error) });
  }
}

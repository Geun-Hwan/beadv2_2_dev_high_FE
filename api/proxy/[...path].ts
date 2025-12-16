/**
 * Vercel 서버리스 프록시
 *
 * - 클라이언트는 항상 /api/v1/... 으로 호출
 * - Vercel rewrites가 /api/v1/* -> /api/proxy/* 로 연결
 * - 이 함수는 GATEWAY_API_BASE_URL 환경변수를 읽어서 실제 게이트웨이로 포워딩
 */

const GATEWAY_API_BASE_URL = process.env.GATEWAY_API_BASE_URL;

export default async function handler(req: any, res: any) {
  if (!GATEWAY_API_BASE_URL) {
    res
      .status(500)
      .json({ message: "GATEWAY_API_BASE_URL environment variable is not set" });
    return;
  }

  try {
    const { path } = req.query;
    const pathSuffix = Array.isArray(path) ? path.join("/") : path || "";

    const base = GATEWAY_API_BASE_URL.replace(/\/$/, "");
    const targetPath = pathSuffix ? `${base}/${pathSuffix}` : base;

    const originalUrl = req.url || "";
    const queryIndex = originalUrl.indexOf("?");
    const queryString = queryIndex >= 0 ? originalUrl.substring(queryIndex) : "";

    const targetUrl = `${targetPath}${queryString}`;

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

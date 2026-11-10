// A small Worker in front of the site's pages (from the PMUX course tools).
// It answers "Accept: text/markdown" with the page's Markdown copy, and adds Link headers that
// point visiting agents to llms.txt and to the Markdown copy. Everything else is the site as is.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const wantsMarkdown = (request.headers.get("Accept") || "").includes("text/markdown");
    const path = url.pathname.endsWith("/") ? url.pathname + "index" : url.pathname.replace(/\.html$/, "");
    const mdPath = path.endsWith(".md") ? path : path + ".md";

    if (wantsMarkdown && !url.pathname.endsWith(".md")) {
      const md = await env.ASSETS.fetch(new Request(new URL(mdPath, url), request));
      if (md.ok) {
        const headers = new Headers(md.headers);
        headers.set("Content-Type", "text/markdown; charset=utf-8");
        headers.set("Vary", "Accept");
        headers.set("Link", '</llms.txt>; rel="describedby"; type="text/plain"');
        return new Response(md.body, { status: 200, headers });
      }
    }

    const response = await env.ASSETS.fetch(request);
    const type = response.headers.get("Content-Type") || "";
    if (!type.includes("text/html")) return response;
    const headers = new Headers(response.headers);
    headers.set("Vary", "Accept");
    headers.append("Link", '</llms.txt>; rel="describedby"; type="text/plain"');
    headers.append("Link", `<${mdPath}>; rel="alternate"; type="text/markdown"`);
    return new Response(response.body, { status: response.status, headers });
  }
};

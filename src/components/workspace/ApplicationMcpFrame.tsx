import { useEffect, useRef, useState } from "react";
import { AppBridge, PostMessageTransport } from "@modelcontextprotocol/ext-apps/app-bridge";
import { api } from "@/services/api/client";
import type { ApplicationSurface } from "@/services/api/application-types";
import { ErrorNotice } from "./shared";

/** Resource is loaded over real MCP stdio; the frame has an opaque origin. */
export function ApplicationMcpFrame({
  id,
  data,
  onReview,
}: {
  id: string;
  data: ApplicationSurface;
  onReview: () => void;
}) {
  const [html, setHtml] = useState("");
  const [error, setError] = useState<unknown>();
  const [connected, setConnected] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const bridge = useRef<AppBridge | null>(null);
  const latest = useRef(data);
  latest.current = data;
  const onChange = useRef(onReview);
  onChange.current = onReview;
  useEffect(() => {
    const controller = new AbortController();
    void api
      .applicationResource(id, controller.signal)
      .then((r) => {
        if (!r.mime_type.startsWith("text/html;profile=mcp-app"))
          throw new Error("Unsupported MCP interface resource.");
        if (!/<head[\s>]/i.test(r.html))
          throw new Error("MCP interface cannot be isolated safely. Use the local review form.");
        // Enforce network/navigation isolation even for an operator-installed app.
        const csp = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'; frame-src 'none'">`;
        setHtml(r.html.replace(/<head[^>]*>/i, (head) => head + csp));
      })
      .catch((e: unknown) => {
        if (!controller.signal.aborted) setError(e);
      });
    return () => {
      controller.abort();
      void bridge.current?.close();
      bridge.current = null;
    };
  }, [id]);
  const encoded = JSON.stringify(data);
  useEffect(() => {
    if (connected)
      void bridge.current
        ?.notification({
          method: "ui/notifications/tool-result",
          params: { content: [{ type: "text", text: encoded }] },
        })
        .catch(setError);
  }, [encoded, connected]);
  async function connect() {
    if (!frame.current?.contentWindow || bridge.current) return;
    const app = new AppBridge(
      null,
      { name: "ascendra-application-host", version: "1.0.0" },
      { serverTools: {}, sandbox: { permissions: {} } },
      { hostContext: { theme: "dark", displayMode: "inline", availableDisplayModes: ["inline"] } },
    );
    bridge.current = app;
    app.oncalltool = async (params) => {
      const name = params.name;
      if (name !== "application_state" && name !== "review_application")
        return {
          content: [
            { type: "text" as const, text: "Tool not permitted. Use host approval controls." },
          ],
          isError: true,
        };
      const args = params.arguments ?? {};
      try {
        const result = await api.applicationTool(id, {
          name,
          expected_revision: Number(args["expected_revision"]),
          fields: args["fields"] as Parameters<typeof api.applicationTool>[1]["fields"],
        });
        if (name === "review_application") onChange.current();
        return result;
      } catch (e) {
        return {
          content: [
            {
              type: "text" as const,
              text: e instanceof Error ? e.message : "Application review could not be saved.",
            },
          ],
          isError: true,
        };
      }
    };
    try {
      await app.connect(
        new PostMessageTransport(frame.current.contentWindow, frame.current.contentWindow),
      );
      setConnected(true);
      await app.notification({
        method: "ui/notifications/tool-result",
        params: { content: [{ type: "text", text: JSON.stringify(latest.current) }] },
      });
    } catch (e) {
      setError(e);
    }
  }
  return (
    <div className="mt-5 min-w-0">
      {error ? (
        <ErrorNotice error={error} />
      ) : (
        <p className="mb-3 text-xs text-muted-foreground" role="status">
          {connected ? "MCP app connected · local review only" : "Connecting to MCP app…"}
        </p>
      )}
      {html && (
        <iframe
          ref={frame}
          title="Application MCP review app"
          srcDoc={html}
          sandbox="allow-scripts"
          referrerPolicy="no-referrer"
          className="h-[650px] w-full rounded-xl border border-border"
          onLoad={() => void connect()}
        />
      )}
    </div>
  );
}

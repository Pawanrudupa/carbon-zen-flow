import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const root = document.getElementById("root")!;

// Last-resort handler: if the module graph can't resolve (e.g. a chunk 404s),
// React never mounts and the ErrorBoundary never renders.  This catches that
// scenario and shows a recoverable message directly in the DOM.
function showChunkErrorFallback() {
  if (root.children.length === 0) {
    root.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0a0a;color:#e0e0e0;font-family:system-ui,sans-serif;padding:2rem;text-align:center">
        <div>
          <h1 style="font-size:1.5rem;margin-bottom:0.5rem">Something went wrong</h1>
          <p style="color:#999;margin-bottom:1.5rem;font-size:0.875rem">A new version of this app is available, or a network error occurred.</p>
          <button onclick="window.location.reload()" style="padding:0.625rem 1.5rem;border-radius:0.5rem;background:#22c55e;color:#fff;border:none;cursor:pointer;font-weight:600">Reload</button>
        </div>
      </div>`;
  }
}

// Chunk-load-specific error phrases emitted by Vite / Rollup / Webpack.
// Intentionally narrow — we do NOT want to match unrelated errors from
// browser extensions, analytics scripts, or minor application bugs.
const CHUNK_ERROR_RE =
  /Failed to fetch dynamically imported module|Loading chunk|Loading CSS chunk|ChunkLoadError|importing a module script/i;

// Resource-error events (e.g. <script> 404) don't bubble, so we must
// listen in the capture phase.
window.addEventListener(
  "error",
  (event) => {
    if (event.target instanceof HTMLScriptElement) {
      showChunkErrorFallback();
    }
  },
  true, // capture phase — required for resource errors
);

window.addEventListener("unhandledrejection", (event) => {
  const msg = event.reason?.message ?? "";
  const name = event.reason?.name ?? "";
  if (CHUNK_ERROR_RE.test(msg) || name === "ChunkLoadError") {
    showChunkErrorFallback();
  }
});

createRoot(root).render(<App />);

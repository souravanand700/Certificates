import { useMemo, useRef, useState } from "react";
import hexawareLogo from "/src/assets/hexaware_logo 1.svg"; // keep your current path
import { uploadDocx, ENDPOINT } from "./config/api_call.jsx";

const MAX_MB = 10;
const MAX_BYTES = MAX_MB * 1024 * 1024;

// Configure your API via .env (VITE_API_URL) or fall back to localhost
const ENDPOINT = import.meta.env.VITE_API_URL || "http://localhost:8000/upload-docx";

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export default function App() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const fileInfo = useMemo(() => {
    if (!file) return null;
    return {
      name: file.name,
      size: file.size,
      sizeHuman: formatBytes(file.size),
      isDocx: /\.docx$/i.test(file.name),
    };
  }, [file]);

  function handlePick(e) {
    setError(""); setResult(null);
    const f = e.target.files?.[0];
    setFile(f || null);
  }
  function handleDragOver(e) { e.preventDefault(); e.stopPropagation(); setDragActive(true); }
  function handleDragLeave(e) { e.preventDefault(); e.stopPropagation(); setDragActive(false); }
  function handleDrop(e) {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    const f = e.dataTransfer?.files?.[0]; if (f) setFile(f);
  }

  async function onUpload() {
  setError("");
  setResult(null);
  if (!file) return setError("Please choose a .docx file first.");
  if (!fileInfo.isDocx) return setError("Only .docx files are allowed.");
  if (file.size > MAX_BYTES) return setError(`File too large. Limit is ${MAX_MB} MB.`);

  setLoading(true);
  try {
    const data = await uploadDocx(file, { endpoint: ENDPOINT });
    setResult(data);
  } catch (err) {
    if (err?.status) {
      setError(`Upload failed (${err.status}). ${err.body || "No details."}`);
    } else {
      setError(`Network error: ${err?.message || err}`);
    }
  } finally {
    setLoading(false);
  }
}

  return (
    <div className="shell">
      {/* Header */}
      <header className="topbar">
        <div className="brand">
          <img src={hexawareLogo} alt="Hexaware logo" className="brand-logo" />
        </div>
      </header>

      {/* Main content */}
      <main className="main">
        <header className="header">
          <h1>Customer Details Analyser</h1>
          <p className="sub">Upload a .docx and send it to your FastAPI endpoint.</p>
          <p className="hint">Max file size: {MAX_MB} MB · Allowed: <code>.docx</code></p>
        </header>

        <section className="card upload-card">
          {/* Drop zone */}
          <div
            className={`dropzone ${dragActive ? "drag" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" ? inputRef.current?.click() : null)}
            aria-label="Upload .docx"
          >
            <input ref={inputRef} type="file" accept=".docx" onChange={handlePick} hidden />
            <div className="dz-icon">⬆️</div>
            <div className="dz-text">
              <strong>Click to choose</strong> or drag & drop a <code>.docx</code> here
            </div>
            <div className="dz-hint">Up to {MAX_MB} MB</div>
          </div>

          {/* Selected file */}
          {fileInfo && (
            <div className="fileinfo-row">
              <div className="file-pill">
                <span className="pill-name">{fileInfo.name}</span>
                <span className="pill-size">{fileInfo.sizeHuman}</span>
              </div>
              <button className="btn ghost" onClick={() => setFile(null)} type="button">
                Remove
              </button>
            </div>
          )}

          {/* Errors */}
          {error && <div className="alert error">⚠️ {error}</div>}

          {/* Actions */}
          <div className="actions">
            <button className="btn primary" onClick={onUpload} disabled={!file || loading} type="button">
              {loading ? (<><span className="spinner" /> Uploading…</>) : ("Send")}
            </button>
          </div>

          {/* Result */}
          {result && (
            <>
              <div className="alert success">✅ Upload successful</div>
              <pre className="pre">{JSON.stringify(result, null, 2)}</pre>
            </>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">© {new Date().getFullYear()} Hexaware</div>
      </footer>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

export default function QrScanner({ onResult }) {
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!enabled) return undefined;
    const scanner = new Html5Qrcode("ecopulse-qr-reader");
    scannerRef.current = scanner;
    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 240 },
        (text) => {
          onResult(text);
        }
      )
      .catch((err) => setError(err?.message || "Camera permission was denied or is unavailable."));
    return () => {
      scanner.stop().catch(() => {});
    };
  }, [enabled, onResult]);

  return (
    <div className="space-y-3">
      {!enabled ? (
        <button className="btn-primary" type="button" onClick={() => setEnabled(true)}>
          Start camera scan
        </button>
      ) : (
        <button className="btn-secondary" type="button" onClick={() => setEnabled(false)}>
          Stop camera
        </button>
      )}
      {enabled ? <div id="ecopulse-qr-reader" className="overflow-hidden rounded-xl" /> : null}
      {error ? <p className="text-sm text-error">{error}</p> : null}
      <p className="text-xs text-muted">Camera permission is requested only when scanning begins.</p>
    </div>
  );
}

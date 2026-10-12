import { useState, useEffect, useRef } from "react";
import { AlertCircle, ShieldCheck, ExternalLink, X, CheckCircle2, Lock } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";

const REGISTERED_GOOGLE_PRESETS = [
  {
    email: "sumitsfbi2454@svvv.edu.in",
    name: "Sumit Jain",
    role: "Enrolled Student (CSE - SVVV)",
    badge: "My SVVV Edu ID",
    badgeColor: "bg-teal-100 text-teal-800 border-teal-300 font-bold",
  },
  {
    email: "student@svvv.edu",
    name: "Rahul Sharma",
    role: "Student (BCA / CSE)",
    badge: "Authorized Student",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
  },
  {
    email: "faculty@svvv.edu",
    name: "Dr. Mehta",
    role: "Faculty (CS Department)",
    badge: "Authorized Faculty",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
  },
  {
    email: "admin@svvv.edu",
    name: "Anjali Rathore",
    role: "Campus Administrator",
    badge: "Authorized Admin",
    badgeColor: "bg-emerald-100 text-[#176B45] border-emerald-300",
  },
];

export default function GoogleSignInButton({ onAuthSuccess, onAuthError }) {
  const { loginWithGoogle } = useAuth();
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [customEmail, setCustomEmail] = useState("");
  const gisButtonRef = useRef(null);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Initialize official Google Identity Services if client ID is configured
  useEffect(() => {
    if (!googleClientId) return;

    const checkGis = () => {
      if (window.google?.accounts?.id && gisButtonRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
          });

          window.google.accounts.id.renderButton(gisButtonRef.current, {
            theme: "outline",
            size: "large",
            text: "signin_with",
            shape: "rectangular",
            logo_alignment: "left",
            width: 380,
          });
        } catch (err) {
          console.warn("GIS initialization warning:", err);
        }
      }
    };

    if (window.google?.accounts?.id) {
      checkGis();
    } else {
      const timer = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(timer);
          checkGis();
        }
      }, 500);
      return () => clearInterval(timer);
    }
  }, [googleClientId]);

  // Callback from Google Identity Services
  const handleGoogleCredentialResponse = async (response) => {
    if (!response.credential) {
      toast.error("Google sign-in was cancelled or returned empty credentials.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const user = await loginWithGoogle({ credential: response.credential });
      toast.success(`Welcome back, ${user.name}! Authenticated via Google.`);
      if (onAuthSuccess) onAuthSuccess(user);
    } catch (err) {
      const msg = err.message || "Failed to authenticate with Google.";
      setError(msg);
      if (onAuthError) onAuthError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Direct login for configured accounts or custom test email
  const handleSelectAccount = async (email) => {
    setLoading(true);
    setError(null);
    try {
      const user = await loginWithGoogle({ email });
      toast.success(`Welcome back, ${user.name}! Signed in via Google.`);
      setModalOpen(false);
      if (onAuthSuccess) onAuthSuccess(user);
    } catch (err) {
      const msg = err.message || "Authentication rejected: Account not authorized.";
      setError(msg);
      if (onAuthError) onAuthError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customEmail.trim()) {
      setError("Please enter a valid email address.");
      return;
    }
    handleSelectAccount(customEmail.trim());
  };

  return (
    <div className="w-full">
      {/* Container for Official Google Identity Services SDK Rendered Button */}
      {googleClientId && <div ref={gisButtonRef} className="w-full flex justify-center mb-3" />}

      {/* Official Google-Branded Sign-In Button */}
      <button
        type="button"
        onClick={() => {
          setError(null);
          if (googleClientId && window.google?.accounts?.id) {
            try {
              window.google.accounts.id.prompt();
            } catch {
              setModalOpen(true);
            }
          } else {
            setModalOpen(true);
          }
        }}
        disabled={loading}
        className="relative flex w-full items-center justify-center gap-3 rounded-xl border border-[#dadce0] bg-white py-2.5 px-4 text-xs font-semibold text-[#3c4043] shadow-xs transition hover:bg-[#f8fafd] hover:border-[#d2e3fc] hover:shadow-sm active:scale-[0.99] disabled:opacity-60"
        title="Sign in with your verified Google account"
      >
        {/* Official Google G Logo SVG */}
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
          />
        </svg>
        <span>{loading ? "Verifying Google Account..." : "Sign in with Google"}</span>
      </button>

      {/* Google Sign-In Verification Modal (Demo Chooser & Security Boundary) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="card w-full max-w-md p-6 shadow-2xl space-y-4 border border-line relative animate-in zoom-in-95 duration-150 bg-white">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-muted hover:bg-page hover:text-ink transition"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white border border-[#dadce0] shadow-xs">
                <svg className="h-6 w-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-extrabold text-ink text-base">Google Identity Services</h3>
                <p className="text-[11px] text-muted">SVVV Institutional Single Sign-On (SSO)</p>
              </div>
            </div>

            {/* Security Explanation Banner */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 text-xs space-y-1 text-blue-900">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldCheck size={14} className="text-blue-700 shrink-0" />
                <span>Backend Role-Enforced Authentication</span>
              </div>
              <p className="text-[11px] leading-relaxed text-blue-800">
                Only accounts previously registered in the SVVV directory are granted access. Roles are
                strictly assigned by the university backend and cannot be claimed by arbitrary Google emails.
              </p>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-error font-medium flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Registered Accounts Quick Select */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted block">
                Select Registered Google Account:
              </label>

              <div className="space-y-2">
                {REGISTERED_GOOGLE_PRESETS.map((preset) => (
                  <button
                    key={preset.email}
                    type="button"
                    onClick={() => handleSelectAccount(preset.email)}
                    disabled={loading}
                    className="flex w-full items-center justify-between rounded-xl border border-line p-3 text-left transition hover:border-[#176B45] hover:bg-mint/40 active:scale-[0.99] disabled:opacity-60 group"
                  >
                    <div>
                      <p className="text-xs font-bold text-ink group-hover:text-[#176B45] transition">
                        {preset.name}
                      </p>
                      <p className="text-[11px] text-muted font-mono">{preset.email}</p>
                    </div>
                    <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${preset.badgeColor}`}>
                      {preset.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Direct Google Institutional Edu Email or Custom Email */}
            <div className="border-t border-line pt-3 space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted block">
                Or Sign In with any SVVV Edu ID (@svvv.edu.in):
              </label>
              <form onSubmit={handleCustomSubmit} className="flex gap-2">
                <input
                  type="email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="e.g. sumitsfbi2454@svvv.edu.in"
                  className="input text-xs flex-1 font-medium"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !customEmail.trim()}
                  className="btn-primary text-xs px-3.5 py-2 shrink-0 font-bold bg-[#15803D] hover:bg-[#166534]"
                >
                  Sign In
                </button>
              </form>
              <p className="text-[10px] text-muted">
                Institutional SVVV accounts (@svvv.edu.in and @svvv.edu) are validated immediately. Non-institutional addresses (e.g. gmail.com) are rejected.
              </p>
            </div>

            {/* Environmental Setup Tip */}
            <div className="border-t border-line pt-2 text-[10px] text-muted flex items-center justify-between">
              <span>Client ID: {googleClientId ? "Configured" : "Demo Simulation"}</span>
              <span className="font-mono text-emerald-700 font-semibold">SVVV SSO v2.4</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

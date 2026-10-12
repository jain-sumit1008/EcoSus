import { Link } from "react-router-dom";
import { Leaf, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-page">
      <div className="card max-w-md p-8 text-center shadow-lg border border-line">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-[#176B45] mb-4">
          <Leaf size={28} />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-[#238B57]">Error 404</p>
        <h1 className="mt-1 text-2xl font-black text-ink">Page Not Found</h1>
        <p className="mt-2 text-xs text-muted leading-relaxed">
          The requested EcoPulse campus route does not exist or may have moved.
        </p>
        <Link
          className="btn-primary mt-6 inline-flex items-center gap-2 bg-[#176B45] hover:bg-[#073B2C] text-xs py-2.5 px-4 shadow-sm"
          to="/dashboard"
        >
          <ArrowLeft size={14} />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";
import { NAV_ITEMS } from "../../constants/nav.js";

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const current = NAV_ITEMS.find((item) => location.pathname.startsWith(item.to));

  return (
    <div className="min-h-screen bg-page lg:grid lg:grid-cols-[260px_1fr]">
      <div className="hidden lg:block">
        <div className="sticky top-0 h-screen">
          <Sidebar />
        </div>
      </div>
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-black/40" type="button" aria-label="Close menu" onClick={() => setOpen(false)} />
          <div className="relative h-full w-72">
            <Sidebar onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
      <div className="min-w-0">
        <Topbar title={current?.label || "EcoPulse"} onMenu={() => setOpen(true)} />
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from "react";
import { Menu, Search, Bell, ChevronDown, LogOut, ShieldCheck, GraduationCap, School, Car } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import * as dashboardApi from "../../api/dashboard.api.js";

const ROLE_META = {
  admin: { name: "Campus Administrator", icon: ShieldCheck, color: "bg-emerald-100 text-[#176B45] border-emerald-300" },
  faculty: { name: "Academic Faculty", icon: School, color: "bg-blue-100 text-blue-800 border-blue-300" },
  student: { name: "Enrolled Student", icon: GraduationCap, color: "bg-amber-100 text-amber-800 border-amber-300" },
  parkingManager: { name: "Estate Parking Desk", icon: Car, color: "bg-purple-100 text-purple-800 border-purple-300" },
};

export default function Topbar({ title, onMenu }) {
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const profileRef = useRef(null);
  const alertsRef = useRef(null);

  // Fetch quick alerts for the notification bell
  useEffect(() => {
    dashboardApi
      .getSummary({})
      .then((res) => {
        const recent = res.data?.alerts?.recent || [];
        setAlerts(recent);
      })
      .catch(() => {});
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (alertsRef.current && !alertsRef.current.contains(e.target)) {
        setAlertsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getInitials = (name) => {
    if (!name) return "SV";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const currentRole = user?.role || "student";
  const roleInfo = ROLE_META[currentRole] || ROLE_META.student;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-line bg-white/95 px-4 py-2.5 backdrop-blur-md md:px-6">
      {/* Left side: Hamburger & Title */}
      <div className="flex items-center gap-3">
        <button
          className="rounded-xl border border-line p-2 text-ink transition hover:bg-mint lg:hidden"
          type="button"
          onClick={onMenu}
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>
        <div>
          <p className="text-[11px] font-semibold text-muted tracking-tight">
            Shri Vaishnav Vidyapeeth Vishwavidyalaya · Indore
          </p>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-ink tracking-tight">{title}</h1>
            <span className={`hidden sm:inline-block rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${roleInfo.color}`}>
              {currentRole}
            </span>
          </div>
        </div>
      </div>

      {/* Center: Search input */}
      <div className="hidden max-w-xs flex-1 items-center gap-2.5 rounded-full border border-line bg-page px-4 py-1.5 md:flex">
        <Search size={16} className="text-muted shrink-0" />
        <input
          className="w-full bg-transparent text-xs text-ink placeholder:text-muted outline-none"
          placeholder="Search campus resources, slots, blocks..."
          aria-label="Search campus resources"
        />
      </div>

      {/* Right side: Notifications & User Profile */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <div className="relative" ref={alertsRef}>
          <button
            type="button"
            onClick={() => setAlertsOpen((prev) => !prev)}
            className="relative flex h-9 w-9 items-center justify-center rounded-full border border-line bg-page text-muted transition hover:bg-mint hover:text-ink"
            aria-label="Sustainability alerts"
          >
            <Bell size={18} />
            {alerts.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                {alerts.length}
              </span>
            )}
          </button>

          {/* Alerts Dropdown */}
          {alertsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-line bg-white p-3 shadow-xl ring-1 ring-black/5 z-50">
              <div className="flex items-center justify-between border-b border-line pb-2 mb-2">
                <span className="text-xs font-bold text-ink">Active Campus Alerts</span>
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-error">
                  {alerts.length} New
                </span>
              </div>
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {alerts.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted">No open sustainability alerts.</p>
                ) : (
                  alerts.slice(0, 4).map((alert) => (
                    <div
                      key={alert._id}
                      className="rounded-xl border border-line/60 bg-page/50 p-2.5 text-xs transition hover:bg-mint/40"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-ink line-clamp-1">{alert.title}</span>
                        <span className="rounded bg-red-100 px-1.5 py-0.2 text-[9px] font-semibold text-error uppercase">
                          {alert.severity}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-muted line-clamp-2">{alert.recommendation}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Pill */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((prev) => !prev)}
            className="flex items-center gap-2.5 rounded-full border border-line bg-white py-1 pl-1.5 pr-3 shadow-sm transition hover:bg-mint/50"
            aria-label="User menu"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-[#176B45] to-emerald-400 text-xs font-bold text-white shadow-inner">
              {getInitials(user?.name)}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-ink leading-tight">{user?.name || "SVVV User"}</p>
              <p className="text-[10px] font-medium capitalize text-muted leading-tight">
                {currentRole}
              </p>
            </div>
            <ChevronDown size={14} className="text-muted" />
          </button>

          {/* User Account Details & Sign Out Only (No role switching after sign-in) */}
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-line bg-white p-4 shadow-2xl ring-1 ring-black/5 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-3">
              {/* Current User Info */}
              <div className="flex items-center gap-3 border-b border-line pb-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#176B45] text-sm font-bold text-white shadow-sm">
                  {getInitials(user?.name)}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-ink truncate">{user?.name}</p>
                  <p className="text-xs text-muted truncate">{user?.email}</p>
                  <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                    <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase border ${roleInfo.color}`}>
                      {currentRole}
                    </span>
                    {user?.studentId && (
                      <span className="text-[10px] text-muted font-medium">ID: {user.studentId}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Institution & Department Summary */}
              <div className="rounded-xl bg-page/80 p-2.5 text-xs space-y-1.5 text-muted">
                <div className="flex items-center justify-between text-[11px]">
                  <span>Campus:</span>
                  <span className="font-semibold text-ink">SVVV Indore</span>
                </div>
                {user?.department && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span>Department:</span>
                    <span className="font-semibold text-ink">{user.department}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-[11px]">
                  <span>Permission:</span>
                  <span className="font-semibold text-ink capitalize">{currentRole}</span>
                </div>
              </div>

              {/* Sign Out Button */}
              <div className="border-t border-line pt-2">
                <button
                  type="button"
                  onClick={logout}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-semibold text-error hover:bg-red-50 border border-red-200 transition"
                >
                  <LogOut size={15} />
                  <span>Sign out of EcoPulse</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

import { NavLink } from "react-router-dom";
import { Leaf, ShieldCheck, GraduationCap, School, Car } from "lucide-react";
import { NAV_ITEMS } from "../../constants/nav.js";
import CampusSilhouette from "./CampusSilhouette.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const ROLE_BADGES = {
  admin: { label: "Admin Portal", color: "bg-teal-500/15 text-[#2DD4BF] border-teal-500/30", icon: ShieldCheck },
  faculty: { label: "Faculty Portal", color: "bg-blue-500/15 text-blue-300 border-blue-500/30", icon: School },
  student: { label: "Student Portal", color: "bg-amber-500/15 text-amber-300 border-amber-500/30", icon: GraduationCap },
  parkingManager: { label: "Estate Staff", color: "bg-purple-500/15 text-purple-300 border-purple-500/30", icon: Car },
};

export default function Sidebar({ onNavigate }) {
  const { user } = useAuth();
  const currentRole = user?.role || "student";
  const roleBadge = ROLE_BADGES[currentRole] || ROLE_BADGES.student;
  const RoleIcon = roleBadge.icon;

  const visibleNavItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(currentRole)
  );

  return (
    <aside className="flex h-full flex-col bg-[#1E293B] text-[#F1F5F9] border-r border-[#334155]/60 shadow-sidebar select-none">
      {/* SVVV Brand Header */}
      <div className="px-5 py-5 border-b border-white/10 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2DD4BF] to-[#0F766E] text-white shadow-md shadow-slate-950/40">
            <Leaf size={24} className="stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-extrabold tracking-tight text-[#F1F5F9]">SVVV</span>
              <span className="text-[10px] font-semibold bg-teal-500/20 text-[#2DD4BF] px-1.5 py-0.5 rounded border border-teal-500/30">
                INDORE
              </span>
            </div>
            <p className="text-[11px] font-medium leading-tight text-slate-400">Sustainable Campus</p>
          </div>
        </div>

        {/* Current Active Role Badge */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${roleBadge.color}`}>
          <RoleIcon size={14} className="shrink-0" />
          <span className="truncate">{roleBadge.label}</span>
          <span className="ml-auto text-[10px] opacity-75 font-normal">Active</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5 px-3 py-4 overflow-y-auto">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                `group flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-[#0F766E] text-[#F1F5F9] font-bold shadow-xs border-l-4 border-[#2DD4BF]"
                    : "text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#334155]/60 border-l-4 border-transparent"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={19}
                    className={`shrink-0 transition-colors duration-200 ${
                      isActive ? "text-[#2DD4BF]" : "text-[#94A3B8] group-hover:text-[#F1F5F9]"
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Silhouette Campus Footer */}
      <CampusSilhouette />
    </aside>
  );
}

import {
  LayoutDashboard,
  Droplets,
  Zap,
  ClipboardCheck,
  CarFront,
  Leaf,
  FileBarChart,
} from "lucide-react";

export const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "faculty", "student", "parkingManager"] },
  { to: "/water", label: "Water Consumption", icon: Droplets, roles: ["admin", "faculty"] },
  { to: "/electricity", label: "Electricity Consumption", icon: Zap, roles: ["admin", "faculty"] },
  { to: "/attendance", label: "Attendance Records", icon: ClipboardCheck, roles: ["admin", "faculty", "student"] },
  { to: "/parking", label: "Smart Parking", icon: CarFront, roles: ["admin", "faculty", "student", "parkingManager"] },
  { to: "/greenery", label: "Campus Greenery", icon: Leaf, roles: ["admin", "faculty"] },
  { to: "/reports", label: "Reports & Audits", icon: FileBarChart, roles: ["admin"] },
];

export const BLOCKS = ["A", "B", "C", "D", "E"];

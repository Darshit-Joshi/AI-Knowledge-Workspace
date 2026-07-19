import React from "react";
import { NavLink } from "react-router-dom";
import {
  FolderIcon,
  DatabaseIcon,
  BookOpenIcon,
  BarChart2Icon,
  SettingsIcon,
  CreditCardIcon,
} from "lucide-react";

export default function GlobalSidebar() {
  const navItems = [
    { icon: <FolderIcon size={20} />, path: "/", label: "Workspaces" },
    { icon: <DatabaseIcon size={20} />, path: "/library", label: "Library" },
    { icon: <BookOpenIcon size={20} />, path: "/reports", label: "Reports" },
    {
      icon: <BarChart2Icon size={20} />,
      path: "/analytics",
      label: "Analytics",
    },
    { icon: <CreditCardIcon size={20} />, path: "/pricing", label: "Billing" },
  ];

  return (
    <aside className="flex w-16 flex-col items-center justify-between border-r border-[#152642] bg-[#0a1424] py-4 z-10 shrink-0">
      <div className="flex flex-col items-center gap-6 w-full">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-950 font-black text-lg shadow-lg shadow-cyan-500/20">
          AK
        </div>
        <nav className="flex flex-col gap-3 w-full px-2">
          {navItems.map((item, idx) => (
            <NavLink
              key={idx}
              to={item.path}
              title={item.label}
              className={({ isActive }) =>
                `flex items-center justify-center p-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-inner"
                    : "text-slate-500 hover:bg-slate-800/40 hover:text-slate-300"
                }`
              }
            >
              {item.icon}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="flex flex-col gap-3 w-full px-2">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center justify-center p-3 rounded-xl transition-all ${
              isActive
                ? "bg-cyan-500/15 text-cyan-400"
                : "text-slate-500 hover:bg-slate-800/40 hover:text-slate-300"
            }`
          }
        >
          <SettingsIcon size={20} />
        </NavLink>
      </div>
    </aside>
  );
}

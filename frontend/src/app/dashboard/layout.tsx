"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  Home, 
  MessageSquare, 
  FileText, 
  History, 
  TrendingUp, 
  Settings, 
  LogOut,
  Database
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Route protection
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-[#0a4e3e] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 text-sm font-medium animate-pulse">Verifying session...</p>
        </div>
      </div>
    );
  }

  // Sidebar Menu Items with href routing
  const menuItems = [
    { icon: Home, label: "Home", href: "/dashboard" },
    { icon: MessageSquare, label: "Ask AI", href: "#" },
    { icon: FileText, label: "My Reports", href: "/dashboard/reports" },
    { icon: History, label: "Timeline", href: "#" },
    { icon: TrendingUp, label: "Health Trends", href: "#" },
    { icon: Settings, label: "Settings", href: "#" },
  ];

  return (
    <div className="min-h-screen bg-[#f9faf7] flex flex-col md:flex-row antialiased">
      
      {/* Sidebar Layout */}
      <aside className="w-full md:w-[260px] bg-white border-r border-[#ecebe6] flex flex-col justify-between shrink-0 p-6">
        <div className="space-y-8">
          {/* Logo with Svastha leaf styling */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/dashboard")}>
            <div className="text-[#0a4e3e]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform scale-110">
                <path d="M12 2C12 2 15 7 15 10C15 11.6569 13.6569 13 12 13C10.3431 13 9 11.6569 9 10C9 7 12 2 12 2Z" fill="currentColor" opacity="0.9" />
                <path d="M12 13C12 13 17.5 13.5 19 16C20.5 18.5 19.5 21 17 21C14.5 21 12 17.5 12 17.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M12 13C12 13 6.5 13.5 5 16C3.5 18.5 4.5 21 7 21C9.5 21 12 17.5 12 17.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M12 13V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-[#0a4e3e] font-sans">
              Svastha
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <button
                  key={item.label}
                  onClick={() => item.href !== "#" && router.push(item.href)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
                    isActive 
                      ? "bg-[#eaf4f0] text-[#0a4e3e]" 
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <item.icon className={`w-4 h-4 ${isActive ? "text-[#0a4e3e] stroke-[2.5px]" : "text-slate-400"}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: Storage & User Card */}
        <div className="space-y-6 pt-6 border-t border-[#ecebe6]">
          {/* Storage Box */}
          <div className="bg-[#faf9f5] border border-[#ebeae4] rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Database className="w-3.5 h-3.5 text-[#0a4e3e]" />
              <span>Storage</span>
            </div>
            <div className="space-y-1.5">
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#0a4e3e] h-full rounded-full" style={{ width: "24%" }}></div>
              </div>
              <div className="text-[11px] font-bold text-slate-500 flex justify-between">
                <span>2.4 GB of 10 GB</span>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-200">
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || "User"} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#0a4e3e] text-white flex items-center justify-center font-bold text-sm border border-[#ecebe6]">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : "U")}
                </div>
              )}
              <div className="overflow-hidden max-w-[120px]">
                <h4 className="text-xs font-bold text-slate-800 truncate">{user.displayName || "Patient"}</h4>
                <button className="text-[10px] font-bold text-slate-400 hover:text-[#0a4e3e] block text-left">View Profile</button>
              </div>
            </div>
            <button 
              onClick={() => logout()}
              title="Logout"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>

    </div>
  );
}

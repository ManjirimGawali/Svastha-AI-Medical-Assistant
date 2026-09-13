"use client";

import React, { useEffect, useState } from "react";
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
  Database,
  Menu,
  X
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user,loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

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
    { icon: MessageSquare, label: "Ask AI", href: "/dashboard/ask-ai" },
    { icon: FileText, label: "Upload Reports", href: "/dashboard/reports" },
    { icon: History, label: "Timeline", href: "/dashboard/timeline" },
    { icon: TrendingUp, label: "Health Trends", href: "/dashboard/health-trend" },
    { icon: Settings, label: "Settings", href: "/dashboard/settings" },
  ];

  return (
    <div className="h-screen max-h-screen bg-[#f9faf7] flex flex-col md:flex-row antialiased overflow-hidden">
       
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-[#ecebe6] shrink-0 z-30 relative">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/dashboard")}>
          <img src="/logo.png" alt="Svastha Logo" className="w-7 h-7 object-contain" />
          <span className="text-xl font-extrabold tracking-tight text-[#0a4e3e] font-sans">
            Svastha
          </span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-500 hover:text-[#0a4e3e] hover:bg-[#eaf4f0] rounded-lg transition-colors">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Layout */}
      <div className={`fixed inset-y-0 left-0 z-50 w-[260px] bg-white border-r border-[#ecebe6] flex flex-col justify-between shrink-0 p-6 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:flex ${
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        
        <div className="space-y-8">
          {/* Logo with Svastha leaf styling */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/dashboard")}>
              <img src="/logo.png" alt="Svastha Logo" className="w-8 h-8 object-contain" />
              <span className="text-2xl font-extrabold tracking-tight text-[#0a4e3e] font-sans">
                Svastha
              </span>
            </div>
            
            <button 
              className="md:hidden p-2 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 overflow-y-auto max-h-[calc(100vh-250px)] md:max-h-none">
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
          {/* <div className="bg-[#faf9f5] border border-[#ebeae4] rounded-2xl p-4 space-y-2.5">
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
          </div> */}

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

      </div>

      {/* Main Workspace Panel */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto overflow-x-hidden relative">
        {children}
      </div>

    </div>
  );
}

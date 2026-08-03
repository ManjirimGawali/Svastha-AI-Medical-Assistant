"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  TrendingUp, 
  Trash2,
  Bell,
  Send,
  Settings,
  ChevronRight,
  FileSpreadsheet
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [askQuery, setAskQuery] = useState("");
  
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReports() {
      if (!user) return;
      try {
        setLoading(true);
        setError(null);
        const token = await user.getIdToken();
        const response = await fetch("http://localhost:5000/api/reports", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (!response.ok) {
          throw new Error("Failed to fetch reports");
        }
        const data = await response.json();
        setReports(data.reports || []);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load reports");
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
  }, [user]);

  if (!user) return null;

  return (
    <main className="flex-1 p-6 md:p-8 lg:p-10 overflow-y-auto max-w-7xl mx-auto w-full space-y-8">
      
      {/* Header Bar */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 flex items-center gap-2">
            Good morning, {user.displayName ? user.displayName.split(" ")[0] : "User"} <span className="animate-bounce inline-block">👋</span>
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-400 mt-1">Here's your health overview for today.</p>
        </div>

        <div className="flex items-center gap-3">
          <button className="bg-white border border-[#ecebe6] p-2.5 rounded-xl hover:bg-slate-50 text-slate-600 transition-all shadow-sm">
            <Trash2 className="w-4 h-4" />
          </button>
          <button className="bg-white border border-[#ecebe6] p-2.5 rounded-xl hover:bg-slate-50 text-slate-600 transition-all shadow-sm relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#0a4e3e] rounded-full"></span>
          </button>
          <button 
            onClick={() => router.push("/dashboard/reports")}
            className="bg-[#0a4e3e] hover:bg-[#083d31] text-white text-xs font-bold px-5 py-3 rounded-full transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            Upload Report
          </button>
        </div>
      </header>

      {/* Quick Stats Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        
        {/* Reports Card */}
        <div className="bg-[#eef8f5] border border-[#d6ede4] p-5 rounded-2xl flex flex-col justify-between min-h-[110px] relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Reports</span>
              <div className="text-3xl md:text-4xl font-black text-slate-800 mt-1.5">
                {loading ? "..." : reports.length}
              </div>
            </div>
            <div className="text-[#0a4e3e] bg-white/70 p-2 rounded-xl border border-[#d6ede4]">
              {/* Custom bar chart icon */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
          </div>
          <div className="text-[11px] font-bold text-[#0a4e3e] mt-2">Total Reports</div>
        </div>

        {/* Health Score Card */}
        <div className="bg-[#f1fbf5] border border-[#ddf5e6] p-5 rounded-2xl flex flex-col justify-between min-h-[110px] relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Health Score</span>
              <div className="mt-1.5 flex items-baseline gap-1">
                <span className="text-3xl md:text-4xl font-black text-slate-800">78</span>
                <span className="text-xs font-bold text-slate-500">/100</span>
              </div>
            </div>
            <div className="text-[#10b981] bg-white/70 p-2 rounded-xl border border-[#ddf5e6]">
              <TrendingUp className="w-5 h-5 stroke-[2.5px]" />
            </div>
          </div>
          <div className="text-[11px] font-bold text-[#10b981] flex items-center gap-1 mt-2">
            <span>Good</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="inline">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
          </div>
        </div>
      </section>

      {/* Dashboard Grid Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Reports Section (2 Columns width) */}
        <div className="bg-white border border-[#ecebe6] rounded-3xl p-6 lg:col-span-2 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex justify-between items-center pb-4 border-b border-[#faf9f5]">
              <h3 className="text-lg font-extrabold text-slate-800">Recent Reports</h3>
              <button className="text-xs font-bold text-[#0a4e3e] hover:underline" onClick={() => router.push("/dashboard/reports")}>View all</button>
            </div>
            
            <div className="mt-4 space-y-3.5">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <div className="w-8 h-8 border-3 border-[#0a4e3e] border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs font-bold text-slate-400">Loading your reports...</p>
                </div>
              ) : error ? (
                <div className="text-center py-10 text-rose-500 font-semibold text-xs">
                  {error}
                </div>
              ) : reports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center gap-3 bg-[#faf9f6] border border-dashed border-[#ecebe6] rounded-2xl">
                  <FileSpreadsheet className="w-8 h-8 text-slate-300" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-700">No reports uploaded yet</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Upload a new medical report to start analyzing it.</p>
                  </div>
                  <button 
                    onClick={() => router.push("/dashboard/reports")}
                    className="bg-[#0a4e3e] hover:bg-[#083d31] text-white text-[11px] font-bold px-4 py-2 rounded-full transition-all cursor-pointer shadow-sm mt-1"
                  >
                    Upload First Report
                  </button>
                </div>
              ) : (
                reports.slice(0, 4).map((report) => (
                  <a 
                    key={report.id} 
                    href={report.publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-3.5 border border-[#f0efea] rounded-2xl hover:bg-[#fafbf9] transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs border ${report.color}`}>
                        {report.initial}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 group-hover:text-[#0a4e3e] transition-colors line-clamp-1 max-w-[200px] sm:max-w-xs md:max-w-md">
                          {report.title}
                        </h4>
                        <p className="text-xs font-semibold text-slate-400 mt-0.5">{report.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold bg-[#faf9f5] border border-[#ecebe6] text-slate-600 px-3 py-1 rounded-full">Report</span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </a>
                ))
              )}
            </div>
          </div>
        </div>

        {/* AI Summary Section (1 Column width) */}
        <div className="bg-white border border-[#ecebe6] rounded-3xl p-6 flex flex-col justify-between shadow-sm relative overflow-hidden min-h-[340px]">
          <div className="space-y-4 z-10">
            <div className="flex items-center justify-between pb-3 border-b border-[#faf9f5]">
              <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                <span>AI Summary</span>
              </h3>
              <button className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                <Settings className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              Your HbA1c level has improved by <strong className="text-[#0a4e3e] font-extrabold">4.3%</strong> compared to last 3 months. Cholesterol levels are normal. Continue your current lifestyle routine and medication.
            </p>
          </div>

          {/* Custom Wavy Graphic Line */}
          <div className="absolute bottom-20 left-0 right-0 w-full overflow-hidden opacity-40 pointer-events-none">
            <svg viewBox="0 0 300 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
              <path d="M0 30 C 50 10, 100 50, 150 30 C 200 10, 250 50, 300 30" stroke="#0a4e3e" strokeWidth="2.5" fill="none"/>
              <path d="M0 40 C 50 20, 100 60, 150 40 C 200 20, 250 60, 300 40" stroke="#10b981" strokeWidth="1" opacity="0.5" fill="none"/>
            </svg>
          </div>

          <button className="w-full bg-[#0a4e3e] hover:bg-[#083d31] text-white text-xs font-bold py-3.5 rounded-full transition-all shadow-sm text-center mt-6 z-10 cursor-pointer">
            Ask AI a Question
          </button>
        </div>

      </div>

      {/* Lower Row: Quick Ask AI & Banners Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Quick Ask AI Bar */}
        <div className="bg-white border border-[#ecebe6] rounded-3xl p-6 lg:col-span-2 flex flex-col justify-between shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-800">Quick Ask AI</h3>
            <p className="text-xs font-semibold text-slate-400 mt-1">Get immediate answers about your medical metrics or prescriptions.</p>
          </div>

          <div className="relative flex items-center mt-2">
            <input
              type="text"
              value={askQuery}
              onChange={(e) => setAskQuery(e.target.value)}
              placeholder="Ask anything about your health..."
              className="w-full bg-[#faf9f5] border border-[#ebeae4] rounded-2xl py-4 pl-5 pr-14 text-sm font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-[#0a4e3e] focus:bg-white transition-all shadow-inner"
            />
            <button className="absolute right-2 bg-[#0a4e3e] hover:bg-[#083d31] text-white p-2.5 rounded-xl transition-all flex items-center justify-center cursor-pointer shadow">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Plant Banners Container */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 lg:col-span-1">
          
          {/* Latest Insights */}
          <div className="bg-[#f0f7f4] border border-[#d6ede4] rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[120px] shadow-sm">
            <div className="z-10 max-w-[80%]">
              <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Latest Insights</h4>
              <p className="text-xs font-bold text-slate-700 mt-2 leading-relaxed">
                Your average HbA1c is improving 🎉 Keep up the good work!
              </p>
            </div>
            <div className="mt-3 z-10">
              <button className="text-[10px] font-bold bg-white text-[#0a4e3e] border border-[#d6ede4] px-4 py-1.5 rounded-full hover:bg-slate-50 transition-colors shadow-sm">
                View Trends
              </button>
            </div>

            {/* Decorative Leaf SVG */}
            <div className="absolute right-0 bottom-0 opacity-20 text-[#0a4e3e] pointer-events-none select-none">
              <svg width="80" height="90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2C12 2 12 12 2 12C12 12 12 22 12 22C12 22 12 12 22 12C12 12 12 2 12 2Z" fill="currentColor"/>
              </svg>
            </div>
          </div>

          {/* Health Tip of the Day */}
          <div className="bg-[#fcfaf2] border border-[#f3eee0] rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[120px] shadow-sm">
            <div className="z-10 max-w-[80%]">
              <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Health Tip of the Day</h4>
              <p className="text-xs font-bold text-slate-700 mt-2 leading-relaxed">
                Drink plenty of water and take short walks after meals.
              </p>
            </div>

            {/* Decorative Botanical SVG */}
            <div className="absolute right-0 bottom-0 opacity-20 text-[#d97706] pointer-events-none select-none">
              <svg width="80" height="90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2C12 2 12 12 2 12C12 12 12 22 12 22C12 22 12 12 22 12C12 12 12 2 12 2Z" fill="currentColor"/>
              </svg>
            </div>
          </div>

        </div>

      </div>

    </main>
  );
}

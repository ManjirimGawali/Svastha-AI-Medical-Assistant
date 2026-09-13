"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  HeartPulse, 
  ArrowRight, 
  Play, 
  Search, 
  Activity, 
  ShieldCheck, 
  Clock, 
  ChevronDown,
  Droplet,
  FileText,
  Bookmark
} from "lucide-react";

export default function Page() {
  return (
    <div className="min-h-screen bg-[#fafdfb] relative overflow-hidden flex flex-col">
      {/* Background soft light shapes */}
      <div className="absolute top-[-10%] left-[-5%] w-[45%] h-[45%] bg-[#d9f2ec] rounded-full blur-[130px] opacity-40 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[45%] h-[45%] bg-[#dff5f0] rounded-full blur-[130px] opacity-40 pointer-events-none" />

      {/* Navigation Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Svastha Logo" className="w-10 h-10 object-contain" />
          <span className="text-2xl font-extrabold tracking-tight text-[#0f5b47] flex items-center gap-1.5">
            Svastha
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
          <Link href="#" className="hover:text-primary transition-colors">Features</Link>
          <Link href="#" className="hover:text-primary transition-colors">How it works</Link>
          <Link href="#" className="hover:text-primary transition-colors">Security</Link>
          <Link href="#" className="hover:text-primary transition-colors">Pricing</Link>
          <button className="flex items-center gap-1 hover:text-primary transition-colors font-semibold cursor-pointer">
            Resources <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>
        </nav>

        <div className="flex items-center gap-3">
          <Link 
            href="/login" 
            className="text-sm font-bold text-slate-700 hover:text-primary px-4 py-2 transition-colors"
          >
            Log in
          </Link>
          <Link 
            href="/login" 
            className="text-sm font-bold bg-[#0f5b47] hover:bg-[#0c4a3a] text-white px-5 py-2.5 rounded-full shadow-lg shadow-[#0f5b47]/10 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Container */}
      <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center py-12 md:py-16 z-10 flex-1 w-full">
        
        {/* Left Copy */}
        <div className="lg:col-span-5 space-y-6 text-left">
          <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold text-[#0f5b47] leading-[1.15] tracking-tight">
            Understand <br />
            your medical <br />
            reports in <br />
            <span className="text-[#10b981] relative">
              seconds.
              <span className="absolute left-0 bottom-0.5 w-full h-[4px] bg-[#10b981]/20 rounded" />
            </span>
          </h1>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-md">
            Upload your reports, ask questions, monitor your health trends, and organize every medical record in one secure place.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
            <Link 
              href="/login" 
              className="w-full sm:w-auto px-8 py-3.5 bg-[#0f5b47] hover:bg-[#0c4a3a] text-white font-bold rounded-full shadow-lg shadow-[#0f5b47]/20 transition-all text-center"
            >
              Get Started
            </Link>
            {/* <button 
              className="w-full sm:w-auto px-6 py-3.5 bg-white border border-[#e2edea] hover:bg-slate-50 text-slate-700 font-bold rounded-full shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-[#0f5b47] text-[#0f5b47]" />
              Watch Demo
            </button> */}
          </div>
        </div>

        {/* Right Graphical Area */}
        <div className="lg:col-span-7 flex justify-center items-center relative">
          
          <div className="relative w-full max-w-[580px] aspect-[4/3] flex items-center justify-center">
            
            <Image 
              src="/hero-illustration.png" 
              alt="Svastha Medical Assistant Hero" 
              width={580} 
              height={435}
              priority
              className="object-contain"
            />

          </div>
        </div>

      </section>

      {/* Trusted By Brand Logos */}
      <section className="w-full max-w-7xl mx-auto px-6 py-8 border-t border-[#e2edea] z-10 text-center space-y-6">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Trusted by thousands of users
        </p>

        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all">
          <span className="text-sm font-extrabold tracking-tight text-slate-600 flex items-center gap-1.5">
            👶 Cloudnine
          </span>
          <span className="text-sm font-extrabold tracking-tight text-slate-600">
            🏥 ManipalHospitals
          </span>
          <span className="text-sm font-extrabold tracking-tight text-slate-600">
            ⚕️ Apollo Hospitals
          </span>
          <span className="text-sm font-extrabold tracking-tight text-slate-600">
            🏢 MAX Healthcare
          </span>
          <span className="text-sm font-extrabold tracking-tight text-slate-600">
            🏥 Fortis Hospitals
          </span>
        </div>
      </section>

      {/* Bottom Features Cards */}
      <section className="w-full max-w-7xl mx-auto px-6 pb-16 pt-8 z-10">
        <div className="bg-white/40 border border-[#e2edea] rounded-3xl p-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-3">
            <div className="bg-[#e6f4f1] text-[#0f5b47] w-10 h-10 rounded-xl flex items-center justify-center">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">AI-Powered Insights</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Get simple explanations for complex medical reports.
            </p>
          </div>

          <div className="space-y-3">
            <div className="bg-[#e6f4f1] text-[#0f5b47] w-10 h-10 rounded-xl flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">Track Your Health</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Monitor trends and changes over time with beautiful visuals.
            </p>
          </div>

          <div className="space-y-3">
            <div className="bg-[#e6f4f1] text-[#0f5b47] w-10 h-10 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">Secure & Private</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your data is encrypted and private. You're in control.
            </p>
          </div>

          <div className="space-y-3">
            <div className="bg-[#e6f4f1] text-[#0f5b47] w-10 h-10 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">All in One Place</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Store all of your reports, prescriptions & records in one place.
            </p>
          </div>

        </div>
      </section>

      {/* Simple Footer */}
      <footer className="py-6 border-t border-[#e2edea] mt-auto bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© 2026 Svastha Health Assistant. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:underline">Privacy Policy</Link>
            <Link href="#" className="hover:underline">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

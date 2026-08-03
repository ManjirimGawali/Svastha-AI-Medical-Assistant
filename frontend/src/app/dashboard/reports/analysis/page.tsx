"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, 
  Download, 
  Search, 
  Plus, 
  Minus, 
  FileText, 
  CheckCircle,
  HelpCircle,
  TrendingUp,
  AlertTriangle
} from "lucide-react";

export default function ReportAnalysisPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"explanation" | "highlights" | "raw">("explanation");
  const [zoomLevel, setZoomLevel] = useState(100);
  const [pageNumber, setPageNumber] = useState(1);

  // Simulated questions response
  const handleQuestionClick = (question: string) => {
    alert(`AI Assistant Query: "${question}"\n\nThis would launch the Chat screen with this specific query preloaded.`);
  };

  return (
    <main className="flex-1 p-6 md:p-8 lg:p-10 overflow-y-auto max-w-7xl mx-auto w-full space-y-8">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <button 
            onClick={() => router.push("/dashboard/reports")}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-[#0a4e3e] transition-colors mb-2 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Back to Reports</span>
          </button>
          
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800">Complete Blood Count</h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-400">12 Jun, 2024 • City Hospital</p>
        </div>

        <button className="bg-[#0a4e3e] hover:bg-[#083d31] text-white text-xs font-bold px-6 py-3 rounded-full transition-all shadow flex items-center gap-2 cursor-pointer self-start sm:self-center">
          <Download className="w-3.5 h-3.5" />
          <span>Download</span>
        </button>
      </div>

      {/* Main Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Simulated PDF Document Viewer */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-[#ecebe6] rounded-3xl p-5 shadow-sm flex flex-col justify-between min-h-[500px]">
            
            {/* Simulated Medical Document Sheet */}
            <div className="border border-[#f0efea] bg-[#fbfbf9] rounded-2xl p-6 flex-1 flex flex-col justify-between relative overflow-hidden">
              
              {/* Document Header Logo */}
              <div className="flex justify-between items-start pb-4 border-b border-[#f0efea] text-slate-700">
                <div>
                  <h4 className="text-[10px] font-black tracking-wider text-slate-800 uppercase">City Hospital Labs</h4>
                  <p className="text-[8px] font-bold text-slate-400 mt-0.5">Diagnostic Report Division</p>
                </div>
                <div className="text-[8px] font-bold text-right text-slate-400">
                  <p>PATIENT ID: #98421</p>
                  <p className="mt-0.5">DATE: 12 JUN 2024</p>
                </div>
              </div>

              {/* Document Table Content */}
              <div className="my-6 space-y-4 flex-1">
                <div className="text-center pb-2 border-b border-[#f0efea]/60">
                  <h3 className="text-xs font-black tracking-wide text-slate-800 uppercase">Complete Blood Count (CBC)</h3>
                </div>

                <div className="space-y-2">
                  {/* Table Headers */}
                  <div className="grid grid-cols-4 text-[8px] font-black text-slate-400 uppercase tracking-wider pb-1 border-b border-[#f0efea]/60">
                    <div>Test Component</div>
                    <div className="text-center">Result</div>
                    <div className="text-center">Reference</div>
                    <div className="text-right">Unit</div>
                  </div>

                  {/* Rows */}
                  {[
                    { name: "Hemoglobin", val: "14.2", ref: "12.0 - 15.5", unit: "g/dL", highlight: false },
                    { name: "Red Blood Cells", val: "4.8", ref: "3.8 - 5.1", unit: "M/uL", highlight: false },
                    { name: "White Blood Cells", val: "11.5", ref: "4.0 - 10.0", unit: "K/uL", highlight: true },
                    { name: "Platelets", val: "250", ref: "150 - 450", unit: "K/uL", highlight: false },
                    { name: "Hematocrit", val: "42.1", ref: "34.9 - 44.5", unit: "%", highlight: false },
                    { name: "MCV", val: "88", ref: "80 - 100", unit: "fL", highlight: false }
                  ].map((row, idx) => (
                    <div key={idx} className={`grid grid-cols-4 text-[9px] font-bold py-1.5 border-b border-[#f0efea]/40 ${row.highlight ? "bg-red-50 text-red-700 px-1 rounded" : "text-slate-700"}`}>
                      <div>{row.name}</div>
                      <div className="text-center flex items-center justify-center gap-0.5">
                        <span>{row.val}</span>
                        {row.highlight && <AlertTriangle className="w-2.5 h-2.5 text-red-500 fill-red-50" />}
                      </div>
                      <div className="text-center text-slate-400">{row.ref}</div>
                      <div className="text-right text-slate-400">{row.unit}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Document Signoff Footer */}
              <div className="pt-4 border-t border-[#f0efea] flex justify-between items-center text-[8px] font-bold text-slate-400">
                <p>Authorized Signature: Dr. A. Sen</p>
                <p>Page {pageNumber} of 3</p>
              </div>

            </div>

            {/* Pagination & Zoom Controls */}
            <div className="flex justify-between items-center pt-4 border-t border-[#ecebe6] mt-4 text-slate-400">
              <div className="flex items-center gap-2">
                <button className="p-1.5 hover:bg-slate-50 rounded-lg hover:text-slate-600 transition-colors">
                  <Search className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                  className="text-xs font-bold px-2 py-1 hover:bg-slate-50 rounded transition-colors"
                >
                  Prev
                </button>
                <span className="text-xs font-bold text-slate-800">{pageNumber} / 3</span>
                <button 
                  onClick={() => setPageNumber(p => Math.min(3, p + 1))}
                  className="text-xs font-bold px-2 py-1 hover:bg-slate-50 rounded transition-colors"
                >
                  Next
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button 
                  onClick={() => setZoomLevel(z => Math.max(50, z - 10))}
                  className="p-1.5 hover:bg-slate-50 rounded-lg hover:text-slate-600 transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-bold text-slate-800">{zoomLevel}%</span>
                <button 
                  onClick={() => setZoomLevel(z => Math.min(150, z + 10))}
                  className="p-1.5 hover:bg-slate-50 rounded-lg hover:text-slate-600 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: AI Analysis details */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-[#ecebe6] rounded-3xl p-6 shadow-sm min-h-[500px] flex flex-col">
            
            {/* Tabs Header */}
            <div className="flex border-b border-[#f0efea] mb-6">
              {[
                { id: "explanation", label: "AI Explanation" },
                { id: "highlights", label: "Highlights" },
                { id: "raw", label: "Raw Data" }
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`pb-3.5 px-5 text-sm font-bold transition-all relative border-b-2 -mb-[2px] cursor-pointer ${
                      isActive 
                        ? "border-[#0a4e3e] text-[#0a4e3e]" 
                        : "border-transparent text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab content area */}
            <div className="flex-1 flex flex-col justify-between">
              
              {/* Tab 1: AI Explanation */}
              {activeTab === "explanation" && (
                <div className="space-y-6">
                  {/* Simple Explanation Block */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-extrabold text-slate-800">Simple Explanation</h3>
                    <p className="text-sm font-semibold text-slate-500 leading-relaxed">
                      Your blood report is mostly normal. Hemoglobin is within range. Platelet count is normal. WBC count is slightly elevated which could be due to mild infection.
                    </p>
                  </div>

                  {/* Findings Grid badges */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-[#fdf6ec] border border-[#fbe9d1] rounded-2xl p-4 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Important Findings</p>
                      <div className="text-2xl font-black text-[#d97706] mt-1.5">2</div>
                    </div>

                    <div className="bg-[#f0fdf4] border border-[#dcfce7] rounded-2xl p-4 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Normal Values</p>
                      <div className="text-2xl font-black text-[#0a4e3e] mt-1.5">18</div>
                    </div>

                    <div className="bg-[#fef2f2] border border-[#fee2e2] rounded-2xl p-4 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Abnormal Values</p>
                      <div className="text-2xl font-black text-red-600 mt-1.5">1</div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="space-y-2.5">
                    <h3 className="text-sm font-extrabold text-slate-800">Recommendations</h3>
                    <ul className="space-y-2 text-xs font-bold text-slate-500 list-disc list-inside">
                      <li>Stay hydrated and maintain a balanced diet.</li>
                      <li>If you have any symptoms like fever or fatigue, consult your doctor.</li>
                      <li>Repeat CBC after 4 weeks.</li>
                    </ul>
                  </div>

                  {/* Questions you may ask */}
                  <div className="space-y-3 pt-2">
                    <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Questions you may ask</h3>
                    <div className="flex flex-wrap gap-2.5">
                      {[
                        "What is HbA1c count?",
                        "Is my hemoglobin normal?",
                        "Compare with previous reports"
                      ].map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleQuestionClick(q)}
                          className="bg-[#faf9f5] border border-[#ecebe6] hover:bg-[#f3f2eb] text-slate-700 text-xs font-bold px-4 py-2.5 rounded-full transition-all cursor-pointer shadow-sm"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Highlights */}
              {activeTab === "highlights" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-extrabold text-slate-800">Key Test Highlights</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3.5 border border-[#f0efea] rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                        <span className="text-xs font-bold text-slate-800">White Blood Cells (WBC)</span>
                      </div>
                      <span className="text-xs font-black text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full">11.5 K/uL (High)</span>
                    </div>

                    <div className="flex items-center justify-between p-3.5 border border-[#f0efea] rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
                        <span className="text-xs font-bold text-slate-800">Hemoglobin</span>
                      </div>
                      <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">14.2 g/dL (Normal)</span>
                    </div>

                    <div className="flex items-center justify-between p-3.5 border border-[#f0efea] rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div>
                        <span className="text-xs font-bold text-slate-800">Platelet Count</span>
                      </div>
                      <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">250 K/uL (Normal)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Raw Data */}
              {activeTab === "raw" && (
                <div className="space-y-4 flex-1 flex flex-col">
                  <h3 className="text-sm font-extrabold text-slate-800">Extracted Raw Text</h3>
                  <div className="bg-[#faf9f5] border border-[#ecebe6] rounded-2xl p-4 font-mono text-[10px] text-slate-600 flex-1 overflow-y-auto max-h-[260px] whitespace-pre-wrap">
                    {`CITY HOSPITAL LABORATORY OUTPATIENT REPORT
--------------------------------------------------
PATIENT NAME: Manjiri Gawali   AGE/SEX: 30 Y / F
SAMPLE DATE:  11-Jun-2024 08:30 AM
REPORT DATE:  12-Jun-2024 10:15 AM
REFERRAL:     Self

COMPLETE BLOOD COUNT (CBC) ANALYSIS RESULTS:
- Hemoglobin:         14.2 g/dL      (Ref: 12.0 - 15.5)
- RBC Count:          4.8 M/uL       (Ref: 3.8 - 5.1)
- Hematocrit:         42.1 %         (Ref: 34.9 - 44.5)
- MCV:                88 fL          (Ref: 80 - 100)
- WBC Count:          11.5 K/uL   *  (Ref: 4.0 - 10.0) HIGH
- Platelet Count:     250 K/uL       (Ref: 150 - 450)

COMMENTS / REMARKS:
Note: WBC count is slightly above the reference range limit, indicative of mild localized defense action or transient response. Re-eval recommended if symptomatic.`}
                  </div>
                </div>
              )}

              {/* Footer Progress bar */}
              <div className="pt-6 border-t border-[#f0efea] mt-6 flex justify-between items-center text-slate-500">
                <span className="text-xs font-bold">Confidence in this analysis</span>
                <div className="flex items-center gap-3 flex-1 max-w-[240px] ml-4">
                  <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#0a4e3e] h-full rounded-full" style={{ width: "92%" }}></div>
                  </div>
                  <span className="text-xs font-extrabold text-slate-800">92%</span>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>

    </main>
  );
}

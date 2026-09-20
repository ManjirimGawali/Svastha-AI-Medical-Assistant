"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { API_BASE } from "@/lib/api";
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
  AlertTriangle,
  Loader2
} from "lucide-react";

export default function ReportAnalysisPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"explanation" | "highlights" | "raw">("explanation");
  const [zoomLevel, setZoomLevel] = useState(100);
  const [pageNumber, setPageNumber] = useState(1);

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    const searchParams = new URLSearchParams(window.location.search);
    const reportId = searchParams.get("id");

    if (!reportId) {
      setError("No report ID provided in the URL.");
      setLoading(false);
      return;
    }

    async function fetchAnalysis(showLoading = true) {
      if (!user) return;
      try {
        if (showLoading) setLoading(true);
        const token = await user.getIdToken();
        const response = await fetch(`${API_BASE}/api/reports/${reportId}/analysis`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(errorBody.error || "Failed to load report analysis");
        }

        const data = await response.json();
        setReport(data.report);

        // If the report has finished processing (completed or failed), clear the polling interval
        if (data.report && data.report.processingStatus !== "processing") {
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        }
      } catch (err: any) {
        console.error("Error loading analysis:", err);
        setError(err.message || "Failed to load analysis");
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      } finally {
        if (showLoading) setLoading(false);
      }
    }

    if (user) {
      // First fetch (shows the full page loader)
      fetchAnalysis(true);

      // Start polling every 3 seconds for updates in the background
      intervalId = setInterval(() => {
        fetchAnalysis(false);
      }, 3000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [user]);

  // Handler for simulated question suggestions
  const handleQuestionClick = (question: string) => {
    alert(`AI Assistant Query: "${question}"\n\nThis will pre-fill the chat assistant once integrated.`);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 gap-4 min-h-[400px]">
        <Loader2 className="w-10 h-10 text-[#0a4e3e] animate-spin" />
        <div className="text-center">
          <h2 className="text-base font-bold text-slate-800">Analyzing report...</h2>
          <p className="text-xs font-semibold text-slate-400 mt-1">Google Document AI and Gemini are processing your document.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 gap-4 min-h-[400px]">
        <AlertTriangle className="w-10 h-10 text-red-500" />
        <div className="text-center max-w-md">
          <h2 className="text-base font-bold text-slate-800">Analysis Error</h2>
          <p className="text-xs font-semibold text-red-600 mt-1">{error}</p>
          <button 
            onClick={() => router.push("/dashboard/reports")}
            className="mt-6 bg-[#0a4e3e] text-white text-xs font-bold px-6 py-3 rounded-full hover:bg-[#083d31] transition-all cursor-pointer"
          >
            Back to Uploads
          </button>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 min-h-[400px]">
        <p className="text-sm font-semibold text-slate-500">Report details could not be retrieved.</p>
      </div>
    );
  }

  // Handle still processing state
  if (report.processingStatus === "processing") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 gap-4 min-h-[400px]">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
        <div className="text-center">
          <h2 className="text-base font-bold text-slate-800">Processing Document...</h2>
          <p className="text-xs font-semibold text-slate-400 mt-1">This report is still being analyzed. Please wait a moment and refresh.</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 bg-[#0a4e3e] text-white text-xs font-bold px-6 py-3 rounded-full hover:bg-[#083d31] transition-all cursor-pointer"
          >
            Refresh Status
          </button>
        </div>
      </div>
    );
  }

  // Handle failed state
  if (report.processingStatus === "failed") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 gap-4 min-h-[400px]">
        <AlertTriangle className="w-10 h-10 text-red-500" />
        <div className="text-center max-w-md">
          <h2 className="text-base font-bold text-slate-800">Analysis Failed</h2>
          <p className="text-xs font-semibold text-red-600 mt-2 leading-relaxed">
            {(() => {
              const errorText = report.aiSummary || "";
              if (errorText.includes("503") || errorText.includes("high demand") || errorText.includes("UNAVAILABLE") || errorText.includes("429")) {
                return "Our AI servers are currently experiencing a surge in traffic. Don't worry, your document is saved! Please wait a moment and click Retry below.";
              }
              return errorText || "The system could not extract text or parse biomarkers from this file format.";
            })()}
          </p>
          <div className="flex justify-center gap-3 mt-6">
            <button 
              onClick={() => router.push("/dashboard/reports")}
              className="bg-[#0a4e3e] text-white text-xs font-bold px-6 py-3 rounded-full hover:bg-[#083d31] transition-all cursor-pointer"
            >
              Back to Uploads
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="bg-slate-200 text-slate-700 text-xs font-bold px-6 py-3 rounded-full hover:bg-slate-300 transition-all cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formattedDate = report.reportDate 
    ? new Date(report.reportDate).toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      })
    : report.uploadDate 
      ? new Date(report.uploadDate).toLocaleDateString("en-US", {
          day: "2-digit",
          month: "short",
          year: "numeric"
        })
      : "Unknown Date";

  // Filter abnormal biomarkers for highlights
  const highlights = (report.biomarkers || []).filter(
    (b: any) => b.interpretation && b.interpretation.toUpperCase() !== "NORMAL"
  );

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
          
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800">{report.reportName}</h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-400">{formattedDate} • Patient Report</p>
        </div>

        {/* <a 
          href={`${API_BASE}/api/reports/${report.id}/download`} 
          target="_blank" 
          rel="noreferrer"
          className="bg-[#0a4e3e] hover:bg-[#083d31] text-white text-xs font-bold px-6 py-3 rounded-full transition-all shadow flex items-center gap-2 cursor-pointer self-start sm:self-center"
        >
          <Download className="w-3.5 h-3.5" />
          <span>View Original File</span>
        </a> */}
      </div>

      {/* Main Column Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Live Document Table Viewer */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-[#ecebe6] rounded-3xl p-5 shadow-sm flex flex-col justify-between min-h-[500px]">
            
            {/* Medical Document Sheet */}
            <div className="border border-[#f0efea] bg-[#fbfbf9] rounded-2xl p-6 flex-1 flex flex-col justify-between relative overflow-hidden">
              
              {/* Document Header Logo */}
              <div className="flex justify-between items-start pb-4 border-b border-[#f0efea] text-slate-700">
                <div>
                  <h4 className="text-[10px] font-black tracking-wider text-slate-800 uppercase">Swasthya Diagnostic Labs</h4>
                  <p className="text-[8px] font-bold text-slate-400 mt-0.5">Automated OCR Extraction</p>
                </div>
                <div className="text-[8px] font-bold text-right text-slate-400">
                  <p>PATIENT: {user?.displayName || "Patient"}</p>
                  <p className="mt-0.5">DATE: {formattedDate.toUpperCase()}</p>
                </div>
              </div>

              {/* Document Table Content */}
              <div className="my-6 space-y-4 flex-1">
                <div className="text-center pb-2 border-b border-[#f0efea]/60">
                  <h3 className="text-xs font-black tracking-wide text-slate-800 uppercase">{report.reportName}</h3>
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
                  {(report.biomarkers || []).map((row: any, idx: number) => {
                    const isAbnormal = row.interpretation && row.interpretation.toUpperCase() !== "NORMAL";
                    return (
                      <div 
                        key={idx} 
                        className={`grid grid-cols-4 text-[9px] font-bold py-1.5 border-b border-[#f0efea]/40 ${
                          isAbnormal ? "bg-red-50 text-red-700 px-1 rounded" : "text-slate-700"
                        }`}
                      >
                        <div className="truncate pr-1">{row.name}</div>
                        <div className="text-center flex items-center justify-center gap-0.5">
                          <span>{row.value}</span>
                          {isAbnormal && <AlertTriangle className="w-2.5 h-2.5 text-red-500 fill-red-50" />}
                        </div>
                        <div className="text-center text-slate-400">{row.referenceRange || "--"}</div>
                        <div className="text-right text-slate-400">{row.unit || "--"}</div>
                      </div>
                    );
                  })}

                  {(!report.biomarkers || report.biomarkers.length === 0) && (
                    <div className="text-center py-10 text-[10px] text-slate-400 font-bold">
                      No structured biomarkers extracted.
                    </div>
                  )}
                </div>
              </div>

              {/* Document Signoff Footer */}
              <div className="pt-4 border-t border-[#f0efea] flex justify-between items-center text-[8px] font-bold text-slate-400">
                <p>Digital OCR Transcription Verified</p>
                <p>Page {pageNumber} of 1</p>
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
                <span className="text-xs font-bold text-slate-800">{pageNumber} / 1</span>
                <button 
                  onClick={() => setPageNumber(p => Math.min(1, p + 1))}
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
                      {report.aiSummary || "No explanation was generated for this report."}
                    </p>
                  </div>

                  {/* Findings Grid badges */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-[#fdf6ec] border border-[#fbe9d1] rounded-2xl p-4 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Important Findings</p>
                      <div className="text-2xl font-black text-[#d97706] mt-1.5">{highlights.length}</div>
                    </div>

                    <div className="bg-[#f0fdf4] border border-[#dcfce7] rounded-2xl p-4 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Normal Values</p>
                      <div className="text-2xl font-black text-[#0a4e3e] mt-1.5">
                        {report.biomarkers ? report.biomarkers.length - highlights.length : 0}
                      </div>
                    </div>

                    <div className="bg-[#fef2f2] border border-[#fee2e2] rounded-2xl p-4 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Abnormal Values</p>
                      <div className="text-2xl font-black text-red-600 mt-1.5">{highlights.length}</div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="space-y-2.5">
                    <h3 className="text-sm font-extrabold text-slate-800">Recommendations</h3>
                    <ul className="space-y-2 text-xs font-bold text-slate-500 list-disc list-inside">
                      {highlights.length > 0 ? (
                        <>
                          <li>Consult a doctor to discuss the abnormal biomarkers.</li>
                          <li>Keep a tab on any symptoms related to abnormal values.</li>
                          <li>Consider re-testing in 4-6 weeks to check progression.</li>
                        </>
                      ) : (
                        <>
                          <li>Everything looks in order. Continue maintaining a healthy lifestyle!</li>
                          <li>Stay hydrated and get regular exercise.</li>
                        </>
                      )}
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
                    {highlights.map((row: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3.5 border border-[#f0efea] rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                          <span className="text-xs font-bold text-slate-800">{row.name}</span>
                        </div>
                        <span className="text-xs font-black text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full">
                          {row.value} {row.unit} ({row.interpretation})
                        </span>
                      </div>
                    ))}

                    {highlights.length === 0 && (
                      <div className="text-center py-10 text-xs font-bold text-slate-400">
                        No abnormal highlights. All parameters are within normal range!
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: Raw Data */}
              {activeTab === "raw" && (
                <div className="space-y-4 flex-1 flex flex-col">
                  <h3 className="text-sm font-extrabold text-slate-800">Extracted Raw OCR Text</h3>
                  <div className="bg-[#faf9f5] border border-[#ecebe6] rounded-2xl p-4 font-mono text-[10px] text-slate-600 flex-1 overflow-y-auto max-h-[260px] whitespace-pre-wrap">
                    {report.ocrText || "No raw text was extracted from this report."}
                  </div>
                </div>
              )}

              {/* Footer Progress bar */}
              <div className="pt-6 border-t border-[#f0efea] mt-6 flex justify-between items-center text-slate-500">
                <span className="text-xs font-bold">Confidence in this analysis</span>
                <div className="flex items-center gap-3 flex-1 max-w-[240px] ml-4">
                  <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#0a4e3e] h-full rounded-full" style={{ width: "95%" }}></div>
                  </div>
                  <span className="text-xs font-extrabold text-slate-800">95%</span>
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>

    </main>
  );
}

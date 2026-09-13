"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { API_BASE } from "@/lib/api";
import { 
  UploadCloud, 
  FileText, 
  Image as ImageIcon, 
  FileCheck, 
  CheckCircle,
  HelpCircle,
  AlertCircle
} from "lucide-react";

export default function UploadReportsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [recentReportsLoading, setRecentReportsLoading] = useState(false);

  useEffect(() => {
    const fetchRecentReports = async () => {
      if (!user) return;

      try {
        setRecentReportsLoading(true);
        const token = await user.getIdToken();
        const response = await fetch(`${API_BASE}/api/reports`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch reports");
        }

        const data = await response.json();
        const firstThree = Array.isArray(data.reports) ? data.reports.slice(0, 3) : [];
        setRecentReports(firstThree);
      } catch (error) {
        console.error("Error fetching recent reports:", error);
        setRecentReports([]);
      } finally {
        setRecentReportsLoading(false);
      }
    };

    fetchRecentReports();
  }, [user]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (file: File) => {
    if (file.size > 25 * 1024 * 1024) {
      alert("File size exceeds the 25MB limit.");
      return;
    }
    setSelectedFile(file);
    setUploadStatus("idle");
  };

  const triggerBrowse = () => {
    fileInputRef.current?.click();
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;
    setUploadStatus("uploading");
    
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const headers: Record<string, string> = {};
      if (user) {
        try {
          const token = await user.getIdToken();
          headers["Authorization"] = `Bearer ${token}`;
        } catch (tokenErr) {
          console.error("Could not fetch ID token:", tokenErr);
        }
      }

      const response = await fetch(`${API_BASE}/api/upload`, {
        method: "POST",
        headers: headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || "Supabase upload failed");
      }

      const data = await response.json();
      console.log("Successfully uploaded to Supabase Storage:", data);
      
      setUploadStatus("success");
      setTimeout(() => {
        router.push(`/dashboard/reports/analysis?id=${data.reportId}`);
      }, 550);
    } catch (err: any) {
      console.error("Upload error:", err);
      setErrorMessage(err.message || "Upload failed. Check backend server and try again.");
      setUploadStatus("error");
    }
  };

  return (
    <main className="flex-1 p-6 md:p-8 lg:p-10 overflow-y-auto max-w-7xl mx-auto w-full space-y-8">
      
      {/* Page Title Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800">Upload Your Medical Reports</h1>
        <p className="text-xs sm:text-sm font-semibold text-slate-400 mt-1">We support PDF, JPG, PNG and images</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Upload Container (2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Drag & Drop Area */}
          <div 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center transition-all min-h-[320px] bg-white ${
              isDragActive 
                ? "border-[#0a4e3e] bg-[#eaf4f0]" 
                : "border-[#e3dfd5] hover:border-[#0a4e3e]/50"
            }`}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              className="hidden" 
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileInput}
            />

            {/* Cloud Icon */}
            <div className="text-[#0a4e3e] bg-[#eef8f5] p-5 rounded-3xl border border-[#d6ede4] mb-6">
              <UploadCloud className="w-10 h-10 stroke-[2px]" />
            </div>

            {selectedFile ? (
              <div className="space-y-4">
                <div>
                  <p className="text-base font-extrabold text-slate-800">{selectedFile.name}</p>
                  <p className="text-xs font-semibold text-slate-400 mt-1">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>

                {(uploadStatus === "idle" || uploadStatus === "error") && (
                  <button 
                    onClick={handleUploadSubmit}
                    className="bg-[#0a4e3e] hover:bg-[#083d31] text-white text-xs font-bold px-8 py-3 rounded-full transition-all shadow cursor-pointer"
                  >
                    Start Analysis
                  </button>
                )}

                {uploadStatus === "uploading" && (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-3 border-[#0a4e3e] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-bold text-slate-500">Uploading and analyzing your report...</p>
                  </div>
                )}

                {uploadStatus === "success" && (
                  <div className="text-emerald-600 font-bold text-sm flex items-center gap-1.5 justify-center bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                    <CheckCircle className="w-4 h-4" />
                    <span>Report analyzed successfully!</span>
                  </div>
                )}

                {uploadStatus === "error" && (
                  <div className="text-rose-600 font-bold text-xs flex items-center gap-1.5 justify-center bg-rose-50 px-4 py-2.5 rounded-xl border border-rose-100 mt-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>
            ) : (
              <>
                <p className="text-base font-extrabold text-slate-800">Drag & drop your files here</p>
                <span className="text-xs font-semibold text-slate-400 my-3">or</span>
                <button 
                  onClick={triggerBrowse}
                  className="bg-[#0a4e3e] hover:bg-[#083d31] text-white text-xs font-bold px-6 py-3.5 rounded-full transition-all shadow cursor-pointer"
                >
                  Browse Files
                </button>
                <span className="text-[11px] font-semibold text-slate-400 mt-6">Max file size: 25MB</span>
              </>
            )}
          </div>

          {/* Supported Formats Card */}
          <div className="bg-white border border-[#ecebe6] rounded-3xl p-6 shadow-sm">
            <h3 className="text-sm font-extrabold text-slate-800 mb-4">Supported Files</h3>
            <div className="grid grid-cols-3 gap-4">
              
              <div className="bg-[#faf9f5] border border-[#f0efea] rounded-2xl p-4 flex flex-col items-center text-center">
                <div className="bg-[#fee2e2] text-red-600 p-2.5 rounded-xl mb-2.5">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800">PDF Files</span>
              </div>

              <div className="bg-[#faf9f5] border border-[#f0efea] rounded-2xl p-4 flex flex-col items-center text-center">
                <div className="bg-[#dcfce7] text-[#0a4e3e] p-2.5 rounded-xl mb-2.5">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800">Images (JPG, PNG)</span>
              </div>

              <div className="bg-[#faf9f5] border border-[#f0efea] rounded-2xl p-4 flex flex-col items-center text-center">
                <div className="bg-[#ffedd5] text-amber-600 p-2.5 rounded-xl mb-2.5">
                  <FileCheck className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800">Prescriptions</span>
              </div>

            </div>
          </div>

        </div>

        {/* Recent Uploads Side Panel (1 Column) */}
        <div className="bg-white border border-[#ecebe6] rounded-3xl p-6 shadow-sm flex flex-col justify-between min-h-[460px]">
          <div>
            <h3 className="text-lg font-extrabold text-slate-800 pb-3 border-b border-[#faf9f5]">Recent Uploads</h3>
            
            <div className="mt-4 space-y-4">
              {recentReportsLoading ? (
                <div className="text-xs font-semibold text-slate-400 py-4">Loading recent reports...</div>
              ) : recentReports.length === 0 ? (
                <div className="text-xs font-semibold text-slate-400 py-4">No recent reports yet.</div>
              ) : (
                recentReports.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => router.push(`/dashboard/reports/analysis?id=${item.id}`)}
                    className="w-full text-left flex items-center justify-between p-3 border border-[#f0efea] rounded-2xl hover:bg-[#fafbf9] transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs border ${item.color || "bg-[#eef8f5] text-[#0a4e3e] border-[#d6ede4]"}`}>
                        {item.initial || "FILE"}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-800 group-hover:text-[#0a4e3e] transition-colors truncate">{item.title}</h4>
                        <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{item.date}</p>
                      </div>
                    </div>
                    <CheckCircle className="w-4 h-4 text-emerald-600 fill-emerald-50 shrink-0" />
                  </button>
                ))
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push("/dashboard/reports")}
            className="w-full bg-[#faf9f5] hover:bg-[#f3f2eb] border border-[#ecebe6] text-slate-700 text-xs font-bold py-3.5 rounded-full transition-all text-center mt-6 cursor-pointer"
          >
            View All
          </button>
        </div>

      </div>

      {/* Tips for Better Analysis */}
      <div className="bg-[#fcfaf4] border border-[#f3efe4] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-sm">
        <div className="space-y-4 max-w-xl z-10">
          <h3 className="text-base font-extrabold text-slate-800">Tips for Better Analysis</h3>
          <ul className="space-y-2 text-xs font-bold text-slate-600 list-disc list-inside">
            <li>Upload clear and readable reports</li>
            <li>Include all pages of the report</li>
            <li>Avoid blurry or cropped images</li>
          </ul>
        </div>

        {/* Decorative SVG Illustration on the right */}
        <div className="flex items-center gap-4 z-10 shrink-0">
          <svg width="140" height="100" viewBox="0 0 140 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform scale-110">
            {/* Tablet outline */}
            <rect x="25" y="10" width="70" height="80" rx="6" fill="#ffffff" stroke="#ecebe6" strokeWidth="2" />
            <rect x="30" y="15" width="60" height="70" rx="3" fill="#eaf4f0" />
            
            {/* Hospital document lines */}
            <line x1="38" y1="28" x2="68" y2="28" stroke="#0a4e3e" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="38" y1="36" x2="82" y2="36" stroke="#c0b9a8" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="38" y1="44" x2="74" y2="44" stroke="#c0b9a8" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="38" y1="52" x2="82" y2="52" stroke="#c0b9a8" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="78" cy="27" r="4" fill="#0a4e3e" />
            
            {/* Botanical plants overlay */}
            <path d="M100 80 C 110 50, 120 70, 130 40 C 120 80, 110 80, 100 80Z" fill="#10b981" opacity="0.3" />
            <path d="M110 90 C 120 60, 125 75, 135 55 C 125 90, 118 90, 110 90Z" fill="#0a4e3e" opacity="0.2" />
            
            {/* Smart woman vector */}
            <circle cx="108" cy="30" r="12" fill="#e2af91" />
            <path d="M108 42 C 95 42, 90 65, 90 90 H 126 C 126 65, 121 42, 108 42Z" fill="#0a4e3e" />
            {/* Hair overlay */}
            <path d="M96 28 C 96 22, 120 22, 120 28 C 120 30, 112 32, 108 30 C 104 32, 96 30, 96 28Z" fill="#2d2d2a" />
          </svg>
        </div>

        {/* Botanical SVG Leaf Decoration in Background */}
        <div className="absolute right-0 bottom-0 opacity-10 text-[#0a4e3e] pointer-events-none select-none">
          <svg width="100" height="110" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2C12 2 12 12 2 12C12 12 12 22 12 22C12 22 12 12 22 12C12 12 12 2 12 2Z" fill="currentColor"/>
          </svg>
        </div>
      </div>

    </main>
  );
}

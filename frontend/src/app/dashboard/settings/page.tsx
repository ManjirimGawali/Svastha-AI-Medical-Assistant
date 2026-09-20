"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { API_BASE } from "@/lib/api";
import {
  User,
  FileText,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Settings,
  BarChart2,
  FlaskConical,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  LogOut,
  ShieldAlert,
  X,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileStats {
  reportCount: number;
  biomarkerCount: number;
}

interface ProfileData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  stats: ProfileStats;
}

interface SettingsReport {
  id: string;
  reportName: string;
  uploadDate: string;
  reportDate: string | null;
  processingStatus: string;
  biomarkerCount: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function statusBadge(status: string) {
  const s = status.toLowerCase();
  if (s === "completed")
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
        <CheckCircle2 className="w-2.5 h-2.5" /> Completed
      </span>
    );
  if (s === "failed")
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
        <AlertTriangle className="w-2.5 h-2.5" /> Failed
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
      <Clock className="w-2.5 h-2.5" /> Processing
    </span>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({
  title,
  description,
  icon: Icon,
  children,
  danger,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
        danger ? "border-rose-100" : "border-[#ecebe6]"
      }`}
    >
      <div
        className={`px-6 py-5 border-b ${
          danger ? "border-rose-100 bg-rose-50/40" : "border-[#ecebe6]"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              danger ? "bg-rose-100 text-rose-500" : "bg-[#eef8f5] text-[#0a4e3e]"
            }`}
          >
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <h2
              className={`text-sm font-extrabold ${
                danger ? "text-rose-700" : "text-slate-800"
              }`}
            >
              {title}
            </h2>
            <p className="text-xs font-medium text-slate-400 mt-0.5">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function ConfirmModal({
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
  loading,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-rose-100 shadow-2xl max-w-sm w-full p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-800">{title}</h3>
            <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
              {description}
            </p>
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-5">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-xl transition-all disabled:opacity-60 flex items-center gap-2"
          >
            {loading && (
              <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white transition-all ${
        type === "success" ? "bg-[#0a4e3e]" : "bg-rose-500"
      }`}
    >
      {type === "success" ? (
        <CheckCircle2 className="w-4 h-4 shrink-0" />
      ) : (
        <AlertTriangle className="w-4 h-4 shrink-0" />
      )}
      {message}
      <button onClick={onClose} className="ml-1 hover:opacity-70">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user, logout } = useAuth();

  // Data
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [reports, setReports] = useState<SettingsReport[]>([]);

  // Loading states
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingReports, setLoadingReports] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);

  // UI state
  const [showReports, setShowReports] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null); // reportId | "all"
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") =>
    setToast({ message, type });

  const getToken = useCallback(async () => {
    if (!user) throw new Error("Not authenticated");
    return user.getIdToken();
  }, [user]);

  // Fetch profile
  const fetchProfile = useCallback(async () => {
    setLoadingProfile(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/settings/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      setProfile(data.profile);
    } catch {
      // fallback to Firebase client data
      if (user) {
        setProfile({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          stats: { reportCount: 0, biomarkerCount: 0 },
        });
      }
    } finally {
      setLoadingProfile(false);
    }
  }, [getToken, user]);

  // Fetch reports
  const fetchReports = useCallback(async () => {
    setLoadingReports(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/settings/reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch reports");
      const data = await res.json();
      setReports(data.reports ?? []);
    } catch {
      setReports([]);
    } finally {
      setLoadingReports(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchReports();
    }
  }, [user, fetchProfile, fetchReports]);

  // Delete single report
  async function handleDeleteReport(id: string) {
    setDeletingId(id);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/reports/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete");
      setReports((prev) => prev.filter((r) => r.id !== id));
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              stats: {
                ...prev.stats,
                reportCount: Math.max(0, prev.stats.reportCount - 1),
              },
            }
          : prev
      );
      showToast("Report deleted successfully", "success");
    } catch {
      showToast("Failed to delete report", "error");
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  }

  // Delete all data
  async function handleDeleteAll() {
    setDeletingAll(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/settings/data`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete all data");
      setReports([]);
      setProfile((prev) =>
        prev ? { ...prev, stats: { reportCount: 0, biomarkerCount: 0 } } : prev
      );
      showToast("All medical data deleted", "success");
    } catch {
      showToast("Failed to delete data", "error");
    } finally {
      setDeletingAll(false);
      setConfirmDelete(null);
    }
  }

  const displayName = profile?.displayName || user?.displayName || "Patient";
  const email = profile?.email || user?.email || "—";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#f9faf7]">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 bg-white border-b border-[#ecebe6] shrink-0">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#0a4e3e]" />
            Settings
          </h1>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">
            Manage your account, reports, and data
          </p>
        </div>
      </header>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="max-w-2xl space-y-5">

          {/* ── Profile Card ── */}
          <SectionCard
            icon={User}
            title="Your Profile"
            description="Account information linked to your Swasthya session"
          >
            {loadingProfile ? (
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-slate-100 rounded w-2/5" />
                <div className="h-3 bg-slate-100 rounded w-3/5" />
              </div>
            ) : (
              <div className="flex items-center gap-5">
                {/* Avatar */}
                <div className="shrink-0">
                  {profile?.photoURL ? (
                    <img
                      src={profile.photoURL}
                      alt={displayName}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-2xl object-cover border border-[#ecebe6]"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-[#0a4e3e] text-white flex items-center justify-center text-lg font-extrabold border border-[#0a4e3e]/20">
                      {initials}
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-extrabold text-slate-800 truncate">
                    {displayName}
                  </h3>
                  <p className="text-sm text-slate-400 font-medium truncate">{email}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center gap-1.5 bg-[#f0faf5] border border-[#d6ede4] rounded-xl px-3 py-1.5">
                      <BarChart2 className="w-3.5 h-3.5 text-[#0a4e3e]" />
                      <span className="text-xs font-bold text-[#0a4e3e]">
                        {profile?.stats.reportCount ?? 0} Reports
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-purple-50 border border-purple-100 rounded-xl px-3 py-1.5">
                      <FlaskConical className="w-3.5 h-3.5 text-purple-500" />
                      <span className="text-xs font-bold text-purple-600">
                        {profile?.stats.biomarkerCount ?? 0} Biomarkers
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </SectionCard>

          {/* ── Account Actions ── */}
          <SectionCard
            icon={LogOut}
            title="Account Actions"
            description="Sign out of your current session"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700">Sign out</p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  You&apos;ll need to sign in again to access your data
                </p>
              </div>
              <button
                onClick={() => logout()}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-xl transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </SectionCard>

          {/* ── Reports Management ── */}
          <SectionCard
            icon={FileText}
            title="Reports Management"
            description="View and delete individual medical reports"
          >
            <button
              onClick={() => setShowReports((p) => !p)}
              className="w-full flex items-center justify-between text-left"
            >
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  {loadingReports
                    ? "Loading reports…"
                    : `${reports.length} report${reports.length !== 1 ? "s" : ""} on file`}
                </p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Click to expand and manage individual reports
                </p>
              </div>
              {showReports ? (
                <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              )}
            </button>

            {showReports && (
              <div className="mt-5 space-y-2">
                {loadingReports ? (
                  <div className="space-y-2 animate-pulse">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-14 bg-slate-50 rounded-xl" />
                    ))}
                  </div>
                ) : reports.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <FileText className="w-8 h-8 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-400">No reports uploaded yet</p>
                  </div>
                ) : (
                  reports.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between gap-3 bg-slate-50 hover:bg-slate-100/70 border border-transparent hover:border-slate-200 rounded-xl px-4 py-3 transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-700 truncate">{r.reportName}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                            <Calendar className="w-2.5 h-2.5" />
                            {fmtDate(r.uploadDate)}
                          </span>
                          {r.biomarkerCount > 0 && (
                            <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                              <FlaskConical className="w-2.5 h-2.5" />
                              {r.biomarkerCount} biomarkers
                            </span>
                          )}
                          {statusBadge(r.processingStatus)}
                        </div>
                      </div>
                      <button
                        onClick={() => setConfirmDelete(r.id)}
                        disabled={deletingId === r.id}
                        title="Delete report"
                        className="shrink-0 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all disabled:opacity-50"
                      >
                        {deletingId === r.id ? (
                          <span className="w-4 h-4 border-2 border-rose-400 border-t-transparent rounded-full animate-spin inline-block" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </SectionCard>

          {/* ── Danger Zone ── */}
          <SectionCard
            icon={ShieldAlert}
            title="Danger Zone"
            description="Irreversible actions — proceed with caution"
            danger
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-rose-700">Delete all my data</p>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Permanently removes all your reports and biomarker data from Swasthya. This cannot be undone.
                </p>
              </div>
              <button
                onClick={() => setConfirmDelete("all")}
                disabled={reports.length === 0}
                className="ml-4 shrink-0 flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-rose-500 hover:bg-rose-600 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete All
              </button>
            </div>
          </SectionCard>

        </div>
      </div>

      {/* ── Confirm modals ── */}
      {confirmDelete && confirmDelete !== "all" && (
        <ConfirmModal
          title="Delete this report?"
          description="This will permanently delete the report and all its biomarker data from Swasthya. The original file will also be removed from storage."
          confirmLabel="Yes, delete"
          loading={deletingId === confirmDelete}
          onConfirm={() => handleDeleteReport(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {confirmDelete === "all" && (
        <ConfirmModal
          title="Delete all your data?"
          description={`This will permanently delete all ${reports.length} report${reports.length !== 1 ? "s" : ""} and all biomarker data. This action is irreversible.`}
          confirmLabel="Yes, delete everything"
          loading={deletingAll}
          onConfirm={handleDeleteAll}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </main>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { 
  Activity, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  HeartPulse,
  Sparkles,
  LockKeyhole
} from "lucide-react";

type AuthMode = "login" | "register" | "forgot";

export default function AuthPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Redirect if user is already logged in
  useEffect(() => {
    if (!authLoading && user) {

      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
        setSuccess("Success! Redirecting...");
        setTimeout(() => router.push("/dashboard"), 1000);
      } else if (mode === "register") {
        if (!name.trim()) {
          throw new Error("Full Name is required");
        }
        await createUserWithEmailAndPassword(auth, email, password);
        // Firebase user profile name update could be done here, but let's keep it basic first
        setSuccess("Account created successfully! Redirecting...");
        setTimeout(() => router.push("/dashboard"), 1000);
      } else if (mode === "forgot") {
        await sendPasswordResetEmail(auth, email);
        setSuccess("Password reset instructions sent to your email!");
      }
    } catch (err: any) {
      let friendlyMessage = err.message;
      if (err.code === "auth/user-not-found") friendlyMessage = "No user found with this email.";
      else if (err.code === "auth/wrong-password") friendlyMessage = "Incorrect password.";
      else if (err.code === "auth/email-already-in-use") friendlyMessage = "This email is already registered.";
      else if (err.code === "auth/weak-password") friendlyMessage = "Password should be at least 6 characters.";
      else if (err.code === "auth/invalid-email") friendlyMessage = "Invalid email format.";
      
      setError(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      setSuccess("Successfully logged in with Google!");
      setTimeout(() => router.push("/dashboard"), 1000);
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google");
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted text-sm font-medium animate-pulse">Loading Swasthya...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Decorative background spots */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#d0eee6] rounded-full blur-[120px] opacity-60 pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#d8f3ec] rounded-full blur-[120px] opacity-60 pointer-events-none" />

      {/* Auth Card Container */}
      <div className="w-full max-w-5xl bg-card-bg border border-border rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[600px] z-10">
        
        {/* Left Panel: App Branding & Selling Points */}
        <div className="md:w-1/2 bg-gradient-to-br from-primary to-[#0c4a3a] p-8 md:p-12 text-primary-foreground flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          
          {/* Header & Logo */}
          <div className="flex items-center gap-2.5 z-10">
            <div className="p-1 rounded-xl backdrop-blur-md border border-white/20 bg-white/20">
              <img src="/logo.png" alt="Swasthya Logo" className="w-8 h-8 object-contain" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white flex items-center gap-1.5">
              Swasthya <span className="text-xs bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full font-normal">AI Assistant</span>
            </span>
          </div>

          {/* Core Visual Feature Highlights */}
          <div className="my-12 space-y-8 z-10">
            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold tracking-tight leading-tight text-white">
                Your Health, Deciphered.
              </h2>
              <p className="text-emerald-100/80 text-base max-w-md">
                Upload medical reports, translate complex jargon into plain language, track trends, and securely chat with your medical records.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-white/10 p-1.5 rounded-lg mt-0.5">
                  <Activity className="w-4 h-4 text-emerald-300" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">Smart OCR Extraction</h4>
                  <p className="text-sm text-emerald-100/70">Automatically extract biomarkers and key text from reports & PDFs.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="bg-white/10 p-1.5 rounded-lg mt-0.5">
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">AI Explanations</h4>
                  <p className="text-sm text-emerald-100/70">Get immediate, plain-language summaries of complex diagnostics.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Warning / Education note */}
          <div className="text-xs text-emerald-100/50 pt-6 border-t border-white/10 z-10">
            Educational tool only. Never diagnostic. Always consult your doctor.
          </div>
        </div>

        {/* Right Panel: Interactive Form */}
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-foreground">
              {mode === "login" && "Welcome Back"}
              {mode === "register" && "Create Account"}
              {mode === "forgot" && "Reset Password"}
            </h3>
            <p className="text-muted text-sm mt-1.5">
              {mode === "login" && "Please enter your details to sign in to your dashboard"}
              {mode === "register" && "Get started by creating your secure Swasthya account"}
              {mode === "forgot" && "Enter your email to receive recovery instructions"}
            </p>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3.5 rounded-xl flex items-start gap-2.5 mb-6 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3.5 rounded-xl flex items-start gap-2.5 mb-6 text-sm animate-fade-in">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {mode === "register" && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                />
              </div>
            </div>

            {mode !== "forgot" && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider">Password</label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-hover text-white py-3.5 rounded-xl font-semibold text-sm transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  {mode === "login" && "Sign In"}
                  {mode === "register" && "Create Account"}
                  {mode === "forgot" && "Send Reset Link"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {mode !== "forgot" && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card-bg px-3 text-muted">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full border border-border bg-white hover:bg-slate-50 py-3 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2.5 cursor-pointer"
              >
                {/* Simple Custom SVG for Google icon */}
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.47 15.05.5 12 .5 7.33.5 3.39 3.19 1.5 7.12l3.87 3a6.97 6.97 0 0 1 6.63-5.08z" />
                  <path fill="#4285F4" d="M23.49 12.27c0-.82-.07-1.61-.21-2.38H12v4.51h6.46a5.53 5.53 0 0 1-2.4 3.63l3.72 2.89c2.17-2 3.71-4.94 3.71-8.65z" />
                  <path fill="#FBBC05" d="M5.37 10.12a6.98 6.98 0 0 1 0-4.24L1.5 2.88A11.96 11.96 0 0 0 0 12c0 3.25.86 6.3 2.37 8.94l3.87-3.03a6.97 6.97 0 0 1-.87-4.79z" />
                  <path fill="#34A853" d="M12 23.5c3.24 0 5.97-1.07 7.96-2.91l-3.72-2.89c-1.03.69-2.35 1.1-4.24 1.1a6.97 6.97 0 0 1-6.63-5.08L1.5 16.75A11.97 11.97 0 0 0 12 23.5z" />
                </svg>
                Google
              </button>
            </>
          )}

          <div className="mt-8 text-center text-sm">
            {mode === "login" && (
              <p className="text-muted">
                Don't have an account?{" "}
                <button onClick={() => setMode("register")} className="text-primary font-semibold hover:underline">
                  Sign up
                </button>
              </p>
            )}
            {mode === "register" && (
              <p className="text-muted">
                Already have an account?{" "}
                <button onClick={() => setMode("login")} className="text-primary font-semibold hover:underline">
                  Sign in
                </button>
              </p>
            )}
            {mode === "forgot" && (
              <button onClick={() => setMode("login")} className="text-primary font-semibold hover:underline flex items-center justify-center gap-1.5 mx-auto">
                <LockKeyhole className="w-3.5 h-3.5" /> Back to sign in
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

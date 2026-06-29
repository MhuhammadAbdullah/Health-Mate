import React, { useState } from "react";
import { SignIn, SignUp } from "@clerk/clerk-react";

export default function AuthPage() {
  const [mode, setMode] = useState("sign-in");

  return (
    <div className="min-h-screen flex">
      {/* Left hero panel */}
      <div className="hidden lg:flex flex-col justify-between w-[52%] grad-hero p-12 text-white relative overflow-hidden">
        {/* decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5"></div>
        <div className="absolute -bottom-32 -right-20 w-[500px] h-[500px] rounded-full bg-white/5"></div>
        <div className="absolute top-1/2 right-0 w-64 h-64 rounded-full bg-teal-400/10 -translate-y-1/2"></div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
            <i className="ti ti-shield-heart text-2xl text-white"></i>
          </div>
          <div>
            <div className="font-display font-black text-2xl tracking-tight">
              Health<span className="text-teal-200">Mate</span>
            </div>
            <div className="text-white/60 text-xs">Sehat ka Smart Dost</div>
          </div>
        </div>

        {/* Hero copy */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 text-sm font-medium text-white/90 mb-6">
            <i className="bx bx-sparkles text-teal-200"></i>
            AI-Powered Health Management
          </div>
          <h1 className="font-display font-black text-5xl leading-tight mb-5">
            Apni Sehat<br/>
            <span className="text-teal-200">Smart Tarike</span><br/>
            Se Manage Karein
          </h1>
          <p className="text-white/70 text-lg leading-relaxed mb-10 max-w-md">
            Upload medical reports, get instant AI analysis in English & Roman Urdu, track vitals, find nearest hospitals, and stay prepared for emergencies.
          </p>

          {/* Feature bullets */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon:"ti ti-brain",           label:"AI Report Analysis",     sub:"Instant insights" },
              { icon:"bx bx-shield-quarter",  label:"100% Secure & Private",  sub:"Your data only" },
              { icon:"ti ti-building-hospital",label:"Hospital Locator",       sub:"Pakistan-wide" },
              { icon:"bx bx-pulse",            label:"Vitals Tracking",        sub:"With AI advice" },
            ].map((f,i) => (
              <div key={i} className="flex items-start gap-3 bg-white/10 rounded-2xl p-4">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <i className={`${f.icon} text-xl text-white`}></i>
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{f.label}</div>
                  <div className="text-xs text-white/55 mt-0.5">{f.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom trust */}
        <div className="relative z-10 flex items-center gap-6 text-white/50 text-xs">
          <span className="flex items-center gap-1.5"><i className="ti ti-lock text-teal-300"></i> End-to-end encrypted</span>
          <span className="flex items-center gap-1.5"><i className="ti ti-shield-check text-teal-300"></i> HIPAA-inspired privacy</span>
          <span className="flex items-center gap-1.5"><i className="bx bx-globe text-teal-300"></i> Made for Pakistan</span>
        </div>
      </div>

      {/* Right auth panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gray-50 min-h-screen">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-teal-400 flex items-center justify-center">
            <i className="ti ti-shield-heart text-2xl text-white"></i>
          </div>
          <div>
            <div className="font-display font-black text-2xl text-gray-900 tracking-tight">
              Health<span className="text-teal-400">Mate</span>
            </div>
            <div className="text-gray-400 text-xs">Sehat ka Smart Dost</div>
          </div>
        </div>

        {/* Welcome text */}
        <div className="w-full max-w-[420px] mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === "sign-in" ? "Welcome back! 👋" : "Create your account 🌟"}
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {mode === "sign-in"
              ? "Sign in to access your personal health vault"
              : "Join HealthMate — your AI health companion"}
          </p>
        </div>

        {/* Toggle tabs */}
        <div className="w-full max-w-[420px] mb-6">
          <div className="flex bg-gray-100 rounded-xl p-1">
            {["sign-in","sign-up"].map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  mode === m ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}>
                {m === "sign-in" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>
        </div>

        {/* Clerk components */}
        <div className="w-full max-w-[420px] animate-scale-in">
          {mode === "sign-in" ? (
            <SignIn
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none border border-gray-100 rounded-2xl bg-white p-6 w-full",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton: "auth-social-btn !border-gray-200",
                  formButtonPrimary: "btn-primary w-full justify-center py-3 text-sm !rounded-xl",
                  formFieldInput: "field",
                  footerActionLink: "text-teal-600 font-semibold hover:text-teal-800",
                  dividerLine: "bg-gray-100",
                  dividerText: "text-gray-400 text-xs",
                  identityPreviewEditButton: "text-teal-600",
                  formFieldLabel: "text-sm font-medium text-gray-700",
                },
              }}
              signUpUrl="/auth"
              afterSignInUrl="/dashboard"
            />
          ) : (
            <SignUp
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-none border border-gray-100 rounded-2xl bg-white p-6 w-full",
                  headerTitle: "hidden",
                  headerSubtitle: "hidden",
                  socialButtonsBlockButton: "auth-social-btn !border-gray-200",
                  formButtonPrimary: "btn-primary w-full justify-center py-3 text-sm !rounded-xl",
                  formFieldInput: "field",
                  footerActionLink: "text-teal-600 font-semibold hover:text-teal-800",
                  dividerLine: "bg-gray-100",
                  dividerText: "text-gray-400 text-xs",
                  formFieldLabel: "text-sm font-medium text-gray-700",
                },
              }}
              signInUrl="/auth"
              afterSignUpUrl="/dashboard"
            />
          )}
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          <i className="ti ti-lock text-teal-400 mr-1"></i>
          Secured by <span className="font-semibold text-gray-500">Clerk</span> · Your data is private and encrypted
        </p>
      </div>
    </div>
  );
}

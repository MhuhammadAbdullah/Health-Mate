import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../lib/api";
import toast from "react-hot-toast";
import { format } from "date-fns";

const READING_CONFIG = [
  { key: "bloodPressureSystolic", label: "Blood Pressure", unit: "mmHg", icon: "bx bx-heart", color: "text-teal-600",
    render: v => v.bloodPressureSystolic ? `${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}` : null },
  { key: "heartRate",        label: "Heart Rate",   unit: "bpm",   icon: "bx bxs-heart",       color: "text-red-500",    render: v => v.heartRate },
  { key: "bloodSugar",       label: "Blood Sugar",  unit: "mg/dL", icon: "bx bx-droplet",      color: "text-blue-600",   render: v => v.bloodSugar },
  { key: "weight",           label: "Weight",       unit: "kg",    icon: "bx bx-body",         color: "text-purple-600", render: v => v.weight },
  { key: "height",           label: "Height",       unit: "cm",    icon: "ti ti-ruler",         color: "text-indigo-600", render: v => v.height },
  { key: "oxygenSaturation", label: "SpO2",         unit: "%",     icon: "bx bx-wind",         color: "text-teal-500",   render: v => v.oxygenSaturation },
  { key: "temperature",      label: "Temperature",  unit: "°F",    icon: "bx bx-thermometer",  color: "text-amber-600",  render: v => v.temperature },
];

export default function VitalDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vital, setVital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reanalyzing, setReanalyzing] = useState(false);
  const pollRef  = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchVital = () =>
      api.get(`/vitals/${id}`)
        .then(r => { if (mountedRef.current) setVital(r.data.vital); return r.data.vital; })
        .catch(err => {
          if (!mountedRef.current) return null;
          // Only leave the page for a genuine 404 — not for auth/network hiccups
          if (err?.response?.status === 404) {
            toast.error("Vital not found");
            navigate("/vitals");
          }
          return null;
        });

    fetchVital().then(v => {
      if (!mountedRef.current || !v || v.aiAnalysis?.summary) return;
      // AI hasn't finished yet — poll every 6 s, cap at 20 attempts (120 s)
      let attempts = 0;
      pollRef.current = setInterval(async () => {
        if (!mountedRef.current) { clearInterval(pollRef.current); return; }
        attempts++;
        const updated = await api.get(`/vitals/${id}`).then(r => r.data.vital).catch(() => null);
        if (updated?.aiAnalysis?.summary) {
          if (mountedRef.current) { setVital(updated); toast.success("AI analysis ready!"); }
          clearInterval(pollRef.current);
        } else if (attempts >= 20) {
          clearInterval(pollRef.current);
        }
      }, 6000);
    }).finally(() => { if (mountedRef.current) setLoading(false); });

    return () => { mountedRef.current = false; clearInterval(pollRef.current); };
  }, [id, navigate]);

  const reanalyze = async () => {
    setReanalyzing(true);
    clearInterval(pollRef.current);
    const startedAt = Date.now();
    const toastId = toast.loading("AI is analyzing your vitals...");
    try {
      // Backend returns 200 immediately; AI runs in background
      await api.post(`/vitals/${id}/analyze`);

      // Poll until a fresh analyzedAt timestamp appears (cap at 20 × 6 s = 120 s)
      let attempts = 0;
      pollRef.current = setInterval(async () => {
        if (!mountedRef.current) { clearInterval(pollRef.current); return; }
        attempts++;
        const updated = await api.get(`/vitals/${id}`).then(r => r.data.vital).catch(() => null);
        const at = updated?.aiAnalysis?.analyzedAt;
        if (at && new Date(at).getTime() > startedAt) {
          if (mountedRef.current) {
            setVital(updated);
            setReanalyzing(false);
            toast.success("AI analysis updated!", { id: toastId });
          }
          clearInterval(pollRef.current);
        } else if (attempts >= 20) {
          clearInterval(pollRef.current);
          if (mountedRef.current) {
            setReanalyzing(false);
            toast.error("AI analysis timed out — try again", { id: toastId });
          }
        }
      }, 6000);
    } catch (err) {
      if (mountedRef.current) {
        setReanalyzing(false);
        toast.error("Failed to start analysis — try again", { id: toastId });
      }
    }
  };

  const del = async () => {
    if (!window.confirm("Delete this vitals entry?")) return;
    await api.delete(`/vitals/${id}`);
    toast.success("Deleted");
    navigate("/vitals");
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-10 h-10 border-2 border-teal-100 border-t-teal-400 rounded-full animate-spin"></div>
    </div>
  );
  if (!vital) return null;

  const ai = vital.aiAnalysis;
  const statusColor = ai?.overallStatus === "critical"
    ? "border-red-200 bg-red-50"
    : ai?.overallStatus === "concerning"
    ? "border-amber-200 bg-amber-50"
    : "border-teal-100 bg-teal-50";

  const bmi = vital.weight && vital.height
    ? (vital.weight / ((vital.height / 100) ** 2)).toFixed(1)
    : null;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Back + actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => navigate("/vitals")} className="btn-ghost">
          <i className="ti ti-arrow-left text-lg"></i>
        </button>
        <div className="flex-1"></div>
        <button onClick={reanalyze} disabled={reanalyzing} className="btn-secondary text-xs gap-2">
          {reanalyzing
            ? <><div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>Analyzing...</>
            : <><i className="bx bx-brain text-base text-purple-500"></i>Re-analyze with AI</>}
        </button>
        <button onClick={del} className="btn-danger text-xs">
          <i className="ti ti-trash text-base"></i> Delete
        </button>
      </div>

      {/* Hero */}
      <div className="grad-hero rounded-2xl p-6 text-white shadow-xl">
        <p className="text-teal-200 text-xs uppercase tracking-widest mb-1">Vitals Entry</p>
        <h1 className="font-display font-black text-xl text-white">
          {format(new Date(vital.date), "MMMM d, yyyy")}
        </h1>
        {vital.notes && (
          <p className="text-white/70 text-sm mt-2 flex items-center gap-1.5">
            <i className="bx bx-pin text-[14px]"></i> {vital.notes}
          </p>
        )}
        {ai?.overallStatus && (
          <span className={`mt-3 inline-flex badge ${ai.overallStatus === "critical" ? "badge-danger" : ai.overallStatus === "concerning" ? "badge-amber" : "badge-ok"}`}>
            <i className="bx bx-brain text-[11px]"></i>
            AI: {ai.overallStatus.charAt(0).toUpperCase() + ai.overallStatus.slice(1)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          {/* Readings */}
          <div className="card p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-4">Readings</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {READING_CONFIG.map(cfg => {
                const val = cfg.render(vital);
                if (!val) return null;
                return (
                  <div key={cfg.key} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <i className={`${cfg.icon} text-2xl ${cfg.color}`}></i>
                    <div>
                      <div className="text-[10px] text-gray-400">{cfg.label}</div>
                      <div className={`text-lg font-black ${cfg.color}`}>
                        {val}<span className="text-[10px] font-normal text-gray-400 ml-0.5">{cfg.unit}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {bmi && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <i className="bx bx-stats text-2xl text-emerald-600"></i>
                  <div>
                    <div className="text-[10px] text-gray-400">BMI</div>
                    <div className="text-lg font-black text-emerald-600">
                      {bmi}<span className="text-[10px] font-normal text-gray-400 ml-0.5">kg/m²</span>
                    </div>
                  </div>
                </div>
              )}
              {vital.bloodSugarType && vital.bloodSugar && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl col-span-1">
                  <i className="bx bx-time text-2xl text-blue-400"></i>
                  <div>
                    <div className="text-[10px] text-gray-400">Sugar Type</div>
                    <div className="text-sm font-bold text-blue-600 capitalize">{vital.bloodSugarType.replace("_", " ")}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Analysis */}
          {ai?.summary ? (
            <div className={`card p-5 border-2 ${statusColor} space-y-4`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <i className="bx bx-brain text-2xl text-purple-500"></i>
                  <div>
                    <div className="text-sm font-bold text-gray-900">AI Analysis</div>
                    {ai.analyzedAt && (
                      <div className="text-xs text-gray-400">{format(new Date(ai.analyzedAt), "MMM d, h:mm a")}</div>
                    )}
                  </div>
                </div>
                {ai.urgency && (
                  <span className={`badge ${ai.urgency === "HIGH" ? "badge-danger" : ai.urgency === "MEDIUM" ? "badge-amber" : "badge-ok"}`}>
                    <i className="ti ti-alert-circle text-[10px]"></i> {ai.urgency} Urgency
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-700 leading-relaxed">{ai.summary}</p>
              {ai.romanUrduSummary && (
                <p className="text-xs text-gray-500 italic leading-relaxed border-t border-gray-100 pt-3">{ai.romanUrduSummary}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {ai.abnormalFindings?.length > 0 && (
                  <div className="p-3 bg-orange-50 rounded-xl border border-orange-100">
                    <div className="flex items-center gap-1.5 mb-2">
                      <i className="ti ti-alert-triangle text-orange-500"></i>
                      <span className="text-xs font-bold text-orange-700 uppercase tracking-wide">Concerns</span>
                    </div>
                    <ul className="space-y-1">
                      {ai.abnormalFindings.map((f, i) => (
                        <li key={i} className="text-xs text-gray-700 flex gap-2"><span className="text-orange-400">•</span>{f}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {ai.dietAdvice?.length > 0 && (
                  <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                    <div className="flex items-center gap-1.5 mb-2">
                      <i className="bx bx-food-menu text-green-600"></i>
                      <span className="text-xs font-bold text-green-700 uppercase tracking-wide">Diet Advice</span>
                    </div>
                    <ul className="space-y-1">
                      {ai.dietAdvice.map((d, i) => (
                        <li key={i} className="text-xs text-gray-700 flex gap-2"><span className="text-teal-400">•</span>{d}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {ai.lifestyleAdvice?.length > 0 && (
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-1.5 mb-2">
                      <i className="bx bx-run text-blue-600"></i>
                      <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">Lifestyle</span>
                    </div>
                    <ul className="space-y-1">
                      {ai.lifestyleAdvice.map((l, i) => (
                        <li key={i} className="text-xs text-gray-700 flex gap-2"><span className="text-blue-400">•</span>{l}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {ai.specialistRecommended && ai.specialistRecommended !== "None" && (
                  <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                    <div className="flex items-center gap-1.5 mb-2">
                      <i className="bx bx-user-pin text-purple-600"></i>
                      <span className="text-xs font-bold text-purple-700 uppercase tracking-wide">See a Specialist</span>
                    </div>
                    <p className="text-sm font-semibold text-purple-800">{ai.specialistRecommended}</p>
                  </div>
                )}
              </div>

              {ai.doctorQuestions?.length > 0 && (
                <div className="p-3 bg-white rounded-xl border border-gray-100">
                  <div className="flex items-center gap-1.5 mb-3">
                    <i className="bx bx-chat text-blue-500"></i>
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Questions for Your Doctor</span>
                  </div>
                  <div className="space-y-2">
                    {ai.doctorQuestions.map((q, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                        <p className="text-xs text-gray-700 leading-relaxed">{q}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2.5 bg-teal-50 border border-teal-100 rounded-xl p-3">
                <i className="ti ti-shield-check text-teal-500 text-lg flex-shrink-0 mt-0.5"></i>
                <p className="text-xs text-teal-700 leading-relaxed">
                  <strong>Disclaimer:</strong> Yeh AI sirf samajhne ke liye hai. Always consult your doctor before making health decisions.
                </p>
              </div>
            </div>
          ) : (
            <div className="card p-6 border-dashed border-2 border-purple-100 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto">
                <i className="bx bx-brain text-3xl text-purple-300"></i>
              </div>
              {reanalyzing ? (
                <>
                  <div className="w-6 h-6 border-2 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
                  <p className="text-sm text-purple-500 font-medium">AI is analyzing your vitals...</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-500 font-medium">
                    {vital?.createdAt && !vital?.aiAnalysis?.summary
                      ? "AI analysis is still processing in the background"
                      : "No AI analysis available for this entry"}
                  </p>
                  <p className="text-xs text-gray-400">Click below to run AI analysis now</p>
                  <button onClick={reanalyze} className="btn-primary mx-auto inline-flex mt-2">
                    <i className="bx bx-brain text-lg"></i> Run AI Analysis
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Entry Info</p>
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center">
                  <i className="ti ti-calendar text-[14px] text-gray-400"></i>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400">Date</div>
                  <div className="text-xs font-semibold text-gray-800">{format(new Date(vital.date), "MMM d, yyyy")}</div>
                </div>
              </div>
              {vital.notes && (
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center">
                    <i className="bx bx-pin text-[14px] text-gray-400"></i>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400">Notes</div>
                    <div className="text-xs font-semibold text-gray-800">{vital.notes}</div>
                  </div>
                </div>
              )}
              {vital.createdAt && (
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center">
                    <i className="bx bx-time text-[14px] text-gray-400"></i>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400">Logged At</div>
                    <div className="text-xs font-semibold text-gray-800">{format(new Date(vital.createdAt), "MMM d, h:mm a")}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Browse Hospitals */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <i className="ti ti-building-hospital text-teal-600 text-lg"></i>
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Hospitals</span>
            </div>
            <p className="text-xs text-gray-400 mb-3 leading-relaxed">
              Find verified hospitals and clinics near you.
            </p>
            <button
              onClick={() => navigate("/hospitals")}
              className="w-full btn-primary text-sm justify-center">
              <i className="ti ti-building-hospital text-base"></i>
              Browse Hospitals
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

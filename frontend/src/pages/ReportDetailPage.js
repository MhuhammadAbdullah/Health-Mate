import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../lib/api";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { getRT, STATUS_CONFIG } from "../lib/utils";

function AiSection({ ai, hospitals }) {
  const [lang, setLang] = useState("en");
  if (!ai?.summary) return (
    <div className="card p-5 border-dashed border-2 border-gray-200 text-center">
      <i className="bx bx-brain text-4xl text-gray-200"></i>
      <p className="text-sm text-gray-400 mt-2">No AI analysis available</p>
      <p className="text-xs text-gray-300">AI analysis runs automatically on report upload when file is attached</p>
    </div>
  );

  const urgencyColor = ai.urgency === "HIGH" ? "border-red-200 bg-red-50" : ai.urgency === "MEDIUM" ? "border-amber-200 bg-amber-50" : "border-teal-100 bg-teal-50";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={`card p-4 border-2 ${urgencyColor}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <i className="bx bx-brain text-2xl text-purple-500"></i>
            <div>
              <div className="text-sm font-bold text-gray-900">AI Analysis</div>
              <div className="text-xs text-gray-400">Powered by Claude AI</div>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              {["en","ur"].map(l => (
                <button key={l} onClick={() => setLang(l)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${lang===l ? "bg-white text-teal-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                  {l === "en" ? "English" : "Roman Urdu"}
                </button>
              ))}
            </div>
            {ai.urgency && (
              <span className={`badge ${ai.urgency==="HIGH" ? "badge-danger" : ai.urgency==="MEDIUM" ? "badge-amber" : "badge-ok"}`}>
                <i className="ti ti-alert-circle text-[10px]"></i> {ai.urgency} Urgency
              </span>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">
          {lang === "en" ? ai.summary : ai.romanUrduSummary || ai.summary}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ai.abnormalValues && ai.abnormalValues !== "None detected" && (
          <div className="ai-block-warn">
            <div className="flex items-center gap-2 mb-2">
              <i className="ti ti-alert-triangle text-orange-500 text-lg"></i>
              <span className="text-xs font-bold text-orange-700 uppercase tracking-wide">Abnormal Values</span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{ai.abnormalValues}</p>
          </div>
        )}
        {ai.normalValues && (
          <div className="ai-block">
            <div className="flex items-center gap-2 mb-2">
              <i className="ti ti-circle-check text-teal-500 text-lg"></i>
              <span className="text-xs font-bold text-teal-700 uppercase tracking-wide">Normal Values</span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{ai.normalValues}</p>
          </div>
        )}
        {ai.dietAdvice && (
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <i className="bx bx-food-menu text-green-500 text-lg"></i>
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Diet Advice</span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{ai.dietAdvice}</p>
          </div>
        )}
        {ai.homeRemedies && (
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <i className="bx bxs-leaf text-emerald-500 text-lg"></i>
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Home Remedies</span>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">{ai.homeRemedies}</p>
          </div>
        )}
      </div>

      {ai.doctorQuestions && (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <i className="bx bx-chat text-blue-500 text-lg"></i>
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Questions to Ask Your Doctor</span>
          </div>
          <div className="space-y-2">
            {ai.doctorQuestions.split(/\d+\.|•|-/).filter(q => q.trim()).map((q, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                <p className="text-sm text-gray-700 leading-relaxed">{q.trim()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Hospitals */}
      {hospitals?.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <i className="bx bxs-building text-purple-500 text-lg"></i>
            <span className="text-xs font-bold text-purple-700 uppercase tracking-wide">AI-Suggested Hospitals</span>
            <span className="badge badge-purple text-[10px]">Based on your report urgency</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {hospitals.map((h, i) => (
              <div key={i} className="flex flex-col gap-2 p-3 bg-purple-50 rounded-xl border border-purple-100">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <i className="bx bxs-building text-purple-500 text-lg"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900">{h.name}</div>
                    <div className="text-xs text-gray-500">{h.address}</div>
                    <a href={`tel:${h.phone}`} className="text-xs text-purple-600 font-semibold flex items-center gap-1 mt-1 hover:underline">
                      <i className="bx bx-phone-call text-[13px]"></i> {h.phone}
                    </a>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.name + " " + h.address)}`}
                    target="_blank" rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-white border border-purple-200 text-[11px] font-semibold text-purple-700 hover:bg-purple-100 transition-all">
                    <i className="bx bx-map-alt text-[14px]"></i> Open in Maps
                  </a>
                  <Link
                    to="/hospitals"
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-purple-600 text-[11px] font-semibold text-white hover:bg-purple-700 transition-all">
                    <i className="bx bxs-building text-[13px]"></i> View Hospital
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-2.5 bg-teal-50 border border-teal-100 rounded-xl p-3.5">
        <i className="ti ti-shield-check text-teal-500 text-lg flex-shrink-0 mt-0.5"></i>
        <p className="text-xs text-teal-700 leading-relaxed">
          <strong>Disclaimer:</strong> Yeh AI sirf samajhne ke liye hai, ilaaj ke liye nahi. Always consult your doctor before making any health decisions based on this analysis.
        </p>
      </div>
    </div>
  );
}

export default function ReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reanalyzing, setReanalyzing] = useState(false);

  useEffect(() => {
    api.get(`/reports/${id}`)
      .then(r => setReport(r.data.report))
      .catch(() => { toast.error("Report not found"); navigate("/reports"); })
      .finally(() => setLoading(false));
  }, [id]);

  const reanalyze = async () => {
    setReanalyzing(true);
    toast("AI is analyzing your report...", { icon: "🤖" });
    try {
      const { data } = await api.post(`/reports/${id}/analyze`);
      setReport(p => ({ ...p, aiAnalysis: data.aiAnalysis }));
      toast.success("AI analysis updated!");
    } catch { toast.error("Analysis failed"); }
    finally { setReanalyzing(false); }
  };

  const toggleStar = async () => {
    const { data } = await api.patch(`/reports/${id}/star`);
    setReport(p => ({ ...p, isStarred: data.isStarred }));
    toast.success(data.isStarred ? "Starred ⭐" : "Unstarred");
  };

  const del = async () => {
    if (!window.confirm("Delete this report permanently?")) return;
    await api.delete(`/reports/${id}`);
    toast.success("Report deleted");
    navigate("/reports");
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-2 border-teal-100 border-t-teal-400 rounded-full animate-spin"></div></div>;
  if (!report) return null;

  const rt = getRT(report.type);
  const sc = STATUS_CONFIG[report.status] || STATUS_CONFIG.pending;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Back + actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => navigate("/reports")} className="btn-ghost">
          <i className="ti ti-arrow-left text-lg"></i>
        </button>
        <div className="flex-1"></div>
        <button onClick={reanalyze} disabled={reanalyzing}
          className="btn-secondary text-xs gap-2">
          {reanalyzing ? <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div> : <i className="bx bx-brain text-base text-purple-500"></i>}
          {reanalyzing ? "Analyzing..." : "Re-analyze with AI"}
        </button>
        <button onClick={toggleStar}
          className={`btn-secondary text-xs ${report.isStarred ? "text-amber-500" : ""}`}>
          <i className={`${report.isStarred ? "bx bxs-star text-amber-400" : "bx bx-star"} text-base`}></i>
          {report.isStarred ? "Starred" : "Star"}
        </button>
        <button onClick={del} className="btn-danger text-xs">
          <i className="ti ti-trash text-base"></i> Delete
        </button>
      </div>

      {/* Header card */}
      <div className="grad-hero rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${rt.bg}`}>
              <i className={`${rt.icon} text-3xl ${rt.color}`}></i>
            </div>
            <div>
              <p className="text-teal-200 text-xs uppercase tracking-widest mb-1">Medical Report</p>
              <h1 className="font-display font-black text-xl lg:text-2xl text-white leading-tight">{report.title}</h1>
              <div className="flex flex-wrap gap-3 mt-2 text-white/70 text-xs">
                <span className="flex items-center gap-1"><i className="ti ti-calendar text-[13px]"></i> {format(new Date(report.date), "MMMM d, yyyy")}</span>
                {report.labName && <span className="flex items-center gap-1"><i className="bx bxs-building text-[13px]"></i> {report.labName}</span>}
                {report.doctorName && <span className="flex items-center gap-1"><i className="bx bx-user-pin text-[13px]"></i> {report.doctorName}</span>}
              </div>
            </div>
          </div>
          <span className={sc.cls}><i className={`${sc.icon} text-xs`}></i> {sc.label}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          {/* Report info */}
          {(report.description || report.findings) && (
            <div className="card p-5 space-y-4">
              {report.description && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <i className="ti ti-notes text-teal-500 text-lg"></i>
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Description</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{report.description}</p>
                </div>
              )}
              {report.findings && (
                <div className="border-t border-gray-50 pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="fa-solid fa-microscope text-emerald-500 text-base"></i>
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Key Findings</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{report.findings}</p>
                </div>
              )}
              {report.notes && (
                <div className="border-t border-gray-50 pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="bx bx-pin text-amber-500 text-lg"></i>
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Personal Notes</span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{report.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* AI Analysis */}
          <AiSection ai={report.aiAnalysis} hospitals={report.suggestedHospitals} />
        </div>

        <div className="space-y-4">
          {/* Meta */}
          <div className="card p-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Report Info</p>
            <div className="space-y-3">
              {[
                { icon:"ti ti-calendar", l:"Date", v: format(new Date(report.date), "MMM d, yyyy") },
                { icon:"bx bxs-building", l:"Lab", v: report.labName || "—" },
                { icon:"bx bx-user-pin", l:"Doctor", v: report.doctorName || "—" },
                { icon:"bx bx-file", l:"Type", v: rt.label },
              ].map((x,i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0">
                    <i className={`${x.icon} text-[14px] text-gray-400`}></i>
                  </div>
                  <div>
                    <div className="text-[10px] text-gray-400">{x.l}</div>
                    <div className="text-xs font-semibold text-gray-800">{x.v}</div>
                  </div>
                </div>
              ))}
            </div>
            {report.tags?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-50 flex flex-wrap gap-1.5">
                {report.tags.map(t => <span key={t} className="badge badge-info text-[10px]">#{t}</span>)}
              </div>
            )}
          </div>

          {/* File attachment */}
          {report.fileUrl && (
            <div className="card p-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Attached File</p>
              {report.fileType === "image" ? (
                <a href={report.fileUrl} target="_blank" rel="noreferrer">
                  <img src={report.fileUrl} alt="Report" className="w-full rounded-xl object-contain max-h-48 border border-gray-100" />
                  <span className="text-xs text-teal-600 font-semibold flex items-center gap-1 mt-2 hover:underline">
                    <i className="ti ti-external-link text-sm"></i> View Full Image
                  </span>
                </a>
              ) : (
                <a href={report.fileUrl} target="_blank" rel="noreferrer"
                  className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all">
                  <i className="fa-solid fa-file-pdf text-blue-500 text-3xl flex-shrink-0"></i>
                  <div>
                    <div className="text-sm font-semibold text-blue-700">View PDF Report</div>
                    <div className="text-xs text-blue-400">Click to open</div>
                  </div>
                  <i className="ti ti-external-link text-blue-400 text-sm ml-auto"></i>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

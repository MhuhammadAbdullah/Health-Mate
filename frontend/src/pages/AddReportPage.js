import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import api from "../lib/api";
import toast from "react-hot-toast";
import { REPORT_TYPES } from "../lib/utils";

export default function AddReportPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ title:"", type:"", date: new Date().toISOString().split("T")[0], labName:"", doctorName:"", description:"", findings:"", notes:"", status:"pending", tags:"", city: "" });

  useEffect(() => {
    if (user?.unsafeMetadata?.city) {
      setForm(p => ({ ...p, city: p.city || user.unsafeMetadata.city }));
    }
  }, [user]);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiRunning, setAiRunning] = useState(false);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const pickType = t => {
    const rt = REPORT_TYPES.find(x => x.value === t);
    setForm(p => ({ ...p, type: t, title: p.title || rt.label }));
    setStep(2);
  };

  const handleFile = e => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    if (f.type.startsWith("image/")) {
      const r = new FileReader();
      r.onload = ev => setPreview(ev.target.result);
      r.readAsDataURL(f);
    } else setPreview("pdf");
  };

  const submit = async e => {
    e.preventDefault();
    if (!form.type) return toast.error("Select a report type first");
    if (!form.title) return toast.error("Report title is required");
    if (!form.date) return toast.error("Date is required");
    setLoading(true);
    setAiRunning(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k,v]) => { if (v) fd.append(k, v); });
      if (file) fd.append("file", file);
      // Let Axios set Content-Type with boundary automatically for FormData
      await api.post("/reports", fd);
      toast.success("Report saved with AI analysis! ✨");
      navigate("/reports");
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally { setLoading(false); setAiRunning(false); }
  };

  const fl = { label: c => <label className="block text-xs font-semibold text-gray-600 mb-1.5">{c}</label> };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/reports")} className="btn-ghost">
          <i className="ti ti-arrow-left text-lg"></i>
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Add Medical Report</h1>
          <p className="text-sm text-gray-400">AI will analyze and suggest hospitals automatically</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-6">
        {[{n:1,l:"Select Type"},{n:2,l:"Details"},{n:3,l:"Upload File"}].map(s => (
          <React.Fragment key={s.n}>
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                step >= s.n ? "bg-teal-400 text-white shadow-md" : "bg-gray-100 text-gray-400"}`}>{s.n}</div>
              <span className={`text-xs font-medium hidden sm:inline ${step >= s.n ? "text-teal-600" : "text-gray-400"}`}>{s.l}</span>
            </div>
            {s.n < 3 && <div className={`flex-1 h-0.5 rounded-full transition-all duration-500 ${step > s.n ? "bg-teal-400" : "bg-gray-100"}`}></div>}
          </React.Fragment>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-5">
        {/* STEP 1 */}
        {step >= 1 && (
          <div className={`card p-5 ${step > 1 ? "opacity-75" : ""}`}>
            <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-teal-400 text-white text-xs flex items-center justify-center">1</span>
              Select Report Type
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {REPORT_TYPES.map(t => (
                <button key={t.value} type="button" onClick={() => pickType(t.value)}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all duration-150 ${
                    form.type === t.value
                      ? "border-teal-400 bg-teal-50 shadow-sm"
                      : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                  }`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${t.bg}`}>
                    <i className={`${t.icon} text-lg ${t.color}`}></i>
                  </div>
                  <span className={`text-xs font-semibold leading-tight ${form.type === t.value ? "text-teal-700" : "text-gray-700"}`}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step >= 2 && (
          <div className="card p-5 animate-fade-up">
            <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-teal-400 text-white text-xs flex items-center justify-center">2</span>
              Report Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                {fl.label("Report Title *")}
                <input className="field" value={form.title} onChange={set("title")} placeholder="e.g. CBC Report — Aga Khan Lab" required />
              </div>
              <div>
                {fl.label("Report Date *")}
                <input className="field" type="date" value={form.date} onChange={set("date")} required />
              </div>
              <div>
                {fl.label("Status")}
                <select className="field" value={form.status} onChange={set("status")}>
                  <option value="pending">Pending Review</option>
                  <option value="normal">Normal</option>
                  <option value="abnormal">Abnormal</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                {fl.label("Lab / Hospital")}
                <input className="field" value={form.labName} onChange={set("labName")} placeholder="Aga Khan Lab, Karachi" />
              </div>
              <div>
                {fl.label("Doctor Name")}
                <input className="field" value={form.doctorName} onChange={set("doctorName")} placeholder="Dr. Ahmed Khan" />
              </div>
              <div>
                {fl.label("Your City (for hospital suggestions)")}
                <input className="field" value={form.city} onChange={set("city")} placeholder="Karachi" />
              </div>
              <div>
                {fl.label("Tags")}
                <input className="field" value={form.tags} onChange={set("tags")} placeholder="anemia, CBC, follow-up" />
              </div>
              <div className="sm:col-span-2">
                {fl.label("Description / Summary")}
                <textarea className="field" rows={3} style={{resize:"vertical"}} value={form.description} onChange={set("description")} placeholder="Short description of this report..." />
              </div>
              <div className="sm:col-span-2">
                {fl.label("Key Findings")}
                <textarea className="field" rows={3} style={{resize:"vertical"}} value={form.findings} onChange={set("findings")} placeholder="e.g. Hb: 10.8 (Low), WBC: 11.2 (Elevated), Platelets: Normal" />
              </div>
              <div className="sm:col-span-2">
                {fl.label("Personal Notes")}
                <textarea className="field" rows={2} style={{resize:"vertical"}} value={form.notes} onChange={set("notes")} placeholder="Your notes about this report..." />
              </div>
            </div>
            <button type="button" onClick={() => setStep(3)} className="btn-primary mt-4">
              Continue <i className="ti ti-arrow-right text-base"></i>
            </button>
          </div>
        )}

        {/* STEP 3 */}
        {step >= 3 && (
          <div className="card p-5 animate-fade-up">
            <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-teal-400 text-white text-xs flex items-center justify-center">3</span>
              Upload File <span className="text-gray-400 font-normal">(optional)</span>
            </h2>

            {!file ? (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-teal-200 hover:border-teal-400 rounded-2xl p-10 bg-teal-50/30 cursor-pointer transition-all duration-200 group">
                <i className="bx bx-cloud-upload text-5xl text-teal-300 group-hover:text-teal-400 transition-colors mb-2"></i>
                <span className="text-sm font-semibold text-teal-600">Drop file or click to upload</span>
                <span className="text-xs text-gray-400 mt-1">PDF, JPG, PNG, WEBP — Max 15MB</span>
                <span className="text-xs text-teal-500 mt-2 font-medium">🤖 AI will analyze automatically</span>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleFile} className="hidden" />
              </label>
            ) : (
              <div className="flex items-center gap-4 p-4 bg-teal-50 border border-teal-100 rounded-2xl">
                {preview && preview !== "pdf"
                  ? <img src={preview} alt="" className="w-14 h-14 object-cover rounded-xl flex-shrink-0" />
                  : <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <i className="fa-solid fa-file-pdf text-blue-500 text-2xl"></i>
                    </div>
                }
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-teal-700 truncate">{file.name}</div>
                  <div className="text-xs text-gray-400">{(file.size/1024/1024).toFixed(2)} MB</div>
                  <div className="text-xs text-teal-500 mt-0.5 flex items-center gap-1">
                    <i className="bx bx-brain text-sm"></i> AI analysis will run on save
                  </div>
                </div>
                <button type="button" onClick={() => { setFile(null); setPreview(null); }}
                  className="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-100 flex items-center justify-center transition-all">
                  <i className="ti ti-x text-red-500 text-sm"></i>
                </button>
              </div>
            )}

            {/* AI notice */}
            <div className="mt-4 flex items-start gap-2.5 bg-gradient-to-r from-purple-50 to-teal-50 border border-purple-100 rounded-xl p-3.5">
              <i className="bx bx-brain text-purple-500 text-xl flex-shrink-0 mt-0.5"></i>
              <div className="text-xs text-gray-600 leading-relaxed">
                <span className="font-bold text-purple-700">AI Analysis Included:</span> After saving, Claude AI will analyze your report and provide: abnormal value highlights, English + Roman Urdu summary, diet advice, home remedies, doctor questions, and <span className="font-semibold text-teal-700">nearest hospital suggestions</span> based on your city.
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button type="button" onClick={() => setStep(2)} className="btn-secondary">
                <i className="ti ti-arrow-left text-base"></i> Back
              </button>
              <button type="submit" disabled={loading}
                className="btn-primary flex-1 justify-center py-3 text-sm relative overflow-hidden">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                    {aiRunning ? "AI Analyzing Report..." : "Saving..."}
                  </>
                ) : (
                  <><i className="bx bxs-save text-lg"></i> Save Report + Run AI Analysis</>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

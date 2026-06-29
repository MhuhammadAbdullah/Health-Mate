import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const PAGE_SIZE = 12;

function Pagination({ page, total, size, onChange }) {
  const pages = Math.ceil(total / size);
  if (pages <= 1) return null;
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  const end   = Math.min(pages, start + 4);
  const nums  = [];
  for (let i = start; i <= end; i++) nums.push(i);
  return (
    <div className="flex items-center justify-center gap-1.5 pt-4">
      <button onClick={() => onChange(page - 1)} disabled={page === 1}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
        <i className="ti ti-chevron-left text-base"></i>
      </button>
      {start > 1 && (
        <>
          <button onClick={() => onChange(1)} className="w-8 h-8 rounded-lg text-sm font-semibold text-gray-500 hover:bg-gray-100 transition-all">1</button>
          {start > 2 && <span className="text-gray-300 text-xs px-0.5">…</span>}
        </>
      )}
      {nums.map(p => (
        <button key={p} onClick={() => onChange(p)}
          className={`w-8 h-8 rounded-lg text-sm font-semibold transition-all ${p === page ? "bg-teal-500 text-white shadow-sm" : "text-gray-500 hover:bg-gray-100"}`}>
          {p}
        </button>
      ))}
      {end < pages && (
        <>
          {end < pages - 1 && <span className="text-gray-300 text-xs px-0.5">…</span>}
          <button onClick={() => onChange(pages)} className="w-8 h-8 rounded-lg text-sm font-semibold text-gray-500 hover:bg-gray-100 transition-all">{pages}</button>
        </>
      )}
      <button onClick={() => onChange(page + 1)} disabled={page === pages}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
        <i className="ti ti-chevron-right text-base"></i>
      </button>
    </div>
  );
}

export default function VitalsPage() {
  const navigate = useNavigate();
  const [vitals,   setVitals]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [page,     setPage]     = useState(1);
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    bloodPressureSystolic: "", bloodPressureDiastolic: "",
    heartRate: "", bloodSugar: "", bloodSugarType: "fasting",
    weight: "", height: "", temperature: "", oxygenSaturation: "", notes: "", city: ""
  });

  useEffect(() => {
    api.get("/vitals").then(r => setVitals(r.data.vitals || [])).finally(() => setLoading(false));
  }, []);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {};
      Object.entries(form).forEach(([k, v]) => { if (v !== "") body[k] = v; });
      const { data } = await api.post("/vitals", body);
      setVitals(p => [data.vital, ...p]);
      setPage(1);
      setShowForm(false);
      setForm({ date: new Date().toISOString().split("T")[0], bloodPressureSystolic: "", bloodPressureDiastolic: "", heartRate: "", bloodSugar: "", bloodSugarType: "fasting", weight: "", height: "", temperature: "", oxygenSaturation: "", notes: "", city: "" });
      toast.success("Vitals saved! AI analysis running in background...", { icon: "🤖", duration: 4000 });
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  const del = async id => {
    if (!window.confirm("Delete this entry?")) return;
    await api.delete(`/vitals/${id}`);
    setVitals(p => p.filter(v => v._id !== id));
    toast.success("Deleted");
  };

  const chartData = [...vitals].reverse().slice(-14).map(v => ({
    date: format(new Date(v.date), "MMM d"),
    bp: v.bloodPressureSystolic, sugar: v.bloodSugar, weight: v.weight,
  }));

  const paged = vitals.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const fields = [
    { k: "bloodPressureSystolic",  l: "BP Systolic",  ph: "120", u: "mmHg", type: "number" },
    { k: "bloodPressureDiastolic", l: "BP Diastolic",  ph: "80",  u: "mmHg", type: "number" },
    { k: "heartRate",              l: "Heart Rate",    ph: "72",  u: "bpm",  type: "number" },
    { k: "bloodSugar",             l: "Blood Sugar",   ph: "95",  u: "mg/dL",type: "number" },
    { k: "weight",                 l: "Weight",        ph: "70",  u: "kg",   type: "number" },
    { k: "height",                 l: "Height",        ph: "170", u: "cm",   type: "number" },
    { k: "temperature",            l: "Temperature",   ph: "98.6",u: "°F",   type: "number" },
    { k: "oxygenSaturation",       l: "SpO2",          ph: "98",  u: "%",    type: "number" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Vitals Tracker</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {vitals.length} records · Page {page} of {Math.max(1, Math.ceil(vitals.length / PAGE_SIZE))}
          </p>
        </div>
        <button onClick={() => setShowForm(o => !o)} className={showForm ? "btn-secondary" : "btn-primary"}>
          <i className={`ti ${showForm ? "ti-x" : "ti-plus"} text-lg`}></i>
          {showForm ? "Cancel" : "Add Entry"}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card p-5 animate-fade-up">
          <div className="flex items-center gap-2 mb-4">
            <i className="bx bx-brain text-2xl text-purple-500"></i>
            <div>
              <div className="text-sm font-bold text-gray-900">New Vitals Entry</div>
              <div className="text-xs text-gray-400">AI will analyze and suggest hospitals after saving</div>
            </div>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Date</label>
                <input className="field" type="date" value={form.date} onChange={set("date")} />
              </div>
              {fields.map(f => (
                <div key={f.k}>
                  <label className="text-xs font-semibold text-gray-600 mb-1 block">{f.l} <span className="text-gray-400 font-normal">({f.u})</span></label>
                  <input className="field" type={f.type} step="any" value={form[f.k]} onChange={set(f.k)} placeholder={f.ph} />
                </div>
              ))}
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Sugar Type</label>
                <select className="field" value={form.bloodSugarType} onChange={set("bloodSugarType")}>
                  <option value="fasting">Fasting</option>
                  <option value="random">Random</option>
                  <option value="post_meal">Post Meal</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">City</label>
                <input className="field" value={form.city} onChange={set("city")} placeholder="Karachi" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">Notes</label>
              <input className="field" value={form.notes} onChange={set("notes")} placeholder="e.g. After Fajr, fasting reading" />
            </div>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving
                ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>Saving...</>
                : <><i className="bx bxs-save text-lg"></i> Save Vitals</>}
            </button>
          </form>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 1 && (
        <div className="card p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <i className="ti ti-chart-line text-teal-500 text-lg"></i> Trend (Last 14 Entries)
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F4" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#9CA3AF" }} />
              <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E2E6EA", fontSize: 12 }} />
              <Line type="monotone" dataKey="bp"    stroke="#1D9E75" strokeWidth={2} dot={{ r: 3, fill: "#1D9E75" }} name="Systolic BP" />
              <Line type="monotone" dataKey="sugar" stroke="#378ADD" strokeWidth={2} dot={{ r: 3, fill: "#378ADD" }} name="Blood Sugar" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-9 h-9 border-2 border-teal-100 border-t-teal-400 rounded-full animate-spin"></div>
        </div>
      ) : vitals.length === 0 ? (
        <div className="card text-center py-16">
          <i className="bx bx-pulse text-6xl text-gray-200"></i>
          <p className="text-gray-500 font-semibold mt-3">No vitals logged yet</p>
          <button onClick={() => setShowForm(true)} className="btn-primary mt-4 inline-flex">Add First Entry</button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {paged.map(v => {
              const metrics = [
                v.bloodPressureSystolic && { l: "BP",         val: `${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}`, u: "mmHg",  bg: "bg-teal-50",   c: "text-teal-600"   },
                v.heartRate            && { l: "Heart Rate",  val: v.heartRate,                                              u: "bpm",   bg: "bg-red-50",    c: "text-red-500"    },
                v.bloodSugar           && { l: "Blood Sugar", val: v.bloodSugar,                                             u: "mg/dL", bg: "bg-blue-50",   c: "text-blue-600"   },
                v.weight               && { l: "Weight",      val: v.weight,                                                 u: "kg",    bg: "bg-purple-50", c: "text-purple-600" },
                v.oxygenSaturation     && { l: "SpO2",        val: v.oxygenSaturation,                                       u: "%",     bg: "bg-cyan-50",   c: "text-cyan-600"   },
                v.temperature          && { l: "Temp",        val: v.temperature,                                            u: "°F",    bg: "bg-amber-50",  c: "text-amber-600"  },
              ].filter(Boolean);
              const visible = metrics.slice(0, 4);
              const extra   = metrics.length - visible.length;

              return (
                <div key={v._id}
                  className="card p-4 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all"
                  onClick={() => navigate(`/vitals/${v.publicId || v._id}`)}>

                  {/* Card header — date + delete */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="bg-teal-50 rounded-xl px-3 py-1.5 text-center min-w-[44px]">
                        <div className="text-[9px] font-bold text-teal-500 uppercase tracking-wide">
                          {format(new Date(v.date), "MMM")}
                        </div>
                        <div className="text-xl font-black text-teal-700 leading-none">
                          {format(new Date(v.date), "d")}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-gray-700">{format(new Date(v.date), "EEEE")}</div>
                        <div className="text-[10px] text-gray-400">{format(new Date(v.date), "yyyy")}</div>
                      </div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); del(v._id); }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 transition-all flex-shrink-0">
                      <i className="ti ti-trash text-[15px] text-gray-300 hover:text-red-400 transition-colors"></i>
                    </button>
                  </div>

                  {/* Metrics — 2-column mini grid */}
                  {visible.length > 0 ? (
                    <>
                      <div className="grid grid-cols-2 gap-1.5 mb-3">
                        {visible.map((m, i) => (
                          <div key={i} className={`${m.bg} rounded-xl p-2 text-center`}>
                            <div className="text-[9px] text-gray-400 mb-0.5">{m.l}</div>
                            <div className={`text-sm font-black ${m.c} leading-none`}>{m.val}</div>
                            <div className="text-[9px] text-gray-400 mt-0.5">{m.u}</div>
                          </div>
                        ))}
                      </div>
                      {extra > 0 && (
                        <p className="text-[10px] text-gray-400 text-center -mt-1.5 mb-2">+{extra} more readings</p>
                      )}
                    </>
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-3 mb-2">No readings recorded</p>
                  )}

                  {/* Notes */}
                  {v.notes && (
                    <p className="text-[10px] text-gray-400 flex items-center gap-1 mb-2.5 truncate">
                      <i className="bx bx-pin text-[12px] flex-shrink-0"></i>{v.notes}
                    </p>
                  )}

                  {/* Footer — AI badge + View arrow */}
                  <div className="flex items-center justify-between">
                    {v.aiAnalysis?.overallStatus ? (
                      <span className={`badge text-[10px] ${v.aiAnalysis.overallStatus === "critical" ? "badge-danger" : v.aiAnalysis.overallStatus === "concerning" ? "badge-amber" : "badge-ok"}`}>
                        <i className="bx bx-brain text-[11px]"></i> {v.aiAnalysis.overallStatus}
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-300 flex items-center gap-1">
                        <i className="bx bx-time text-[11px]"></i> AI pending
                      </span>
                    )}
                    <span className="text-[10px] text-gray-300 flex items-center gap-0.5">
                      View <i className="ti ti-chevron-right text-[11px]"></i>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination page={page} total={vitals.length} size={PAGE_SIZE} onChange={p => { setPage(p); window.scrollTo(0, 0); }} />
        </>
      )}
    </div>
  );
}

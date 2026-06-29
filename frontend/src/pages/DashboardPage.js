import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import api from "../lib/api";
import { format } from "date-fns";
import { getRT, STATUS_CONFIG } from "../lib/utils";

function StatCard({ icon, iconClass, label, value, sub, to, bgClass }) {
  const inner = (
    <div className={`card-hover p-5 ${bgClass || ""}`}>
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-3 ${iconClass}`}>
        <i className={`${icon} text-2xl`}></i>
      </div>
      <div className="text-2xl font-bold text-gray-900 leading-tight">{value}</div>
      <div className="text-sm font-semibold text-gray-700 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
  return to ? <Link to={to} className="block no-underline">{inner}</Link> : inner;
}

export default function DashboardPage() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [reports, setReports]       = useState([]);
  const [reportTotal, setReportTotal] = useState(null);
  const [vitals, setVitals]         = useState([]);
  const [stats, setStats]           = useState(null);
  const [loading, setLoading] = useState(true);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  useEffect(() => {
    Promise.all([
      api.get("/reports?limit=4"),
      api.get("/vitals?limit=1"),
      api.get("/dashboard/stats"),
    ])
      .then(([r, v, s]) => {
        setReports(r.data.reports || []);
        setReportTotal(r.data.total ?? null);
        setVitals(v.data.vitals  || []);
        setStats(s.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const lv = vitals[0];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Hero banner */}
      <div className="grad-hero rounded-3xl p-6 lg:p-8 text-white shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <p className="text-teal-200 text-sm font-medium mb-1">{greeting} 👋</p>
          <h1 className="font-display font-black text-2xl lg:text-3xl tracking-tight leading-tight">
            {user?.firstName}'s Health Dashboard
          </h1>
          <p className="text-white/60 text-sm mt-1">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
        </div>
        <div className="flex gap-3">
          <Link to="/reports/add"
            className="flex items-center gap-2 bg-white text-teal-700 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-teal-50 transition-all shadow-md active:scale-95">
            <i className="ti ti-plus text-lg"></i> Add Report
          </Link>
          <Link to="/emergency"
            className="flex items-center gap-2 bg-red-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-red-700 transition-all shadow-md active:scale-95 sos-pulse">
            <i className="bx bxs-first-aid text-lg"></i> SOS
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="bx bxs-file-doc" iconClass="bg-blue-50 text-blue-500"
          label="Total Reports" value={reportTotal ?? reports.length} sub="Medical records" to="/reports" />
        <StatCard icon="ti ti-heart-rate-monitor" iconClass="bg-teal-50 text-teal-600"
          label="Last BP" value={lv?.bloodPressureSystolic ? `${lv.bloodPressureSystolic}/${lv.bloodPressureDiastolic}` : "—"}
          sub="mmHg" to="/vitals" />
        <StatCard icon="bx bxs-building" iconClass="bg-purple-50 text-purple-500"
          label="Hospitals" value={stats ? stats.totalHospitals : "—"}
          sub={stats ? `${stats.totalCities} cit${stats.totalCities === 1 ? "y" : "ies"} covered` : "Pakistan-wide"}
          to="/hospitals" />
        <StatCard icon="bx bxs-first-aid" iconClass="bg-red-50 text-red-500"
          label="Emergency Services" value={stats ? stats.totalEmergencyServices : "—"}
          sub="Helpline Numbers" to="/emergency" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Reports */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <i className="ti ti-files text-teal-500 text-lg"></i> Recent Reports
            </h2>
            <Link to="/reports/add" className="btn-primary text-xs px-3 py-1.5">
              <i className="ti ti-plus text-sm"></i> Add
            </Link>
          </div>
          {loading ? (
            <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-teal-100 border-t-teal-400 rounded-full animate-spin"></div></div>
          ) : reports.length === 0 ? (
            <div className="text-center py-10">
              <i className="bx bx-folder-open text-5xl text-gray-200"></i>
              <p className="text-sm text-gray-400 mt-2">No reports yet</p>
              <Link to="/reports/add" className="btn-primary text-xs mt-3 inline-flex">Upload First Report</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {reports.map(r => {
                const rt = getRT(r.type);
                const sc = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;
                return (
                  <Link key={r._id} to={`/reports/${r.publicId || r._id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all group">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${rt.bg}`}>
                      <i className={`${rt.icon} text-xl ${rt.color}`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate group-hover:text-teal-600 transition-colors">{r.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{format(new Date(r.date), "MMM d, yyyy")} · {r.labName || "No lab"}</div>
                    </div>
                    <span className={sc.cls}><i className={`${sc.icon} text-[11px]`}></i> {sc.label}</span>
                    {r.aiAnalysis?.urgency === "HIGH" && <span className="badge-danger text-[10px]">⚡ Urgent</span>}
                  </Link>
                );
              })}
              <Link to="/reports" className="block text-center text-xs text-teal-600 font-semibold pt-2 hover:underline">
                View all reports →
              </Link>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <i className="bx bx-grid-alt text-teal-500 text-lg"></i> Quick Actions
          </h2>
          {[
            { to:"/reports/add", icon:"bx bxs-file-plus",    title:"Upload Report",     sub:"Add new medical report",  bg:"bg-blue-50",   ic:"text-blue-500"   },
            { to:"/vitals",      icon:"bx bx-pulse",          title:"Log Vitals",         sub:"BP, sugar, weight & more", bg:"bg-teal-50",   ic:"text-teal-600"   },
            { to:"/hospitals",   icon:"bx bxs-building",      title:"Find Hospital",      sub:"Search by city/type",      bg:"bg-purple-50", ic:"text-purple-500" },
            { to:"/emergency",   icon:"bx bxs-first-aid",     title:"Emergency Help",     sub:"Ambulance & rescue",       bg:"bg-red-50",    ic:"text-red-500"    },
          ].map(a => (
            <Link key={a.to} to={a.to}
              className="flex items-center gap-3 p-3.5 card-hover">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${a.bg}`}>
                <i className={`${a.icon} text-xl ${a.ic}`}></i>
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-900">{a.title}</div>
                <div className="text-xs text-gray-400">{a.sub}</div>
              </div>
              <i className="ti ti-chevron-right text-gray-300 text-sm"></i>
            </Link>
          ))}

          {/* Last vitals snapshot */}
          {lv && (
            <div className="card p-4 mt-2 bg-gradient-to-br from-teal-50 to-emerald-50 border-teal-100">
              <div className="text-xs font-semibold text-teal-700 mb-3 flex items-center gap-1.5">
                <i className="ti ti-heart-rate-monitor"></i> Latest Vitals
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { l:"BP", v: lv.bloodPressureSystolic ? `${lv.bloodPressureSystolic}/${lv.bloodPressureDiastolic}` : null, u:"mmHg" },
                  { l:"Sugar", v: lv.bloodSugar, u:"mg/dL" },
                  { l:"Weight", v: lv.weight, u:"kg" },
                  { l:"SpO2", v: lv.oxygenSaturation, u:"%" },
                ].filter(x => x.v).map((x,i) => (
                  <div key={i} className="bg-white rounded-xl px-3 py-2">
                    <div className="text-[10px] text-gray-400">{x.l}</div>
                    <div className="text-sm font-bold text-teal-700">{x.v}<span className="text-[10px] font-normal text-gray-400 ml-0.5">{x.u}</span></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

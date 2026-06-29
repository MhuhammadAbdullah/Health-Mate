// import React, { useState, useEffect, useCallback } from "react";
// import { Link } from "react-router-dom";
// import api from "../lib/api";
// import toast from "react-hot-toast";
// import { format } from "date-fns";
// import { getRT, STATUS_CONFIG, REPORT_TYPES } from "../lib/utils";

// export default function ReportsPage() {
//   const [reports, setReports] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [search, setSearch] = useState("");
//   const [typeF, setTypeF] = useState("");
//   const [statusF, setStatusF] = useState("");

//   const fetchReports = useCallback(async () => {
//     setLoading(true);
//     try {
//       const { data } = await api.get("/reports", { params: { search, type: typeF, status: statusF } });
//       setReports(data.reports || []);
//     } catch { toast.error("Failed to load reports"); }
//     finally { setLoading(false); }
//   }, [search, typeF, statusF]);

//   useEffect(() => { fetchReports(); }, [fetchReports]);

//   const toggleStar = async (id, e) => {
//     e.preventDefault();
//     const { data } = await api.patch(`/reports/${id}/star`);
//     setReports(p => p.map(r => r._id === id ? { ...r, isStarred: data.isStarred } : r));
//   };

//   const del = async (id, e) => {
//     e.preventDefault();
//     if (!window.confirm("Delete this report?")) return;
//     await api.delete(`/reports/${id}`);
//     setReports(p => p.filter(r => r._id !== id));
//     toast.success("Deleted");
//   };

//   return (
//     <div className="max-w-6xl mx-auto space-y-5">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-xl font-bold text-gray-900">My Reports</h1>
//           <p className="text-sm text-gray-400 mt-0.5">{reports.length} records</p>
//         </div>
//         <Link to="/reports/add" className="btn-primary">
//           <i className="ti ti-plus text-lg"></i> Add Report
//         </Link>
//       </div>

//       {/* Filter bar */}
//       <div className="card flex flex-wrap items-center gap-3 p-3 px-4">
//         <div className="flex items-center gap-2 flex-1 min-w-[180px]">
//           <i className="ti ti-search text-gray-400 text-lg flex-shrink-0"></i>
//           <input className="flex-1 outline-none text-sm text-gray-800 bg-transparent placeholder-gray-400"
//             placeholder="Search reports..." value={search} onChange={e => setSearch(e.target.value)} />
//         </div>
//         <div className="flex gap-2 flex-wrap">
//           <select className="field py-2 px-3 text-xs w-auto" value={typeF} onChange={e => setTypeF(e.target.value)}>
//             <option value="">All Types</option>
//             {REPORT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
//           </select>
//           <select className="field py-2 px-3 text-xs w-auto" value={statusF} onChange={e => setStatusF(e.target.value)}>
//             <option value="">All Status</option>
//             {["normal","abnormal","critical","pending"].map(s => (
//               <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>
//             ))}
//           </select>
//         </div>
//       </div>

//       {loading ? (
//         <div className="flex justify-center py-20"><div className="w-10 h-10 border-2 border-teal-100 border-t-teal-400 rounded-full animate-spin"></div></div>
//       ) : reports.length === 0 ? (
//         <div className="card text-center py-16">
//           <i className="bx bx-folder-open text-6xl text-gray-200"></i>
//           <p className="text-gray-500 font-semibold mt-3">No reports found</p>
//           <Link to="/reports/add" className="btn-primary mt-4 inline-flex">Upload First Report</Link>
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
//           {reports.map(r => {
//             const rt = getRT(r.type);
//             const sc = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;
//             return (
//               <Link key={r._id} to={`/reports/${r._id}`} className="card-hover p-4 block no-underline">
//                 {/* Header */}
//                 <div className="flex items-start justify-between mb-3">
//                   <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${rt.bg}`}>
//                     <i className={`${rt.icon} text-2xl ${rt.color}`}></i>
//                   </div>
//                   <div className="flex gap-1.5">
//                     <button onClick={e => toggleStar(r._id, e)}
//                       className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-all">
//                       <i className={`${r.isStarred ? "bx bxs-star text-amber-400" : "bx bx-star text-gray-300"} text-[18px]`}></i>
//                     </button>
//                     <button onClick={e => del(r._id, e)}
//                       className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center transition-all">
//                       <i className="ti ti-trash text-[16px] text-gray-300 hover:text-red-400"></i>
//                     </button>
//                   </div>
//                 </div>

//                 <h3 className="text-sm font-bold text-gray-900 leading-tight mb-2 line-clamp-2">{r.title}</h3>

//                 <div className="space-y-1 mb-3">
//                   {[
//                     { icon:"ti ti-calendar", val: format(new Date(r.date), "MMM d, yyyy") },
//                     { icon:"bx bxs-building", val: r.labName || "Lab not specified" },
//                     { icon:"bx bx-user-pin", val: r.doctorName || "Doctor not specified" },
//                   ].map((x,i) => (
//                     <div key={i} className="flex items-center gap-1.5 text-xs text-gray-400">
//                       <i className={`${x.icon} text-[13px] flex-shrink-0`}></i>
//                       <span className="truncate">{x.val}</span>
//                     </div>
//                   ))}
//                 </div>

//                 <div className="flex items-center justify-between">
//                   <span className={sc.cls}><i className={`${sc.icon} text-[10px]`}></i> {sc.label}</span>
//                   {r.aiAnalysis?.urgency && (
//                     <span className={`badge text-[10px] ${r.aiAnalysis.urgency === "HIGH" ? "badge-danger" : r.aiAnalysis.urgency === "MEDIUM" ? "badge-amber" : "badge-ok"}`}>
//                       <i className="bx bx-brain text-[11px]"></i> AI {r.aiAnalysis.urgency}
//                     </span>
//                   )}
//                 </div>

//                 {r.description && (
//                   <p className="text-xs text-gray-400 mt-2 line-clamp-2 border-t border-gray-50 pt-2">{r.description}</p>
//                 )}
//               </Link>
//             );
//           })}
//         </div>
//       )}
//     </div>
//   );
// }











import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { getRT, STATUS_CONFIG, REPORT_TYPES } from "../lib/utils";

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

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeF, setTypeF] = useState("");
  const [statusF, setStatusF] = useState("");
  const [page, setPage] = useState(1);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setPage(1);
    try {
      const { data } = await api.get("/reports", {
        params: { search, type: typeF, status: statusF },
      });
      setReports(data.reports || []);
    } catch {
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [search, typeF, statusF]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // ⭐ STAR
  const toggleStar = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!id) return toast.error("Invalid report ID");

    try {
      const { data } = await api.patch(`/reports/${id}/star`);
      setReports((p) =>
        p.map((r) =>
          (r.publicId || r._id) === id ? { ...r, isStarred: data.isStarred } : r
        )
      );
    } catch {
      toast.error("Failed to update star");
    }
  };

  // 🗑 DELETE FIXED
  const del = async (id, e) => {
    e.preventDefault();
    e.stopPropagation(); // 🔥 IMPORTANT FIX

    if (!id) {
      console.error("Missing ID:", id);
      toast.error("Invalid report ID");
      return;
    }

    if (!window.confirm("Delete this report?")) return;

    try {
      await api.delete(`/reports/${id}`);
      setReports((p) => p.filter((r) => (r.publicId || r._id) !== id));
      toast.success("Deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">My Reports</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {reports.length} records · Page {page} of {Math.max(1, Math.ceil(reports.length / PAGE_SIZE))}
          </p>
        </div>

        <Link to="/reports/add" className="btn-primary">
          <i className="ti ti-plus text-lg"></i> Add Report
        </Link>
      </div>

      {/* FILTER */}
      {/* <div className="card flex flex-wrap items-center gap-3 p-3 px-4">
        <input
          className="field flex-1"
          placeholder="Search reports..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="field"
          value={typeF}
          onChange={(e) => setTypeF(e.target.value)}
        >
          <option value="">All Types</option>
          {REPORT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        <select
          className="field"
          value={statusF}
          onChange={(e) => setStatusF(e.target.value)}
        >
          <option value="">All Status</option>
          {["normal", "abnormal", "critical", "pending"].map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div> */}


      {/* Filter bar */}
      <div className="card flex flex-wrap items-center gap-3 p-3 px-4">
        <div className="flex items-center gap-2 flex-1 min-w-[180px]">
          <i className="ti ti-search text-gray-400 text-lg flex-shrink-0"></i>
          <input className="flex-1 outline-none text-sm text-gray-800 bg-transparent placeholder-gray-400"
            placeholder="Search reports..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select className="field py-2 px-3 text-xs w-auto" value={typeF} onChange={e => setTypeF(e.target.value)}>
            <option value="">All Types</option>
            {REPORT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select className="field py-2 px-3 text-xs w-auto" value={statusF} onChange={e => setStatusF(e.target.value)}>
            <option value="">All Status</option>
            {["normal", "abnormal", "critical", "pending"].map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* LOADING */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-2 border-teal-100 border-t-teal-400 rounded-full animate-spin"></div>
        </div>
      ) : reports.length === 0 ? (
        <div className="card text-center py-16">
          <i className="bx bx-folder-open text-6xl text-gray-200"></i>
          <p className="text-gray-500 font-semibold mt-3">No reports found</p>
          <Link to="/reports/add" className="btn-primary mt-4 inline-flex">
            Upload First Report
          </Link>
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {reports.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((r) => {
            const rt = getRT(r.type);
            const sc = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;

            return (
              <div
                key={r._id}
                className="card-hover p-4 block"
                onClick={() => (window.location.href = `/reports/${r.publicId || r._id}`)}
              >
                {/* HEADER */}
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center ${rt.bg}`}
                  >
                    <i className={`${rt.icon} text-2xl ${rt.color}`}></i>
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      onClick={(e) => toggleStar(r.publicId || r._id, e)}
                      className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center"
                    >
                      <i
                        className={`${r.isStarred
                            ? "bx bxs-star text-amber-400"
                            : "bx bx-star text-gray-300"
                          } text-[18px]`}
                      ></i>
                    </button>

                    <button
                      onClick={(e) => del(r.publicId, e)}
                      className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center"
                    >
                      <i className="ti ti-trash text-[16px] text-gray-300 hover:text-red-400"></i>
                    </button>
                  </div>
                </div>

                {/* TITLE */}
                <h3 className="text-sm font-bold text-gray-900 mb-2 line-clamp-2">
                  {r.title}
                </h3>

                {/* META */}
                <div className="space-y-1 mb-3">
                  <div className="text-xs text-gray-400">
                    {format(new Date(r.date), "MMM d, yyyy")}
                  </div>
                  <div className="text-xs text-gray-400">
                    {r.labName || "Lab not specified"}
                  </div>
                  <div className="text-xs text-gray-400">
                    {r.doctorName || "Doctor not specified"}
                  </div>
                </div>

                {/* STATUS */}
                <div className="flex justify-between items-center">
                  <span className={sc.cls}>
                    <i className={`${sc.icon} text-[10px]`}></i> {sc.label}
                  </span>

                  {r.aiAnalysis?.urgency && (
                    <span
                      className={`badge text-[10px] ${r.aiAnalysis.urgency === "HIGH"
                          ? "badge-danger"
                          : r.aiAnalysis.urgency === "MEDIUM"
                            ? "badge-amber"
                            : "badge-ok"
                        }`}
                    >
                      AI {r.aiAnalysis.urgency}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <Pagination page={page} total={reports.length} size={PAGE_SIZE} onChange={p => { setPage(p); window.scrollTo(0, 0); }} />
        </>
      )}
    </div>
  );
}
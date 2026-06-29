import React, { useState, useEffect, useCallback, useRef } from "react";
import api from "../lib/api";

const PAGE_SIZE = 12;

const CATEGORIES = [
  "Ambulance","Police","Fire Brigade","Rescue","Disaster Management",
  "Women Helpline","Child Helpline","Mental Health","Cyber Crime",
  "Blood Bank","Poison Control","Other",
];

const PROVINCES = [
  "National","Sindh","Punjab","KPK","Balochistan",
  "Islamabad","Gilgit Baltistan","AJK",
];

function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  const end   = Math.min(pages, start + 4);
  const nums  = [];
  for (let i = start; i <= end; i++) nums.push(i);
  return (
    <div className="flex items-center justify-center gap-1.5 pt-4">
      <button onClick={() => onChange(page - 1)} disabled={page === 1}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
        <i className="ti ti-chevron-left text-base" />
      </button>
      {start > 1 && (
        <>
          <button onClick={() => onChange(1)} className="w-8 h-8 rounded-lg text-sm font-semibold text-gray-500 hover:bg-gray-100">1</button>
          {start > 2 && <span className="text-gray-300 text-xs px-0.5">…</span>}
        </>
      )}
      {nums.map(p => (
        <button key={p} onClick={() => onChange(p)}
          className={`w-8 h-8 rounded-lg text-sm font-semibold transition-all ${p === page ? "bg-red-500 text-white shadow-sm" : "text-gray-500 hover:bg-gray-100"}`}>
          {p}
        </button>
      ))}
      {end < pages && (
        <>
          {end < pages - 1 && <span className="text-gray-300 text-xs px-0.5">…</span>}
          <button onClick={() => onChange(pages)} className="w-8 h-8 rounded-lg text-sm font-semibold text-gray-500 hover:bg-gray-100">{pages}</button>
        </>
      )}
      <button onClick={() => onChange(page + 1)} disabled={page === pages}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
        <i className="ti ti-chevron-right text-base" />
      </button>
    </div>
  );
}

export default function EmergencyPage() {
  const [numbers, setNumbers] = useState([]);
  const [total, setTotal]     = useState(0);
  const [pages, setPages]     = useState(1);
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);

  const [hero, setHero] = useState({
    heroTitle:    "Emergency Numbers",
    heroSubtitle: "Pakistan ke zaruri helpline numbers — ek tap mein call karein",
  });

  // Filters
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch]           = useState("");
  const [category, setCategory]       = useState("");
  const [province, setProvince]       = useState("");
  const [featuredOnly, setFeaturedOnly] = useState(false);

  const debounce = useRef(null);
  const hasFilters = search || category || province || featuredOnly;

  // ── Hero settings ────────────────────────────────────────────────────────
  useEffect(() => {
    api.get("/settings/emergency")
      .then(r => {
        const s = r.data.settings || {};
        setHero(prev => ({
          heroTitle:    s.heroTitle    || prev.heroTitle,
          heroSubtitle: s.heroSubtitle || prev.heroSubtitle,
        }));
      })
      .catch(() => {});
  }, []);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_SIZE };
      if (search)       params.search   = search;
      if (category)     params.category = category;
      if (province)     params.province = province;
      if (featuredOnly) params.featured = "true";

      const r = await api.get("/emergency", { params });
      setNumbers(r.data.emergencyNumbers || []);
      setTotal(r.data.total   || 0);
      setPages(r.data.pages   || 1);
    } catch {
      setNumbers([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, category, province, featuredOnly]);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const handleSearch = val => {
    setSearchInput(val);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => { setSearch(val); setPage(1); }, 400);
  };

  const setFilter = setter => val => { setter(val); setPage(1); };

  const clearAll = () => {
    setSearchInput(""); setSearch(""); setCategory("");
    setProvince(""); setFeaturedOnly(false); setPage(1);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Hero */}
      <div className="grad-sos rounded-3xl p-6 lg:p-8 text-white shadow-xl overflow-hidden relative">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5 pointer-events-none"></div>
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0 sos-pulse">
            <i className="bx bxs-first-aid text-4xl text-white"></i>
          </div>
          <div>
            <h1 className="font-display font-black text-2xl lg:text-3xl tracking-tight">{hero.heroTitle}</h1>
            <p className="text-white/75 text-sm mt-1">{hero.heroSubtitle}</p>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="card p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <i className="ti ti-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={searchInput}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search by name, phone number, or description…"
            className="w-full pl-10 pr-9 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-100 transition-all"
          />
          {searchInput && (
            <button onClick={() => handleSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <i className="ti ti-x text-sm" />
            </button>
          )}
        </div>

        {/* Dropdowns + featured + clear */}
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={category} onChange={e => setFilter(setCategory)(e.target.value)}
            className="text-sm border border-gray-200 bg-gray-50 rounded-lg py-2 pl-3 pr-8 focus:outline-none focus:border-red-400 transition-all min-w-[130px] appearance-none"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            value={province} onChange={e => setFilter(setProvince)(e.target.value)}
            className="text-sm border border-gray-200 bg-gray-50 rounded-lg py-2 pl-3 pr-8 focus:outline-none focus:border-red-400 transition-all min-w-[120px] appearance-none"
          >
            <option value="">All Provinces</option>
            {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          <button
            onClick={() => setFilter(setFeaturedOnly)(!featuredOnly)}
            className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg border transition-all ${
              featuredOnly
                ? "bg-amber-50 text-amber-700 border-amber-300"
                : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300"
            }`}
          >
            <i className={`bx ${featuredOnly ? "bxs-star text-amber-500" : "bx-star"} text-sm`} />
            Featured
          </button>

          <div className="ml-auto flex items-center gap-3">
            {!loading && (
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {total} result{total !== 1 ? "s" : ""}
              </span>
            )}
            {hasFilters && (
              <button onClick={clearAll}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-0.5 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors whitespace-nowrap">
                <i className="ti ti-x text-xs" />Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-red-500 rounded-full animate-spin" />
        </div>
      ) : numbers.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center px-6">
          <span className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
            <i className="bx bxs-first-aid text-3xl text-red-300" />
          </span>
          <h3 className="text-base font-bold text-gray-700 mb-1">
            {hasFilters ? "No services match your filters" : "No emergency services available yet"}
          </h3>
          <p className="text-sm text-gray-400 max-w-xs mb-4">
            {hasFilters
              ? "Try clearing some filters to see more results."
              : "Emergency helpline numbers will appear here once they are added by the admin."}
          </p>
          {hasFilters && (
            <button onClick={clearAll} className="text-sm font-semibold text-red-600 hover:text-red-700 underline">
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {numbers.map(n => (
              <a key={n.id} href={`tel:${n.number}`}
                className="card-hover p-5 block no-underline group">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${n.color}18` }}>
                    <i className={`${n.icon} text-2xl`} style={{ color: n.color }}></i>
                  </div>
                  <div className="flex flex-row items-end gap-1">
                    {n.featured && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-0.5">
                        <i className="bx bxs-star text-[9px]" />Featured
                      </span>
                    )}
                    {n.category && (
                      <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-gray-50 text-gray-500 border border-gray-200">
                        {n.category}
                      </span>
                    )}
                    <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full border transition-all duration-150 group-hover:opacity-100 opacity-60"
                      style={{ color: n.color, borderColor: `${n.color}40`, background: `${n.color}10` }}>
                      TAP TO CALL
                    </span>
                  </div>
                </div>
                <div className="text-sm font-bold text-gray-900 mb-1">{n.name}</div>
                <div className="font-display font-black text-2xl leading-none mb-2" style={{ color: n.color }}>
                  {n.number}
                </div>
                <div className="text-xs text-gray-400 flex items-center gap-1.5">
                  {n.desc}
                  {n.province && n.province !== "National" && (
                    <span className="shrink-0 text-[9px] text-gray-300">· {n.province}</span>
                  )}
                </div>
              </a>
            ))}
          </div>

          <Pagination page={page} pages={pages} onChange={setPage} />
        </>
      )}

      {/* Safety tips */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <i className="ti ti-shield-check text-teal-500 text-xl"></i>
          <h2 className="text-sm font-bold text-gray-900">Emergency Tips</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon:"bx bxs-first-aid", c:"text-red-500",  tip:"Stay calm. Speak clearly when calling emergency services." },
            { icon:"ti ti-map-pin",    c:"text-teal-500", tip:"Share your exact location: area, landmark, nearest road." },
            { icon:"bx bxs-heart",     c:"text-pink-500", tip:"Do not move an injured person unless they are in immediate danger." },
            { icon:"bx bx-phone",      c:"text-blue-500", tip:"Save emergency numbers in your phone contacts right now." },
          ].map((t, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
              <i className={`${t.icon} ${t.c} text-xl flex-shrink-0 mt-0.5`}></i>
              <p className="text-xs text-gray-600 leading-relaxed">{t.tip}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-2xl p-4">
        <i className="ti ti-alert-triangle text-amber-500 text-lg flex-shrink-0 mt-0.5"></i>
        <p className="text-xs text-amber-700 leading-relaxed">
          <strong>Remember:</strong> In an emergency, call these numbers first. These helplines are for Pakistan. Save your local city emergency numbers as well and share them with your family for quick access when needed.
        </p>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import api from "../lib/api";
import toast from "react-hot-toast";

const PAGE_SIZE = 12;
const MAPS_KEY  = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

// ── Type config ────────────────────────────────────────────────────────────
const TYPE_CFG = {
  Government: { cls: "badge-info",   icon: "ti ti-building-community", dot: "bg-blue-400"   },
  Private:    { cls: "badge-ok",     icon: "ti ti-building-hospital",  dot: "bg-teal-400"   },
  Welfare:    { cls: "badge-purple", icon: "bx bxs-heart",             dot: "bg-purple-400" },
  Military:   { cls: "badge bg-slate-50 text-slate-600 border border-slate-200",
                icon: "ti ti-shield", dot: "bg-slate-400" },
};

// ── Pagination ─────────────────────────────────────────────────────────────
function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  const end   = Math.min(pages, start + 4);
  const nums  = [];
  for (let i = start; i <= end; i++) nums.push(i);
  return (
    <div className="flex items-center justify-center gap-1.5 pt-6 pb-2">
      <button
        onClick={() => onChange(page - 1)} disabled={page === 1}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <i className="ti ti-chevron-left text-base" />
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
      <button
        onClick={() => onChange(page + 1)} disabled={page === pages}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <i className="ti ti-chevron-right text-base" />
      </button>
    </div>
  );
}

// ── Location Permission Modal ──────────────────────────────────────────────
function LocationPermissionModal({ onConfirm, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const handleEnable = () => {
    if (!navigator.geolocation) {
      setError("Your browser doesn't support location services.");
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLoading(false);
        onConfirm({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      err => {
        setLoading(false);
        setError(
          err.code === 1
            ? "Location access was denied. Please allow location in your browser settings and try again."
            : "Unable to get your location. Please try again."
        );
      },
      { timeout: 10000 }
    );
  };

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={!loading ? onClose : undefined}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-scale-in pointer-events-auto">
          <div className="w-14 h-14 rounded-2xl grad-hero flex items-center justify-center mb-4 mx-auto">
            <i className="ti ti-current-location text-3xl text-white" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 text-center mb-1">
            Find Nearby Hospitals
          </h2>
          <p className="text-sm text-gray-500 text-center mb-5 leading-relaxed">
            We'll show hospitals within{" "}
            <span className="font-semibold text-teal-600">10 km</span> of your
            current location. Your location is not saved or shared.
          </p>

          {error && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-100 p-3 text-xs text-red-600 flex items-start gap-2">
              <i className="ti ti-info-circle text-sm shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <button
              onClick={handleEnable}
              disabled={loading}
              className="btn-primary w-full py-2.5 text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              {loading ? (
                <><i className="ti ti-loader-2 animate-spin" />Getting location…</>
              ) : (
                <><i className="ti ti-current-location" />Enable Location</>
              )}
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              className="w-full py-2.5 text-sm font-semibold text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors disabled:opacity-40"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

// ── Map Modal ─────────────────────────────────────────────────────────────
// Uses stored lat/lng exclusively — no geocoding, no API calls.
function MapModal({ hospital, onClose }) {
  const { lat, lng } = hospital;
  const tc = TYPE_CFG[hospital.type] || TYPE_CFG.Government;

  const embedSrc      = MAPS_KEY
    ? `https://www.google.com/maps/embed/v1/place?key=${MAPS_KEY}&q=${lat},${lng}&zoom=17`
    : null;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
  const mapsViewUrl   = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  const forwardScroll = e => window.scrollBy({ top: e.deltaY, left: e.deltaX });

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        onWheel={forwardScroll}
      />
      <div className="fixed inset-x-0 top-0 z-50 flex justify-center items-start
                      pt-4 sm:pt-10 lg:pt-14
                      px-0 sm:px-6 lg:px-8
                      pointer-events-none">
        <div
          className="bg-white w-full sm:max-w-2xl
                     rounded-t-2xl sm:rounded-2xl
                     shadow-2xl animate-scale-in overflow-hidden
                     flex flex-col pointer-events-auto"
          style={{ maxHeight: "calc(100vh - 5rem)" }}
        >
          {/* Header */}
          <div className="grad-hero text-white px-5 py-4 flex items-start justify-between gap-3 shrink-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <i className={`${tc.icon} text-white/80`} />
                <span className="text-xs font-semibold text-teal-200 uppercase tracking-wide">{hospital.type} Hospital</span>
                {hospital.emergency && (
                  <span className="text-xs font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">
                    <i className="bx bxs-first-aid mr-0.5" />Emergency
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold leading-tight truncate">{hospital.name}</h2>
              <p className="text-sm text-teal-200 mt-0.5 flex items-center gap-1 truncate">
                <i className="ti ti-map-pin text-sm shrink-0" />{hospital.city} · {hospital.address}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors shrink-0 mt-0.5"
            >
              <i className="ti ti-x text-lg" />
            </button>
          </div>

          {/* Map embed */}
          <div className="relative bg-gray-100 shrink-0" style={{ height: 260 }}>
            {embedSrc ? (
              <iframe
                title={`Map of ${hospital.name}`}
                src={embedSrc}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-50">
                <i className="ti ti-map-2 text-5xl text-gray-300" />
                <p className="text-sm text-gray-400 text-center px-8">
                  Map embed requires <span className="font-mono text-gray-500">REACT_APP_GOOGLE_MAPS_API_KEY</span>
                </p>
                <a href={mapsViewUrl} target="_blank" rel="noopener noreferrer" className="btn-primary text-xs px-4 py-2">
                  <i className="ti ti-brand-google-maps mr-1.5" />Open in Google Maps
                </a>
              </div>
            )}
          </div>

          {/* Details + actions */}
          <div className="p-5 space-y-4 overflow-y-auto">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {hospital.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                    <i className="ti ti-phone text-teal-600" />
                  </span>
                  {hospital.phone}
                </div>
              )}
              {hospital.rating && (
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                    <i className="bx bxs-star text-amber-400" />
                  </span>
                  {hospital.rating} / 5.0 Rating
                </div>
              )}
            </div>

            {hospital.specialties?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  <i className="ti ti-stethoscope mr-1" />Specialties
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {hospital.specialties.map(s => (
                    <span key={s} className="text-xs bg-gray-50 text-gray-600 border border-gray-100 px-2.5 py-1 rounded-full">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* CTA buttons */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              {hospital.phone && (
                <a
                  href={`tel:${hospital.phone.replace(/\s/g, "")}`}
                  className="flex items-center justify-center gap-2 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-xl py-2.5 text-sm font-semibold transition-colors"
                >
                  <i className="ti ti-phone-call text-base" />Call Now
                </a>
              )}
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 btn-primary text-sm py-2.5"
              >
                <i className="ti ti-navigation text-base" />Get Directions
              </a>
              {!hospital.phone && (
                <a
                  href={mapsViewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 btn-secondary text-sm py-2.5"
                >
                  <i className="ti ti-map-2 text-base" />View on Map
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

// ── Hospital Card ──────────────────────────────────────────────────────────
function HospitalCard({ hospital, nearbyMode, onViewMap }) {
  const { name, city, type, address, phone, specialties = [], rating, emergency, featured, distance } = hospital;
  const tc = TYPE_CFG[type] || TYPE_CFG.Government;
  const visibleSpecs = specialties.slice(0, 3);
  const extra = specialties.length - 3;

  return (
    <div className="card-hover flex flex-col overflow-hidden group animate-fade-up">
      {/* Card header strip */}
      <div className={`h-1 w-full ${tc.dot}`} />

      <div className="p-4 flex flex-col flex-1 gap-3">
        {/* Top row: icon + badges */}
        <div className="flex items-start justify-between gap-2">
          <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
            type === "Government" ? "bg-blue-50 text-blue-600"
            : type === "Private"  ? "bg-teal-50 text-teal-600"
            : type === "Welfare"  ? "bg-purple-50 text-purple-600"
            : "bg-slate-50 text-slate-500"
          }`}>
            <i className={tc.icon} />
          </span>
          <div className="flex flex-wrap gap-1 justify-end">
            {featured && (
              <span className="badge text-[10px] py-0.5 px-2 bg-amber-50 text-amber-700 border border-amber-200">
                <i className="bx bxs-star text-[10px] mr-0.5" />Featured
              </span>
            )}
            <span className={`badge text-[10px] py-0.5 px-2 ${tc.cls}`}>{type}</span>
            {emergency && (
              <span className="badge badge-danger text-[10px] py-0.5 px-2">
                <i className="bx bxs-first-aid text-[10px] mr-0.5" />Emergency
              </span>
            )}
          </div>
        </div>

        {/* Name */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-teal-600 transition-colors">
            {name}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
            <i className="ti ti-map-pin text-[11px]" />{city}
          </p>
        </div>

        {/* Rating + distance */}
        <div className="flex items-center gap-2 flex-wrap">
          {rating && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              {[...Array(5)].map((_, i) => (
                <i key={i} className={`bx text-[11px] ${
                  i < Math.floor(rating) ? "bxs-star text-amber-400"
                  : i < rating           ? "bxs-star-half text-amber-400"
                  : "bx-star text-gray-200"
                }`} />
              ))}
              <span className="ml-0.5 font-medium text-gray-600">{rating}</span>
            </span>
          )}
          {nearbyMode && distance !== undefined && (
            <span className="badge badge-ok text-[10px] py-0.5 px-2 ml-auto">
              <i className="ti ti-current-location text-[10px] mr-0.5" />{distance} km
            </span>
          )}
        </div>

        {/* Address */}
        <p className="text-xs text-gray-500 flex items-start gap-1.5 leading-relaxed">
          <i className="ti ti-building text-[12px] mt-0.5 shrink-0 text-gray-400" />
          <span className="line-clamp-1">{address}</span>
        </p>

        {/* Phone */}
        {phone && (
          <p className="text-xs text-gray-500 flex items-center gap-1.5">
            <i className="ti ti-phone text-[12px] text-gray-400 shrink-0" />{phone}
          </p>
        )}

        {/* Specialties */}
        {specialties.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto pt-1">
            {visibleSpecs.map(s => (
              <span key={s} className="text-[10px] bg-gray-50 text-gray-500 border border-gray-100 px-2 py-0.5 rounded-full">
                {s}
              </span>
            ))}
            {extra > 0 && (
              <span className="text-[10px] bg-gray-50 text-gray-400 border border-gray-100 px-2 py-0.5 rounded-full">
                +{extra}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="px-4 pb-4 flex gap-1.5">
        <button
          onClick={() => onViewMap(hospital)}
          className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-xl py-2 transition-colors"
        >
          <i className="ti ti-map-2 text-sm" />View Map
        </button>
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lng}&travelmode=driving`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl py-2 transition-colors"
        >
          <i className="ti ti-navigation text-sm" />Directions
        </a>
        {phone && (
          <a
            href={`tel:${phone.replace(/\s/g, "")}`}
            className="w-9 shrink-0 flex items-center justify-center text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl py-2 transition-colors"
            title={phone}
          >
            <i className="ti ti-phone-call text-sm" />
          </a>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function HospitalPage() {
  const [hospitals, setHospitals]   = useState([]);
  const [total, setTotal]           = useState(0);
  const [pages, setPages]           = useState(1);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);

  const [search, setSearch]         = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [city, setCity]             = useState("");
  const [type, setType]             = useState("");
  const [specialty, setSpecialty]   = useState("");

  const [nearbyMode, setNearbyMode]   = useState(false);
  const [userCoords, setUserCoords]   = useState(null);
  const [showLocPrompt, setShowLocPrompt] = useState(false);
  const [mapHospital, setMapHospital]     = useState(null);

  const [cities, setCities]         = useState([]);
  const [types, setTypes]           = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [heroSettings, setHeroSettings] = useState({
    heroTitle:    "Find Hospitals Near You",
    heroSubtitle: "Government · Private · Welfare hospitals nationwide",
    buttonText:   "Nearby Hospitals",
  });

  const debounce = useRef(null);

  // ── Hero settings ─────────────────────────────────────────────────────
  useEffect(() => {
    api.get("/settings/hospital")
      .then(r => {
        const s = r.data.settings || {};
        setHeroSettings(prev => ({
          heroTitle:    s.heroTitle    || prev.heroTitle,
          heroSubtitle: s.heroSubtitle || prev.heroSubtitle,
          buttonText:   s.buttonText   || prev.buttonText,
        }));
      })
      .catch(() => {});
  }, []);

  // ── Meta ──────────────────────────────────────────────────────────────
  useEffect(() => {
    api.get("/hospitals/meta").then(r => {
      setCities(r.data.cities || []);
      setTypes(r.data.types || []);
      setSpecialties(r.data.specialties || []);
    }).catch(() => {});
  }, []);

  // ── Fetch ─────────────────────────────────────────────────────────────
  const fetchHospitals = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_SIZE };
      if (city)      params.city      = city;
      if (type)      params.type      = type;
      if (specialty) params.specialty = specialty;
      if (search)    params.search    = search;
      if (nearbyMode && userCoords) { params.lat = userCoords.lat; params.lng = userCoords.lng; params.radius = 10; }
      const r = await api.get("/hospitals", { params });
      setHospitals(r.data.hospitals || []);
      setTotal(r.data.total || 0);
      setPages(r.data.pages || 1);
    } catch {
      toast.error("Failed to load hospitals");
    } finally {
      setLoading(false);
    }
  }, [page, city, type, specialty, search, nearbyMode, userCoords]);

  useEffect(() => { fetchHospitals(); }, [fetchHospitals]);

  // ── Debounced search ─────────────────────────────────────────────────
  const handleSearch = val => {
    setSearchInput(val);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => { setPage(1); setSearch(val); }, 400);
  };

  const changeFilter = setter => val => { setter(val); setPage(1); };

  const clearAll = () => {
    setCity(""); setType(""); setSpecialty("");
    setSearch(""); setSearchInput(""); setPage(1);
  };

  // ── Nearby ────────────────────────────────────────────────────────────
  const handleNearby = () => setShowLocPrompt(true);

  const handleLocationGranted = coords => {
    setUserCoords(coords);
    setNearbyMode(true);
    setPage(1);
    setShowLocPrompt(false);
    toast.success("Showing hospitals within 10 km of your location");
  };

  const clearNearby = () => { setNearbyMode(false); setUserCoords(null); setPage(1); };

  const hasFilters = city || type || specialty || search;

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 pt-6 pb-2">
        <div className="grad-hero rounded-3xl p-6 lg:p-8 text-white shadow-2xl overflow-hidden relative">
          {/* Decorative circles — same as Emergency page */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />

          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5">
              {/* Icon block */}
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                <i className="ti ti-building-hospital text-3xl text-white" />
              </div>
              <div className="flex-1">
                <p className="text-teal-200 text-xs font-semibold uppercase tracking-widest mb-0.5">
                  Pakistan Hospital Directory
                </p>
                <h1 className="font-display font-black text-2xl lg:text-3xl tracking-tight leading-tight">
                  {heroSettings.heroTitle}
                </h1>
                <p className="text-white/60 text-sm mt-1">
                  {total > 0
                    ? `${total} hospitals listed · ${heroSettings.heroSubtitle}`
                    : heroSettings.heroSubtitle}
                </p>
              </div>

              {/* Nearby button */}
              {nearbyMode ? (
                <button
                  onClick={clearNearby}
                  className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white border border-white/30 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all active:scale-95 shrink-0"
                >
                  <i className="ti ti-current-location text-base" />Exit Nearby
                </button>
              ) : (
                <button
                  onClick={handleNearby}
                  className="inline-flex items-center gap-2 bg-white text-teal-700 hover:bg-teal-50 font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-md active:scale-95 shrink-0"
                >
                  <i className="ti ti-current-location text-base" />{heroSettings.buttonText}
                </button>
              )}
            </div>

            {/* Search bar */}
            <div className="relative max-w-xl">
              <i className="ti ti-search absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-300 pointer-events-none" />
              <input
                type="text"
                value={searchInput}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search by hospital name, city, specialty…"
                className="w-full pl-9 pr-10 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-teal-300/70 focus:outline-none focus:ring-2 focus:ring-white/30 text-sm"
              />
              {searchInput && (
                <button
                  onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-teal-300 hover:text-white transition-colors"
                >
                  <i className="ti ti-x text-lg" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky filter bar ────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-2">
          <div className="bg-white border border-gray-100 shadow-sm rounded-xl px-8 py-4 flex flex-wrap items-center gap-1.5">
          {/* City */}
          <div className="relative">
            <i className="ti ti-building-bank absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
            <select
              value={city}
              onChange={e => changeFilter(setCity)(e.target.value)}
              className="text-xs border border-gray-200 bg-gray-50 rounded-lg py-2 pl-7 pr-8 text-gray-700 focus:outline-none focus:border-teal-400 focus:bg-white transition-all min-w-[110px] appearance-none"
            >
              <option value="">All Cities</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Type */}
          <div className="relative">
            <i className="ti ti-category absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
            <select
              value={type}
              onChange={e => changeFilter(setType)(e.target.value)}
              className="text-xs border border-gray-200 bg-gray-50 rounded-lg py-2 pl-7 pr-8 text-gray-700 focus:outline-none focus:border-teal-400 focus:bg-white transition-all min-w-[110px] appearance-none"
            >
              <option value="">All Types</option>
              {types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Specialty */}
          <div className="relative">
            <i className="ti ti-stethoscope absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
            <select
              value={specialty}
              onChange={e => changeFilter(setSpecialty)(e.target.value)}
              className="text-xs border border-gray-200 bg-gray-50 rounded-lg py-2 pl-7 pr-8 text-gray-700 focus:outline-none focus:border-teal-400 focus:bg-white transition-all min-w-[130px] appearance-none"
            >
              <option value="">All Specialties</option>
              {specialties.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {hasFilters && (
            <button
              onClick={clearAll}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-0.5 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <i className="ti ti-x text-xs" />Clear
            </button>
          )}

          <div className="flex-1" />

          {/* Active filter chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {city && (
              <span className="badge badge-info text-[10px] py-0.5 px-2">
                <i className="ti ti-map-pin text-[10px] mr-0.5" />{city}
                <button onClick={() => changeFilter(setCity)("")} className="ml-1 hover:opacity-70 font-bold">×</button>
              </span>
            )}
            {type && (
              <span className={`badge text-[10px] py-0.5 px-2 ${(TYPE_CFG[type]?.cls) || "badge-info"}`}>
                {type}
                <button onClick={() => changeFilter(setType)("")} className="ml-1 hover:opacity-70 font-bold">×</button>
              </span>
            )}
            {specialty && (
              <span className="badge badge-amber text-[10px] py-0.5 px-2">
                <i className="ti ti-stethoscope text-[10px] mr-0.5" />{specialty}
                <button onClick={() => changeFilter(setSpecialty)("")} className="ml-1 hover:opacity-70 font-bold">×</button>
              </span>
            )}
            {nearbyMode && (
              <span className="badge badge-ok text-[10px] py-0.5 px-2">
                <i className="ti ti-current-location text-[10px] mr-0.5" />Nearby
                <button onClick={clearNearby} className="ml-1 hover:opacity-70 font-bold">×</button>
              </span>
            )}
          </div>
          </div>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-gray-500">
            {loading ? (
              <span className="text-gray-300">Loading…</span>
            ) : (
              <>
                <span className="font-semibold text-gray-700">{total}</span>{" "}
                hospital{total !== 1 ? "s" : ""}
                {nearbyMode && <span className="text-teal-600 font-medium"> · within 10 km of you</span>}
                {pages > 1 && <span className="text-gray-400"> · Page {page} of {pages}</span>}
              </>
            )}
          </p>
          {/* {!MAPS_KEY && (
            <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1 flex items-center gap-1">
              <i className="ti ti-info-circle" />Add <span className="font-mono mx-0.5">REACT_APP_GOOGLE_MAPS_API_KEY</span> for map embeds
            </span>
          )} */}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card animate-pulse overflow-hidden">
                <div className="h-1 bg-gray-100 w-full" />
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl" />
                    <div className="w-20 h-5 bg-gray-100 rounded-full" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="w-3/4 h-4 bg-gray-100 rounded" />
                    <div className="w-1/3 h-3 bg-gray-100 rounded" />
                  </div>
                  <div className="flex gap-1">
                    {[0,1,2].map(j => <div key={j} className="w-5 h-3 bg-gray-100 rounded-full" />)}
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded" />
                  <div className="w-2/3 h-3 bg-gray-100 rounded" />
                  <div className="flex gap-1">
                    {[0,1,2].map(j => <div key={j} className="w-14 h-4 bg-gray-100 rounded-full" />)}
                  </div>
                </div>
                <div className="px-4 pb-4 flex gap-2">
                  <div className="flex-1 h-8 bg-gray-100 rounded-xl" />
                  <div className="flex-1 h-8 bg-gray-100 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : hospitals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <i className="ti ti-building-hospital text-3xl text-gray-300" />
            </span>
            <h3 className="text-base font-bold text-gray-700 mb-1">No hospitals found</h3>
            <p className="text-sm text-gray-400 mb-5 max-w-xs">
              {nearbyMode
                ? "No hospitals found near your location. Try removing other filters or expand your search."
                : "Try different search terms or remove a filter."}
            </p>
            <button onClick={() => { clearAll(); if (nearbyMode) clearNearby(); }} className="btn-primary text-xs px-4 py-2">
              <i className="ti ti-refresh mr-1" />Clear all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {hospitals.map(h => (
              <HospitalCard key={h.id} hospital={h} nearbyMode={nearbyMode} onViewMap={setMapHospital} />
            ))}
          </div>
        )}

        <Pagination
          page={page} pages={pages}
          onChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
        />
      </div>

      {/* ── Emergency helplines ───────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 pb-10">
        <div className="card p-5">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4">
            <span className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
              <i className="bx bxs-first-aid text-red-500" />
            </span>
            Emergency Helplines — Pakistan
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {[
              { label: "Rescue / Police",  number: "15"               },
              { label: "Edhi Ambulance",   number: "115"              },
              { label: "Fire Brigade",     number: "16"               },
              { label: "Rescue 1122",      number: "1122"             },
              { label: "Chippa",           number: "1020"             },
              { label: "Child Protection", number: "1099"             },
              { label: "Sehat Sahulat",    number: "0800-15000"       },
              { label: "Mental Health",    number: "0317-4288665"     },
              { label: "Disaster Mgmt",    number: "021-111-111-100"  },
              { label: "Aman Foundation",  number: "115"              },
            ].map(e => (
              <a
                key={e.label}
                href={`tel:${e.number.replace(/[-\s]/g, "")}`}
                className="flex flex-col items-center bg-red-50 hover:bg-red-100 border border-red-100 rounded-xl p-3 transition-colors text-center group active:scale-95"
              >
                <span className="text-[10px] font-semibold text-gray-600 leading-tight mb-1.5 group-hover:text-red-700 transition-colors">
                  {e.label}
                </span>
                <span className="text-sm font-black text-red-600 tracking-tight">{e.number}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── Map Modal ─────────────────────────────────────────────────────── */}
      {mapHospital && (
        <MapModal hospital={mapHospital} onClose={() => setMapHospital(null)} />
      )}

      {/* ── Location Permission Modal ──────────────────────────────────────── */}
      {showLocPrompt && (
        <LocationPermissionModal
          onConfirm={handleLocationGranted}
          onClose={() => setShowLocPrompt(false)}
        />
      )}
    </div>
  );
}

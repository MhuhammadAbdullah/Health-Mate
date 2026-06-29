import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import api from "../../lib/api";
import toast from "react-hot-toast";

// ── Constants ──────────────────────────────────────────────────────────────
const HOSPITAL_TYPES = ["Government", "Private", "Welfare", "Military"];

const PAKISTAN_CITIES = [
  "Abbottabad","Bahawalpur","D.G. Khan","Faisalabad","Gujranwala","Gujrat",
  "Hyderabad","Islamabad","Karachi","Lahore","Larkana","Mardan","Mirpur (AJK)",
  "Multan","Nawabshah","Peshawar","Quetta","Rawalpindi","Sahiwal","Sargodha",
  "Sheikhupura","Sialkot","Sukkur",
];

const BLANK_FORM = {
  name: "", city: "", address: "", phone: "", type: "Government",
  emergency: false, featured: false, specialties: "", rating: "", lat: "", lng: "",
};

const PAGE_SIZE = 15;

// ── Helpers ────────────────────────────────────────────────────────────────
function isAdminUser(user) {
  const envIds = (process.env.REACT_APP_ADMIN_USER_IDS || "")
    .split(",").map(s => s.trim()).filter(Boolean);
  return envIds.includes(user?.id || "");
}

// ── Scroll lock hook ──────────────────────────────────────────────────────
function useScrollLock() {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);
}

// ── Confirm Delete Dialog ──────────────────────────────────────────────────
function ConfirmDialog({ hospital, onConfirm, onCancel }) {
  useScrollLock();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-scale-in">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <i className="ti ti-trash text-red-600 text-xl" />
        </div>
        <h3 className="text-base font-bold text-gray-900 text-center mb-1">Delete Hospital?</h3>
        <p className="text-sm text-gray-500 text-center mb-5">
          <span className="font-semibold text-gray-700">{hospital.name}</span> will be permanently removed.
          This cannot be undone.
        </p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2.5 text-sm font-semibold border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 py-2.5 text-sm font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Hospital Form Modal ────────────────────────────────────────────────────
function HospitalForm({ initial, onSave, onClose, saving }) {
  const [form, setForm] = useState(() =>
    initial
      ? {
          ...initial,
          specialties: Array.isArray(initial.specialties)
            ? initial.specialties.join(", ")
            : initial.specialties || "",
          rating: initial.rating ?? "",
          lat:    initial.lat    ?? "",
          lng:    initial.lng    ?? "",
        }
      : BLANK_FORM
  );

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.name.trim())    return toast.error("Hospital name is required");
    if (!form.city.trim())    return toast.error("City is required");
    if (!form.address.trim()) return toast.error("Address is required");
    if (!form.type)           return toast.error("Type is required");

    const payload = {
      name:       form.name.trim(),
      city:       form.city.trim(),
      address:    form.address.trim(),
      phone:      form.phone.trim(),
      type:       form.type,
      emergency:  form.emergency,
      featured:   form.featured,
      specialties: form.specialties
        .split(",").map(s => s.trim()).filter(Boolean),
      rating:     form.rating !== "" ? parseFloat(form.rating) : null,
      lat:        form.lat    !== "" ? parseFloat(form.lat)    : null,
      lng:        form.lng    !== "" ? parseFloat(form.lng)    : null,
    };
    onSave(payload);
  };

  useScrollLock();
  const isEdit = !!initial;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop — fixed so it always covers the full viewport */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      {/* Modal card — fixed height cap, internal scroll */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-scale-in flex flex-col max-h-[80vh]">
        {/* Sticky header */}
        <div className="grad-hero text-white px-6 py-4 flex items-center justify-between rounded-t-2xl flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold">{isEdit ? "Edit Hospital" : "Add New Hospital"}</h2>
            <p className="text-teal-200 text-xs mt-0.5">
              {isEdit ? `Editing: ${initial.name}` : "Fill in the hospital details below"}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
            <i className="ti ti-x text-lg" />
          </button>
        </div>

        {/* Scrollable form body */}
        <div className="overflow-y-auto overscroll-contain flex-1">
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Hospital Name <span className="text-red-500">*</span>
            </label>
            <input
              value={form.name}
              onChange={e => set("name", e.target.value)}
              placeholder="e.g. Aga Khan University Hospital"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 transition-all"
            />
          </div>

          {/* City + Type row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                City <span className="text-red-500">*</span>
              </label>
              <select
                value={PAKISTAN_CITIES.includes(form.city) ? form.city : "__custom__"}
                onChange={e => {
                  if (e.target.value !== "__custom__") set("city", e.target.value);
                  else set("city", "");
                }}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400 transition-all bg-white"
              >
                <option value="">Select city…</option>
                {PAKISTAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                <option value="__custom__">Other city…</option>
              </select>
              {(!PAKISTAN_CITIES.includes(form.city) || form.city === "") && (
                <input
                  value={form.city}
                  onChange={e => set("city", e.target.value)}
                  placeholder="Enter city name"
                  className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400 transition-all"
                />
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                value={form.type}
                onChange={e => set("type", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400 transition-all bg-white"
              >
                {HOSPITAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Address <span className="text-red-500">*</span>
            </label>
            <input
              value={form.address}
              onChange={e => set("address", e.target.value)}
              placeholder="e.g. Stadium Road, Karachi"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400 transition-all"
            />
          </div>

          {/* Phone + Rating row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone</label>
              <input
                value={form.phone}
                onChange={e => set("phone", e.target.value)}
                placeholder="e.g. 021-111-911-911"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Rating (0–5)</label>
              <input
                type="number" min="0" max="5" step="0.1"
                value={form.rating}
                onChange={e => set("rating", e.target.value)}
                placeholder="e.g. 4.8"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400 transition-all"
              />
            </div>
          </div>

          {/* Lat + Lng row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Latitude</label>
              <input
                type="number" step="any"
                value={form.lat}
                onChange={e => set("lat", e.target.value)}
                placeholder="e.g. 24.8915"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Longitude</label>
              <input
                type="number" step="any"
                value={form.lng}
                onChange={e => set("lng", e.target.value)}
                placeholder="e.g. 67.0723"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400 transition-all"
              />
            </div>
          </div>

          {/* Specialties */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              Specialties <span className="text-gray-400 font-normal">(comma-separated)</span>
            </label>
            <input
              value={form.specialties}
              onChange={e => set("specialties", e.target.value)}
              placeholder="e.g. Cardiology, Oncology, Neurology"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400 transition-all"
            />
          </div>

          {/* Emergency + Featured toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <button
                type="button"
                onClick={() => set("emergency", !form.emergency)}
                className={`relative w-10 h-6 rounded-full transition-colors ${form.emergency ? "bg-red-500" : "bg-gray-200"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.emergency ? "translate-x-4" : ""}`} />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">Emergency</p>
                <p className="text-xs text-gray-500">24/7 emergency dept</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
              <button
                type="button"
                onClick={() => set("featured", !form.featured)}
                className={`relative w-10 h-6 rounded-full transition-colors ${form.featured ? "bg-amber-400" : "bg-gray-200"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.featured ? "translate-x-4" : ""}`} />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">Featured</p>
                <p className="text-xs text-gray-500">Pin to top of list</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1 border-t border-gray-100">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 text-sm font-semibold border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 text-sm font-bold btn-primary disabled:opacity-60 flex items-center justify-center gap-1.5">
              {saving
                ? <><i className="ti ti-loader-2 animate-spin" />{isEdit ? "Saving…" : "Adding…"}</>
                : <><i className={`ti ${isEdit ? "ti-device-floppy" : "ti-plus"}`} />{isEdit ? "Save Changes" : "Add Hospital"}</>
              }
            </button>
          </div>
        </form>
        </div>{/* end scrollable body */}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function HospitalManagementPage() {
  const { user, isLoaded } = useUser();

  const [hospitals, setHospitals] = useState([]);
  const [total, setTotal]         = useState(0);
  const [pages, setPages]         = useState(1);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(true);

  const [search, setSearch]         = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const [cities, setCities] = useState([]);
  const debounce = useRef(null);

  const [formOpen, setFormOpen]       = useState(false);
  const [editTarget, setEditTarget]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving]           = useState(false);

  const isAdmin = isLoaded && isAdminUser(user);

  // ── Fetch hospitals ────────────────────────────────────────────────────
  const fetchHospitals = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_SIZE };
      if (cityFilter) params.city  = cityFilter;
      if (typeFilter) params.type  = typeFilter;
      if (search)     params.search = search;
      const r = await api.get("/hospitals", { params });
      setHospitals(r.data.hospitals || []);
      setTotal(r.data.total || 0);
      setPages(r.data.pages || 1);
    } catch {
      toast.error("Failed to load hospitals");
    } finally {
      setLoading(false);
    }
  }, [page, cityFilter, typeFilter, search]);

  useEffect(() => { fetchHospitals(); }, [fetchHospitals]);

  // ── Load city list for filter ──────────────────────────────────────────
  useEffect(() => {
    api.get("/hospitals/meta")
      .then(r => setCities(r.data.cities || []))
      .catch(() => {});
  }, []);

  // ── Debounced search ───────────────────────────────────────────────────
  const handleSearch = val => {
    setSearchInput(val);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => { setPage(1); setSearch(val); }, 400);
  };

  // ── CRUD handlers ──────────────────────────────────────────────────────
  const openAdd  = ()  => { setEditTarget(null); setFormOpen(true); };
  const openEdit = (h) => { setEditTarget(h);    setFormOpen(true); };

  const handleSave = async payload => {
    setSaving(true);
    try {
      if (editTarget) {
        await api.put(`/hospitals/${editTarget.id}`, payload);
        toast.success("Hospital updated");
      } else {
        await api.post("/hospitals", payload);
        toast.success("Hospital added");
      }
      setFormOpen(false);
      fetchHospitals();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save hospital");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/hospitals/${deleteTarget.id}`);
      toast.success("Hospital deleted");
      setDeleteTarget(null);
      if (hospitals.length === 1 && page > 1) setPage(p => p - 1);
      else fetchHospitals();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete hospital");
    }
  };

  // ── Access guard ───────────────────────────────────────────────────────
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-teal-100 border-t-teal-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/404" replace />;
  }

  const TYPE_COLOR = {
    Government: "badge-info",
    Private:    "badge-ok",
    Welfare:    "badge-purple",
    Military:   "badge bg-slate-50 text-slate-600 border border-slate-200",
  };

  return (
    <div className="space-y-5">
      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
              <i className="ti ti-building-hospital text-teal-600" />
            </span>
            Hospital Management
          </h1>
          <p className="text-sm text-gray-400 mt-0.5 ml-10">
            {loading ? "Loading…" : `${total} hospital${total !== 1 ? "s" : ""} in database`}
          </p>
        </div>
        <button onClick={openAdd} className="btn-primary text-sm px-5 py-2.5 flex items-center gap-1.5 shrink-0">
          <i className="ti ti-plus text-base" />Add Hospital
        </button>
      </div>

      {/* ── Filter bar ───────────────────────────────────────────────── */}
      <div className="card p-4 flex flex-wrap gap-2 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
          <input
            value={searchInput}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search by name, city, specialty…"
            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-teal-400 transition-all"
          />
          {searchInput && (
            <button onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <i className="ti ti-x text-sm" />
            </button>
          )}
        </div>

        {/* City filter */}
        <select
          value={cityFilter}
          onChange={e => { setCityFilter(e.target.value); setPage(1); }}
          className="text-sm border border-gray-200 rounded-xl py-2 px-3 focus:outline-none focus:border-teal-400 bg-white min-w-[130px]"
        >
          <option value="">All Cities</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
          className="text-sm border border-gray-200 rounded-xl py-2 px-3 focus:outline-none focus:border-teal-400 bg-white min-w-[130px]"
        >
          <option value="">All Types</option>
          {HOSPITAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        {(cityFilter || typeFilter || search) && (
          <button
            onClick={() => { setCityFilter(""); setTypeFilter(""); setSearch(""); setSearchInput(""); setPage(1); }}
            className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-0.5 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <i className="ti ti-x text-xs" />Clear filters
          </button>
        )}
      </div>

      {/* ── Table ────────────────────────────────────────────────────── */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-teal-100 border-t-teal-500 rounded-full animate-spin" />
          </div>
        ) : hospitals.length === 0 ? (
          <div className="p-12 text-center">
            <i className="ti ti-building-hospital text-4xl text-gray-200 block mb-3" />
            <p className="text-gray-500 font-medium">No hospitals found</p>
            <p className="text-xs text-gray-400 mt-1">Try clearing filters or add a new hospital</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <th className="text-left px-4 py-3 pl-5">Hospital</th>
                    <th className="text-left px-4 py-3">City</th>
                    <th className="text-left px-4 py-3">Type</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Phone</th>
                    <th className="text-left px-4 py-3">Coords</th>
                    <th className="text-right px-4 py-3 pr-5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {hospitals.map(h => (
                    <tr key={h.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-4 py-3 pl-5">
                        <div className="font-semibold text-gray-900 leading-snug">{h.name}</div>
                        {h.specialties?.length > 0 && (
                          <div className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[220px]">
                            {h.specialties.slice(0, 3).join(" · ")}
                            {h.specialties.length > 3 && ` +${h.specialties.length - 3}`}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{h.city}</td>
                      <td className="px-4 py-3">
                        <span className={`badge text-[10px] py-0.5 px-2 ${TYPE_COLOR[h.type] || "badge-info"}`}>
                          {h.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          {h.featured && (
                            <span className="badge text-[10px] py-0.5 px-2 bg-amber-50 text-amber-700 border border-amber-200 w-fit">
                              <i className="bx bxs-star text-[10px] mr-0.5" />Featured
                            </span>
                          )}
                          {h.emergency && (
                            <span className="badge badge-danger text-[10px] py-0.5 px-2 w-fit">
                              <i className="bx bxs-first-aid text-[10px] mr-0.5" />Emergency
                            </span>
                          )}
                          {!h.featured && !h.emergency && <span className="text-gray-300 text-xs">—</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{h.phone || "—"}</td>
                      <td className="px-4 py-3 text-[11px] font-mono text-gray-400">
                        {h.lat && h.lng
                          ? <span className="text-teal-600"><i className="ti ti-map-pin text-[10px] mr-0.5" />{h.lat?.toFixed(4)}, {h.lng?.toFixed(4)}</span>
                          : <span className="text-amber-400"><i className="ti ti-map-pin-off text-[10px] mr-0.5" />missing</span>
                        }
                      </td>
                      <td className="px-4 py-3 pr-5">
                        <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(h)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                            title="Edit"
                          >
                            <i className="ti ti-pencil text-sm" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(h)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <i className="ti ti-trash text-sm" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-50">
              {hospitals.map(h => (
                <div key={h.id} className="p-4 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`badge text-[10px] py-0.5 px-2 ${TYPE_COLOR[h.type] || "badge-info"}`}>{h.type}</span>
                      {h.emergency && <span className="badge badge-danger text-[10px] py-0.5 px-2">Emergency</span>}
                    </div>
                    <p className="text-sm font-semibold text-gray-900 leading-snug">{h.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <i className="ti ti-map-pin text-[11px]" />{h.city}
                    </p>
                    {h.phone && <p className="text-xs text-gray-500 mt-0.5">{h.phone}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => openEdit(h)} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-teal-600 hover:bg-teal-50 border border-gray-100 transition-colors">
                      <i className="ti ti-pencil text-sm" />
                    </button>
                    <button onClick={() => setDeleteTarget(h)} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 border border-gray-100 transition-colors">
                      <i className="ti ti-trash text-sm" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Pagination ────────────────────────────────────────────────── */}
      {pages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{total} results · Page {page} of {pages}</span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <i className="ti ti-chevron-left text-base" />
            </button>
            {[...Array(pages)].map((_, i) => (
              <button
                key={i} onClick={() => setPage(i + 1)}
                className={`w-8 h-8 rounded-lg text-sm font-semibold transition-all ${
                  page === i + 1 ? "bg-teal-500 text-white" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {i + 1}
              </button>
            )).slice(Math.max(0, page - 3), Math.min(pages, page + 2))}
            <button
              onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <i className="ti ti-chevron-right text-base" />
            </button>
          </div>
        </div>
      )}

      {/* ── Modals ────────────────────────────────────────────────────── */}
      {formOpen && (
        <HospitalForm
          initial={editTarget}
          onSave={handleSave}
          onClose={() => setFormOpen(false)}
          saving={saving}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          hospital={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

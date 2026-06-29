import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import api from "../../lib/api";
import toast from "react-hot-toast";

// ── Constants ──────────────────────────────────────────────────────────────
const PAGE_SIZE = 12;

const ICON_OPTIONS = [
  { value:"bx bxs-first-aid",     label:"First Aid"       },
  { value:"bx bxs-badge-check",   label:"Badge / Police"  },
  { value:"bx bx-plus-medical",   label:"Medical Cross"   },
  { value:"bx bxs-flame",         label:"Flame / Fire"    },
  { value:"bx bxs-heart",         label:"Heart"           },
  { value:"bx bxs-error",         label:"Alert / Error"   },
  { value:"bx bxs-baby-carriage", label:"Child Care"      },
  { value:"bx bxs-clinic",        label:"Clinic"          },
  { value:"bx bxs-brain",         label:"Mental Health"   },
  { value:"bx bxs-phone",         label:"Phone"           },
  { value:"bx bxs-ambulance",     label:"Ambulance"       },
  { value:"bx bxs-shield",        label:"Shield"          },
];

const PRESET_COLORS = [
  "#185FA5","#A32D2D","#0F6E56","#993C1D","#533AB7","#854F0B",
  "#1A7742","#C2410C","#1D4ED8","#BE185D","#0891B2","#374151",
];

const CATEGORIES = [
  "Ambulance","Police","Fire Brigade","Rescue","Disaster Management",
  "Women Helpline","Child Helpline","Mental Health","Cyber Crime",
  "Blood Bank","Poison Control","Other",
];

const PROVINCES = [
  "National","Sindh","Punjab","KPK","Balochistan",
  "Islamabad","Gilgit Baltistan","AJK",
];

const BLANK = {
  name: "", number: "", desc: "",
  icon: "bx bxs-first-aid", color: "#185FA5",
  category: "", province: "", city: "",
  featured: false, order: 0,
};

function isAdminUser(user) {
  const envIds = (process.env.REACT_APP_ADMIN_USER_IDS || "")
    .split(",").map(s => s.trim()).filter(Boolean);
  return envIds.includes(user?.id || "");
}

// ── Color Picker ───────────────────────────────────────────────────────────
function ColorPicker({ value, onChange }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {PRESET_COLORS.map(c => (
          <button key={c} type="button" onClick={() => onChange(c)}
            className={`w-7 h-7 rounded-lg border-2 transition-all ${value === c ? "border-gray-900 scale-110" : "border-transparent"}`}
            style={{ background: c }} />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={e => onChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer border border-gray-200" />
        <input type="text" value={value}
          onChange={e => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) onChange(e.target.value); }}
          className="w-28 border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-teal-400"
          placeholder="#000000" />
        <span className="w-8 h-8 rounded-lg border border-gray-100 flex-shrink-0" style={{ background: value }} />
      </div>
    </div>
  );
}

// ── Pagination ─────────────────────────────────────────────────────────────
function Pagination({ page, pages, total, onChange }) {
  if (pages <= 1) return null;
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  const end   = Math.min(pages, start + 4);
  const nums  = [];
  for (let i = start; i <= end; i++) nums.push(i);
  return (
    <div className="flex items-center justify-between text-sm text-gray-500 pt-4">
      <span className="text-xs text-gray-400">{total} result{total !== 1 ? "s" : ""} · Page {page} of {pages}</span>
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(page - 1)} disabled={page === 1}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
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
            className={`w-8 h-8 rounded-lg text-sm font-semibold transition-all ${p === page ? "bg-red-500 text-white" : "text-gray-500 hover:bg-gray-100"}`}>
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
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
          <i className="ti ti-chevron-right text-base" />
        </button>
      </div>
    </div>
  );
}

// ── Scroll lock — prevent background scroll while any modal is open ─────────
function useScrollLock() {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);
}

// ── Confirm Delete ─────────────────────────────────────────────────────────
function ConfirmDialog({ service, onConfirm, onCancel }) {
  useScrollLock();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-scale-in">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <i className="ti ti-trash text-red-600 text-xl" />
        </div>
        <h3 className="text-base font-bold text-gray-900 text-center mb-1">Delete Service?</h3>
        <p className="text-sm text-gray-500 text-center mb-5">
          <span className="font-semibold text-gray-700">{service.name}</span> will be permanently removed.
        </p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2.5 text-sm font-semibold border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 text-sm font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors">Delete</button>
        </div>
      </div>
    </div>
  );
}

// ── Service Form Modal ─────────────────────────────────────────────────────
function ServiceForm({ initial, onSave, onClose, saving }) {
  useScrollLock();
  const [form, setForm] = useState(() => initial ? { ...BLANK, ...initial } : { ...BLANK });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.name.trim())   return toast.error("Service name is required");
    if (!form.number.trim()) return toast.error("Phone number is required");
    onSave({
      name:     form.name.trim(),
      number:   form.number.trim(),
      desc:     form.desc.trim(),
      icon:     form.icon,
      color:    form.color,
      category: form.category,
      province: form.province,
      city:     form.city.trim(),
      featured: form.featured,
      order:    parseInt(form.order) || 0,
    });
  };

  const isEdit = !!initial;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-1 pt-8 pb-1">
      {/* Backdrop — always covers full viewport */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      {/* Modal card — capped height, scrollable body */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-scale-in flex flex-col max-h-[80vh]">
        {/* Sticky header */}
        <div className="grad-sos text-white px-6 py-4 flex items-center justify-between rounded-t-2xl flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold">{isEdit ? "Edit Service" : "Add Emergency Service"}</h2>
            <p className="text-red-200 text-xs mt-0.5">
              {isEdit ? `Editing: ${initial.name}` : "Add a new emergency helpline"}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
            <i className="ti ti-x text-lg" />
          </button>
        </div>

        {/* Scrollable form body */}
        <div className="overflow-y-auto overscroll-contain flex-1">
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Preview */}
          <div className="p-4 rounded-xl border-2 border-dashed border-gray-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${form.color}18` }}>
              <i className={`${form.icon} text-2xl`} style={{ color: form.color }} />
            </div>
            <div>
              <div className="text-sm font-bold text-gray-900">{form.name || "Service Name"}</div>
              <div className="text-2xl font-black leading-none mt-0.5" style={{ color: form.color }}>{form.number || "000"}</div>
              <div className="text-xs text-gray-400 mt-0.5">{form.desc || "Description"}</div>
            </div>
          </div>

          {/* Name + Number */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Service Name <span className="text-red-500">*</span></label>
              <input value={form.name} onChange={e => set("name", e.target.value)}
                placeholder="e.g. Rescue 1122"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400 transition-all" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone Number <span className="text-red-500">*</span></label>
              <input value={form.number} onChange={e => set("number", e.target.value)}
                placeholder="e.g. 1122"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400 transition-all" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Description</label>
            <input value={form.desc} onChange={e => set("desc", e.target.value)}
              placeholder="e.g. Emergency rescue service (Punjab)"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400 transition-all" />
          </div>

          {/* Category + Province */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Category</label>
              <select value={form.category} onChange={e => set("category", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400 transition-all bg-white">
                <option value="">Select category…</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Province / Region</label>
              <select value={form.province} onChange={e => set("province", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400 transition-all bg-white">
                <option value="">Select province…</option>
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          {/* City */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              City <span className="text-gray-400 font-normal">(optional, for city-specific services)</span>
            </label>
            <input value={form.city} onChange={e => set("city", e.target.value)}
              placeholder="e.g. Karachi, Lahore, or leave empty for province-wide"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400 transition-all" />
          </div>

          {/* Icon */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Icon</label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map(opt => (
                <button key={opt.value} type="button" onClick={() => set("icon", opt.value)} title={opt.label}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all ${
                    form.icon === opt.value ? "border-teal-500 bg-teal-50" : "border-gray-100 hover:border-gray-300 bg-white"
                  }`}>
                  <i className={`${opt.value} text-xl ${form.icon === opt.value ? "text-teal-600" : "text-gray-500"}`} />
                </button>
              ))}
            </div>
            <input value={form.icon} onChange={e => set("icon", e.target.value)}
              placeholder="Custom icon class (e.g. bx bxs-phone)"
              className="mt-2 w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-teal-400 transition-all" />
          </div>

          {/* Color */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Card Color</label>
            <ColorPicker value={form.color} onChange={v => set("color", v)} />
          </div>

          {/* Featured toggle */}
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
            <button type="button" onClick={() => set("featured", !form.featured)}
              className={`relative w-10 h-6 rounded-full transition-colors ${form.featured ? "bg-amber-400" : "bg-gray-200"}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.featured ? "translate-x-4" : ""}`} />
            </button>
            <div>
              <p className="text-sm font-semibold text-gray-800">Featured Service</p>
              <p className="text-xs text-gray-500">Pin to top of the emergency list</p>
            </div>
            {form.featured && (
              <span className="ml-auto text-xs font-bold bg-amber-400 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                <i className="bx bxs-star text-[10px]" />Featured
              </span>
            )}
          </div>

          {/* Order */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Display Order</label>
            <input type="number" min="0" value={form.order} onChange={e => set("order", e.target.value)}
              className="w-24 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400 transition-all" />
            <p className="text-xs text-gray-400 mt-1">Lower number = shown first</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1 border-t border-gray-100">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 text-sm font-semibold border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 text-sm font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5">
              {saving
                ? <><i className="ti ti-loader-2 animate-spin" />{isEdit ? "Saving…" : "Adding…"}</>
                : <><i className={`ti ${isEdit ? "ti-device-floppy" : "ti-plus"}`} />{isEdit ? "Save Changes" : "Add Service"}</>
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
export default function EmergencyManagementPage() {
  const { user, isLoaded } = useUser();

  const [services, setServices]   = useState([]);
  const [total, setTotal]         = useState(0);
  const [pages, setPages]         = useState(1);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(true);

  // Filters
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch]           = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [provinceFilter, setProvinceFilter] = useState("");
  const [featuredFilter, setFeaturedFilter] = useState("");
  const [sortOrder, setSortOrder]           = useState("");

  // Modals
  const [formOpen, setFormOpen]         = useState(false);
  const [editTarget, setEditTarget]     = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving]             = useState(false);

  const debounce = useRef(null);
  const isAdmin  = isLoaded && isAdminUser(user);

  const hasFilters = search || categoryFilter || provinceFilter || featuredFilter || sortOrder;

  // ── Fetch ──────────────────────────────────────────────────────────────
  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_SIZE };
      if (search)         params.search   = search;
      if (categoryFilter) params.category = categoryFilter;
      if (provinceFilter) params.province = provinceFilter;
      if (featuredFilter) params.featured = featuredFilter;
      if (sortOrder)      params.sort     = sortOrder;

      const r = await api.get("/emergency", { params });
      setServices(r.data.emergencyNumbers || []);
      setTotal(r.data.total  || 0);
      setPages(r.data.pages  || 1);
    } catch {
      toast.error("Failed to load emergency services");
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryFilter, provinceFilter, featuredFilter, sortOrder]);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const handleSearch = val => {
    setSearchInput(val);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => { setSearch(val); setPage(1); }, 400);
  };

  const setFilter = setter => val => { setter(val); setPage(1); };

  const clearFilters = () => {
    setSearchInput(""); setSearch(""); setCategoryFilter("");
    setProvinceFilter(""); setFeaturedFilter(""); setSortOrder(""); setPage(1);
  };

  // ── CRUD ───────────────────────────────────────────────────────────────
  const openAdd  = ()  => { setEditTarget(null); setFormOpen(true); };
  const openEdit = (s) => { setEditTarget(s);    setFormOpen(true); };

  const handleSave = async payload => {
    setSaving(true);
    try {
      if (editTarget) {
        await api.put(`/emergency/${editTarget.id}`, payload);
        toast.success("Service updated");
      } else {
        await api.post("/emergency", payload);
        toast.success("Service added");
      }
      setFormOpen(false);
      fetchServices();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/emergency/${deleteTarget.id}`);
      toast.success("Service deleted");
      setDeleteTarget(null);
      if (services.length === 1 && page > 1) setPage(p => p - 1);
      else fetchServices();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    }
  };

  // ── Guards ─────────────────────────────────────────────────────────────
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-teal-100 border-t-teal-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/404" replace />;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <i className="bx bxs-first-aid text-red-500 text-base" />
            </span>
            Emergency Services
          </h1>
          <p className="text-sm text-gray-400 mt-0.5 ml-10">
            {loading ? "Loading…" : `${total} service${total !== 1 ? "s" : ""} in database`}
          </p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors shrink-0">
          <i className="ti ti-plus text-base" />Add Service
        </button>
      </div>

      {/* Filter bar */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
            <input
              value={searchInput} onChange={e => handleSearch(e.target.value)}
              placeholder="Search by name, number, description…"
              className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-teal-400 transition-all"
            />
            {searchInput && (
              <button onClick={() => handleSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <i className="ti ti-x text-sm" />
              </button>
            )}
          </div>

          {/* Category */}
          <select value={categoryFilter} onChange={e => setFilter(setCategoryFilter)(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl py-2 px-3 focus:outline-none focus:border-teal-400 bg-white min-w-[130px]">
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Province */}
          <select value={provinceFilter} onChange={e => setFilter(setProvinceFilter)(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl py-2 px-3 focus:outline-none focus:border-teal-400 bg-white min-w-[120px]">
            <option value="">All Provinces</option>
            {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          {/* Featured */}
          <select value={featuredFilter} onChange={e => setFilter(setFeaturedFilter)(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl py-2 px-3 focus:outline-none focus:border-teal-400 bg-white">
            <option value="">All Services</option>
            <option value="true">Featured Only</option>
          </select>

          {/* Sort */}
          <select value={sortOrder} onChange={e => setFilter(setSortOrder)(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl py-2 px-3 focus:outline-none focus:border-teal-400 bg-white">
            <option value="">Default Order</option>
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>

          {hasFilters && (
            <button onClick={clearFilters}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-0.5 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors whitespace-nowrap">
              <i className="ti ti-x text-xs" />Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-teal-100 border-t-teal-500 rounded-full animate-spin" />
          </div>
        ) : services.length === 0 ? (
          <div className="p-12 text-center">
            <i className="bx bxs-first-aid text-4xl text-gray-200 block mb-3" />
            <p className="text-gray-500 font-medium">No services found</p>
            {hasFilters && (
              <button onClick={clearFilters} className="text-sm text-red-600 hover:underline mt-2">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <th className="text-left px-4 py-3 pl-5 w-8">#</th>
                    <th className="text-left px-4 py-3">Icon</th>
                    <th className="text-left px-4 py-3">Service</th>
                    <th className="text-left px-4 py-3">Number</th>
                    <th className="text-left px-4 py-3">Category</th>
                    <th className="text-left px-4 py-3">Province</th>
                    <th className="text-left px-4 py-3">Color</th>
                    <th className="text-right px-4 py-3 pr-5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {services.map((s, idx) => (
                    <tr key={s.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-4 py-3 pl-5 text-xs text-gray-400 font-mono">{((page - 1) * PAGE_SIZE) + idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${s.color}18` }}>
                          <i className={`${s.icon} text-lg`} style={{ color: s.color }} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-gray-900">{s.name}</span>
                          {s.featured && (
                            <span className="badge text-[9px] py-0.5 px-1.5 bg-amber-50 text-amber-700 border border-amber-200">
                              <i className="bx bxs-star text-[9px] mr-0.5" />Featured
                            </span>
                          )}
                        </div>
                        {s.desc && <div className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[180px]">{s.desc}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-display font-black text-lg" style={{ color: s.color }}>{s.number}</span>
                      </td>
                      <td className="px-4 py-3">
                        {s.category
                          ? <span className="badge badge-info text-[10px] py-0.5 px-2">{s.category}</span>
                          : <span className="text-gray-300 text-xs">—</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{s.province || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md border border-gray-100" style={{ background: s.color }} />
                          <span className="text-xs font-mono text-gray-400">{s.color}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 pr-5">
                        <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(s)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors" title="Edit">
                            <i className="ti ti-pencil text-sm" />
                          </button>
                          <button onClick={() => setDeleteTarget(s)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Delete">
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
              {services.map(s => (
                <div key={s.id} className="p-4 flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}18` }}>
                    <i className={`${s.icon} text-2xl`} style={{ color: s.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <span className="text-sm font-semibold text-gray-900">{s.name}</span>
                      {s.featured && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          <i className="bx bxs-star text-[9px]" />
                        </span>
                      )}
                    </div>
                    <div className="font-display font-black text-xl leading-none mt-0.5" style={{ color: s.color }}>{s.number}</div>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {s.category && <span className="badge badge-info text-[9px] py-0.5 px-1.5">{s.category}</span>}
                      {s.province && <span className="text-[10px] text-gray-400">{s.province}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => openEdit(s)} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-teal-600 hover:bg-teal-50 border border-gray-100 transition-colors">
                      <i className="ti ti-pencil text-sm" />
                    </button>
                    <button onClick={() => setDeleteTarget(s)} className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 border border-gray-100 transition-colors">
                      <i className="ti ti-trash text-sm" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="px-5 pb-4">
              <Pagination page={page} pages={pages} total={total} onChange={setPage} />
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      {formOpen && (
        <ServiceForm initial={editTarget} onSave={handleSave} onClose={() => setFormOpen(false)} saving={saving} />
      )}
      {deleteTarget && (
        <ConfirmDialog service={deleteTarget} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      )}
    </div>
  );
}

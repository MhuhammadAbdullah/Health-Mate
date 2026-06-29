import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useUser, useClerk } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { Country, City } from "country-state-city";
import api from "../lib/api";
import toast from "react-hot-toast";

const BLOOD_GROUPS = ["A+","A-","B+","B-","AB+","AB-","O+","O-"];
const MAX_B64_BYTES = 1.5 * 1024 * 1024;

// ── Helpers ──────────────────────────────────────────────────────────────────
function compressImage(file, maxPx = 400) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const s = Math.min(1, maxPx / Math.max(img.width, img.height));
        const w = Math.round(img.width * s), h = Math.round(img.height * s);
        const cv = document.createElement("canvas");
        cv.width = w; cv.height = h;
        cv.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(cv.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Searchable combobox (reused for Country and City) ─────────────────────
function ComboBox({ value, onChange, options, getKey, getLabel, getSubLabel, placeholder, noOptionsText = "No results", maxList = 200 }) {
  const [open, setOpen]       = useState(false);
  const [query, setQuery]     = useState("");
  const rootRef  = useRef(null);
  const inputRef = useRef(null);
  const listRef  = useRef(null);

  const filtered = useMemo(() => {
    const src = options;
    if (!query.trim()) return src.slice(0, maxList);
    const q = query.toLowerCase();
    return src
      .filter(o => getLabel(o).toLowerCase().includes(q) || (getSubLabel?.(o) || "").toLowerCase().includes(q))
      .slice(0, 80);
  }, [query, options, maxList, getLabel, getSubLabel]);

  const selected = options.find(o => getKey(o) === value);

  // Close on click-outside
  useEffect(() => {
    const fn = e => { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open) { setQuery(""); setTimeout(() => inputRef.current?.focus(), 30); }
  }, [open]);

  const pick = useCallback(key => { onChange(key); setOpen(false); }, [onChange]);

  return (
    <div ref={rootRef} className="relative">
      {/* Trigger */}
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm bg-white hover:border-gray-300 focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 transition-all text-left">
        {selected ? (
          <>
            <span className="text-lg leading-none flex-shrink-0">{selected.flag || ""}</span>
            <span className="flex-1 text-gray-900 truncate">{getLabel(selected)}</span>
            {getSubLabel && <span className="text-xs text-gray-400 flex-shrink-0">{getSubLabel(selected)}</span>}
          </>
        ) : (
          <span className="text-gray-400 flex-1">{placeholder}</span>
        )}
        <i className={`ti ti-chevron-down text-gray-400 text-sm transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="p-2 border-b border-gray-50">
            <div className="relative">
              <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
              <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Type to search…"
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-teal-400 transition-all"
              />
            </div>
          </div>
          <div ref={listRef} className="max-h-56 overflow-y-auto overscroll-contain">
            {filtered.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-5">{noOptionsText}</p>
            ) : (
              filtered.map(o => (
                <button key={getKey(o)} type="button" onClick={() => pick(getKey(o))}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors text-left ${
                    getKey(o) === value ? "bg-teal-50 text-teal-700" : "hover:bg-gray-50"
                  }`}>
                  {o.flag && <span className="text-base leading-none w-6 text-center flex-shrink-0">{o.flag}</span>}
                  <span className="flex-1 truncate">{getLabel(o)}</span>
                  {getSubLabel && <span className="text-xs text-gray-400 flex-shrink-0">{getSubLabel(o)}</span>}
                  {getKey(o) === value && <i className="ti ti-check text-teal-600 text-sm flex-shrink-0" />}
                </button>
              ))
            )}
          </div>
          {!query && options.length > maxList && (
            <p className="text-center text-[10px] text-gray-300 py-1.5 border-t border-gray-50">
              Showing {maxList} of {options.length} — type to search
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
const BLANK = { profilePicture:"", name:"", country:"", phoneCountryCode:"", phoneNumber:"", city:"", gender:"", bloodGroup:"", dateOfBirth:"" };

export default function ProfilePage() {
  const { user }    = useUser();
  const { signOut } = useClerk();
  const navigate    = useNavigate();
  const fileRef     = useRef(null);

  const [form, setForm]         = useState(BLANK);
  const [preview, setPreview]   = useState("");
  const [changed, setChanged]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [loading, setLoading]   = useState(true);

  // ── Static data from library ───────────────────────────────────────────
  const allCountries = useMemo(() => Country.getAllCountries(), []);

  const selectedCountry = useMemo(
    () => allCountries.find(c => c.isoCode === form.country) || null,
    [allCountries, form.country]
  );

  const cityOptions = useMemo(() => {
    if (!form.country) return [];
    return (City.getCitiesOfCountry(form.country) || []).map(c => ({
      ...c,
      key:  `${c.name}||${c.stateCode}`,
      flag: "",   // cities don't have flags
    }));
  }, [form.country]);

  // ── Load ───────────────────────────────────────────────────────────────
  useEffect(() => {
    api.get("/users/profile")
      .then(r => {
        const p = r.data.profile || {};
        setForm({
          profilePicture:   p.profilePicture   || "",
          name:             p.name             || user?.fullName || "",
          country:          p.country          || "",
          phoneCountryCode: p.phoneCountryCode || "",
          phoneNumber:      p.phoneNumber      || p.phone || "",
          city:             p.city             || "",
          gender:           p.gender           || "",
          bloodGroup:       p.bloodGroup       || "",
          dateOfBirth:      p.dateOfBirth ? new Date(p.dateOfBirth).toISOString().split("T")[0] : "",
        });
        setPreview(p.profilePicture || "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setChanged(true); };

  // ── Country change: sync phone code and clear city ─────────────────────
  const handleCountryChange = useCallback(isoCode => {
    const c = allCountries.find(x => x.isoCode === isoCode);
    setForm(f => ({
      ...f,
      country:          isoCode,
      phoneCountryCode: c ? `+${c.phonecode}` : "",
      city:             "",   // reset city when country changes
    }));
    setChanged(true);
  }, [allCountries]);

  // ── City selection: just store city name ──────────────────────────────
  const handleCityChange = useCallback(key => {
    const name = key.split("||")[0];
    setForm(f => ({ ...f, city: name }));
    setChanged(true);
  }, []);

  // city options keyed so ComboBox can find "selected" — match by name
  const cityValueKey = useMemo(() => {
    if (!form.city) return "";
    const match = cityOptions.find(c => c.name === form.city);
    return match ? match.key : "";
  }, [form.city, cityOptions]);

  // ── Image upload ──────────────────────────────────────────────────────
  const handleImageChange = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please select an image file");
    try {
      const b64 = await compressImage(file);
      if (b64.length > MAX_B64_BYTES) return toast.error("Image too large. Please use a smaller photo.");
      setPreview(b64);
      set("profilePicture", b64);
    } catch { toast.error("Could not process image"); }
    e.target.value = "";
  };

  // ── Submit ────────────────────────────────────────────────────────────
  const submit = async e => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Full name is required");
    setSaving(true);
    try {
      await api.put("/users/profile", form);
      setChanged(false);
      toast.success("Profile saved!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const age = form.dateOfBirth
    ? Math.floor((Date.now() - new Date(form.dateOfBirth)) / (365.25 * 86400000))
    : null;

  const displaySrc = preview || user?.imageUrl;

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* ── Header banner ── */}
      <div className="grad-hero rounded-3xl p-6 text-white shadow-xl overflow-hidden relative">
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
        <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />
        <div className="relative z-10 flex items-center gap-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {displaySrc ? (
              <img src={displaySrc} alt="Profile" className="w-20 h-20 rounded-2xl object-cover border-4 border-white/25 shadow-lg" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center border-4 border-white/25">
                <i className="ti ti-user text-3xl text-white/70" />
              </div>
            )}
            <button type="button" onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-xl bg-teal-400 hover:bg-teal-300 flex items-center justify-center shadow-md transition-colors">
              <i className="ti ti-camera text-white text-sm" />
            </button>
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-black text-xl lg:text-2xl tracking-tight truncate">
              {form.name || user?.fullName || "Your Profile"}
            </h1>
            <p className="text-white/65 text-sm truncate mt-0.5">{user?.primaryEmailAddress?.emailAddress}</p>
            <div className="flex gap-2 mt-2.5 flex-wrap">
              {form.bloodGroup && (
                <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <i className="bx bx-heart-circle text-sm" />{form.bloodGroup}
                </span>
              )}
              {selectedCountry && (
                <span className="bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <span className="text-sm leading-none">{selectedCountry.flag}</span>
                  {selectedCountry.name}
                </span>
              )}
              {form.city && (
                <span className="bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <i className="ti ti-map-pin text-xs" />{form.city}
                </span>
              )}
              {age !== null && age > 0 && age < 120 && (
                <span className="bg-white/20 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                  {age} yrs
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Account security ── */}
      <div className="card p-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <i className="ti ti-shield-check text-teal-500" /> Account Security
        </p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          {[
            { icon:"bx bxl-google",   label:"Google",   active: user?.externalAccounts?.some(a=>a.provider==="google"),   color:"text-red-500"  },
            { icon:"bx bxl-facebook", label:"Facebook", active: user?.externalAccounts?.some(a=>a.provider==="facebook"), color:"text-blue-600" },
          ].map(a => (
            <div key={a.label} className={`flex items-center gap-2.5 p-3 rounded-xl border ${a.active ? "border-teal-200 bg-teal-50" : "border-gray-100 bg-gray-50"}`}>
              <i className={`${a.icon} text-xl ${a.active ? a.color : "text-gray-300"}`} />
              <div>
                <div className="text-xs font-semibold text-gray-700">{a.label}</div>
                <div className={`text-[10px] ${a.active ? "text-teal-600" : "text-gray-400"}`}>{a.active ? "Connected" : "Not linked"}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-2">
          <i className="ti ti-lock text-blue-500 text-base flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700">
            Email: <strong>{user?.primaryEmailAddress?.emailAddress}</strong> — managed by Clerk.
          </p>
        </div>
      </div>

      {/* ── Profile form ── */}
      <div className="card p-5">
        <h2 className="text-sm font-bold text-gray-900 mb-5 flex items-center gap-2">
          <i className="ti ti-user-circle text-teal-500 text-lg" /> Health Profile
          {changed && (
            <span className="ml-auto text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
              Unsaved changes
            </span>
          )}
        </h2>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-7 h-7 border-2 border-teal-100 border-t-teal-400 rounded-full animate-spin" />
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">

            {/* Photo upload */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex-shrink-0">
                {displaySrc ? (
                  <img src={displaySrc} alt="" className="w-16 h-16 rounded-xl object-cover border-2 border-gray-200" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gray-200 flex items-center justify-center border-2 border-gray-200">
                    <i className="ti ti-user text-2xl text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800 mb-0.5">Profile Photo</p>
                <p className="text-xs text-gray-400 mb-2.5">JPG, PNG or WebP — auto-resized to 400px</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="text-xs font-semibold px-3 py-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-1">
                    <i className="ti ti-upload text-xs" />Upload
                  </button>
                  {preview && (
                    <button type="button" onClick={() => { setPreview(""); set("profilePicture", ""); }}
                      className="text-xs font-semibold px-3 py-1.5 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1">
                      <i className="ti ti-x text-xs" />Remove
                    </button>
                  )}
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                value={form.name}
                onChange={e => set("name", e.target.value)}
                placeholder="e.g. Muhammad Abdullah"
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 transition-all"
              />
            </div>

            {/* Country */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Country <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <ComboBox
                value={form.country}
                onChange={handleCountryChange}
                options={allCountries}
                getKey={c => c.isoCode}
                getLabel={c => c.name}
                getSubLabel={c => `+${c.phonecode}`}
                placeholder="Select country…"
                noOptionsText="No countries found"
                maxList={250}
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Phone Number <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="flex gap-2">
                {/* Dial code badge */}
                {selectedCountry ? (
                  <div className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 flex-shrink-0 select-none whitespace-nowrap">
                    <span className="text-base leading-none">{selectedCountry.flag}</span>
                    <span>+{selectedCountry.phonecode}</span>
                  </div>
                ) : (
                  <div className="flex items-center px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-400 flex-shrink-0 select-none">
                    <i className="ti ti-phone text-sm" />
                  </div>
                )}
                <input
                  type="tel"
                  value={form.phoneNumber}
                  onChange={e => set("phoneNumber", e.target.value)}
                  placeholder={selectedCountry ? "Local number" : "Select country first"}
                  className="flex-1 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 transition-all"
                />
              </div>
              {selectedCountry && form.phoneNumber && (
                <p className="text-[11px] text-gray-400 mt-1 pl-1">
                  Full number: {selectedCountry.flag} {form.phoneCountryCode} {form.phoneNumber}
                </p>
              )}
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                City <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              {form.country && cityOptions.length > 0 ? (
                <ComboBox
                  value={cityValueKey}
                  onChange={handleCityChange}
                  options={cityOptions}
                  getKey={c => c.key}
                  getLabel={c => c.name}
                  getSubLabel={c => c.stateCode || ""}
                  placeholder="Select city…"
                  noOptionsText="No cities found"
                  maxList={200}
                />
              ) : (
                <input
                  value={form.city}
                  onChange={e => set("city", e.target.value)}
                  placeholder={form.country ? "Enter city name" : "Select a country first"}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 transition-all"
                />
              )}
            </div>

            {/* Gender + Blood Group */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Gender <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <select value={form.gender} onChange={e => set("gender", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 transition-all bg-white">
                  <option value="">Select…</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  Blood Group <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <select value={form.bloodGroup} onChange={e => set("bloodGroup", e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 transition-all bg-white">
                  <option value="">Select…</option>
                  {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                Date of Birth <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input type="date" value={form.dateOfBirth}
                onChange={e => set("dateOfBirth", e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-100 transition-all"
              />
            </div>

            {/* Save */}
            <button type="submit" disabled={saving}
              className="w-full py-3 text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm">
              {saving
                ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving…</>
                : <><i className="bx bxs-save text-lg" />Save Profile</>}
            </button>
          </form>
        )}
      </div>

      {/* ── Health Card ── */}
      {!loading && (form.bloodGroup || form.city || form.dateOfBirth || selectedCountry) && (
        <div className="card p-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <i className="ti ti-id-badge text-teal-500" /> Health Card
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon:"bx bx-heart-circle",  label:"Blood Group", value: form.bloodGroup || "—",  color:"text-red-500",    bg:"bg-red-50"   },
              { icon:"ti ti-map-pin",        label:"City",        value: form.city || "—",        color:"text-teal-600",   bg:"bg-teal-50"  },
              { icon:"ti ti-calendar",       label:"Age",         value: age !== null && age > 0 && age < 120 ? `${age} yrs` : "—", color:"text-blue-500", bg:"bg-blue-50" },
              { icon:"ti ti-world",          label:"Country",     value: selectedCountry ? `${selectedCountry.flag} ${selectedCountry.isoCode}` : "—", color:"text-purple-500", bg:"bg-purple-50" },
            ].map((item, i) => (
              <div key={i} className="p-3 rounded-xl bg-gray-50 flex items-start gap-2.5">
                <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0`}>
                  <i className={`${item.icon} ${item.color} text-base`} />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] text-gray-400">{item.label}</div>
                  <div className="text-sm font-bold text-gray-800 truncate">{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Sign out ── */}
      <div className="card p-4 border border-red-100">
        <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
          <i className="ti ti-alert-circle text-red-400 text-base" /> Account Actions
        </h3>
        <button onClick={() => { signOut(); navigate("/auth"); }}
          className="w-full py-2.5 text-sm font-bold border-2 border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
          <i className="ti ti-logout text-base" /> Sign Out
        </button>
      </div>

    </div>
  );
}

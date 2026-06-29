import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import api from "../../lib/api";
import toast from "react-hot-toast";

const PAGES = [
  {
    key: "hospital",
    label: "Hospital Page",
    icon: "ti ti-building-hospital",
    color: "teal",
    defaults: {
      heroTitle:    "Find Hospitals Near You",
      heroSubtitle: "Government, Private & Welfare hospitals nationwide",
      buttonText:   "Nearby Hospitals",
    },
  },
  {
    key: "emergency",
    label: "Emergency Page",
    icon: "bx bxs-first-aid",
    color: "red",
    defaults: {
      heroTitle:    "Emergency Numbers",
      heroSubtitle: "Pakistan ke zaruri helpline numbers — ek tap mein call karein",
      buttonText:   "",
    },
  },
];

function isAdminUser(user) {
  const envIds = (process.env.REACT_APP_ADMIN_USER_IDS || "")
    .split(",").map(s => s.trim()).filter(Boolean);
  return envIds.includes(user?.id || "");
}

function HeroPreview({ page, form }) {
  const isHospital = page === "hospital";
  const bg = isHospital ? "grad-hero" : "grad-sos";

  return (
    <div className={`${bg} rounded-2xl p-5 text-white overflow-hidden relative`}>
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />
      <div className="relative z-10 flex items-center gap-3 mb-3">
        <span className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <i className={`${isHospital ? "ti ti-building-hospital" : "bx bxs-first-aid"} text-2xl text-white`} />
        </span>
        <div className="flex-1">
          <p className="text-[11px] font-semibold text-white/50 uppercase tracking-widest mb-0.5">
            {isHospital ? "Pakistan Hospital Directory" : "Emergency Services"}
          </p>
          <h3 className="font-display font-black text-lg leading-tight">
            {form.heroTitle || <span className="opacity-40 italic">Hero title…</span>}
          </h3>
        </div>
        {form.buttonText && (
          <span className="text-xs font-bold bg-white text-teal-700 px-3 py-1.5 rounded-lg shrink-0 opacity-80">
            {form.buttonText}
          </span>
        )}
      </div>
      <p className="text-sm text-white/60 leading-relaxed">
        {form.heroSubtitle || <span className="italic opacity-40">Hero subtitle…</span>}
      </p>
    </div>
  );
}

function PageSettingsForm({ config }) {
  const [form, setForm]     = useState({ heroTitle: "", heroSubtitle: "", buttonText: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    setLoading(true);
    api.get(`/settings/${config.key}`)
      .then(r => {
        const s = r.data.settings || {};
        setForm({
          heroTitle:    s.heroTitle    || config.defaults.heroTitle,
          heroSubtitle: s.heroSubtitle || config.defaults.heroSubtitle,
          buttonText:   s.buttonText   || config.defaults.buttonText,
        });
      })
      .catch(() => setForm({
        heroTitle:    config.defaults.heroTitle,
        heroSubtitle: config.defaults.heroSubtitle,
        buttonText:   config.defaults.buttonText,
      }))
      .finally(() => setLoading(false));
  }, [config.key, config.defaults]);

  const handleSave = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/settings/${config.key}`, form);
      toast.success(`${config.label} hero updated`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm({
      heroTitle:    config.defaults.heroTitle,
      heroSubtitle: config.defaults.heroSubtitle,
      buttonText:   config.defaults.buttonText,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-7 h-7 border-2 border-gray-100 border-t-teal-500 rounded-full animate-spin" />
      </div>
    );
  }

  const accentBorder = config.color === "red" ? "focus:border-red-400" : "focus:border-teal-400";

  return (
    <div className="space-y-6">
      {/* Live preview */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Live Preview</p>
        <HeroPreview page={config.key} form={form} />
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Hero Title */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Hero Title <span className="text-red-500">*</span>
          </label>
          <input
            value={form.heroTitle}
            onChange={e => set("heroTitle", e.target.value)}
            placeholder={config.defaults.heroTitle}
            className={`w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none ${accentBorder} transition-all`}
          />
        </div>

        {/* Hero Subtitle */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Hero Subtitle</label>
          <textarea
            value={form.heroSubtitle}
            onChange={e => set("heroSubtitle", e.target.value)}
            placeholder={config.defaults.heroSubtitle}
            rows={2}
            className={`w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none ${accentBorder} transition-all resize-none`}
          />
        </div>

        {/* Button Text */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            Button Text <span className="text-gray-400 font-normal">(leave empty to hide button)</span>
          </label>
          <input
            value={form.buttonText}
            onChange={e => set("buttonText", e.target.value)}
            placeholder={config.defaults.buttonText || "e.g. Get Started"}
            className={`w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none ${accentBorder} transition-all`}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1 border-t border-gray-100">
          <button
            type="button" onClick={handleReset}
            className="px-4 py-2.5 text-sm font-semibold border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-600"
          >
            Reset Defaults
          </button>
          <button
            type="submit" disabled={saving}
            className={`flex-1 py-2.5 text-sm font-bold text-white rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5 ${
              config.color === "red"
                ? "bg-red-600 hover:bg-red-700"
                : "btn-primary"
            }`}
          >
            {saving
              ? <><i className="ti ti-loader-2 animate-spin" />Saving…</>
              : <><i className="ti ti-device-floppy" />Save Changes</>
            }
          </button>
        </div>
      </form>
    </div>
  );
}

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const [activeTab, setActiveTab] = useState("hospital");

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-teal-100 border-t-teal-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdminUser(user)) return <Navigate to="/404" replace />;

  const activeConfig = PAGES.find(p => p.key === activeTab);

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
            <i className="ti ti-settings text-teal-600" />
          </span>
          Page Settings
        </h1>
        <p className="text-sm text-gray-400 mt-0.5 ml-10">Manage hero section content for public pages</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {PAGES.map(p => (
          <button
            key={p.key}
            onClick={() => setActiveTab(p.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === p.key
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <i className={`${p.icon} text-base`} />
            {p.label}
          </button>
        ))}
      </div>

      {/* Active form */}
      <div className="card p-5">
        <PageSettingsForm key={activeTab} config={activeConfig} />
      </div>
    </div>
  );
}

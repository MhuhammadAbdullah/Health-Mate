import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useUser, useClerk } from "@clerk/clerk-react";

function isAdminUser(user) {
  const envIds = (process.env.REACT_APP_ADMIN_USER_IDS || "")
    .split(",").map(s => s.trim()).filter(Boolean);
  return envIds.includes(user?.id || "");
}

const NAV = [
  { to:"/dashboard", icon:"ti ti-layout-dashboard", bIcon:"bx bxs-dashboard",   label:"Dashboard" },
  { to:"/reports",   icon:"ti ti-files",             bIcon:"bx bxs-file-doc",    label:"Reports"   },
  { to:"/vitals",    icon:"ti ti-heart-rate-monitor",bIcon:"bx bx-pulse",        label:"Vitals"    },
  { to:"/hospitals", icon:"ti ti-building-hospital", bIcon:"bx bxs-building",    label:"Hospitals" },
  { to:"/emergency", icon:"ti ti-urgent",            bIcon:"bx bxs-first-aid",   label:"Emergency", sos:true },
];

export default function Layout() {
  const { user }    = useUser();
  const { signOut } = useClerk();
  const navigate    = useNavigate();
  const location    = useLocation();

  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem("sb-collapsed") === "1"; } catch { return false; }
  });
  const [profileOpen, setProfileOpen] = useState(false);

  const isAdmin  = isAdminUser(user);
  const isActive = to => location.pathname === to || location.pathname.startsWith(to + "/");

  // Keep CSS variable synced so .main-content margin animates with sidebar
  useEffect(() => {
    document.documentElement.style.setProperty("--sidebar-w", collapsed ? "72px" : "260px");
    try { localStorage.setItem("sb-collapsed", collapsed ? "1" : "0"); } catch {}
  }, [collapsed]);

  // Close profile dropdown on route change
  useEffect(() => { setProfileOpen(false); }, [location.pathname]);

  const navCls = to => isActive(to) ? "nav-item-active" : "nav-item-inactive";

  // Tailwind classes for animated label/badge: slides + fades in/out with sidebar
  const labelCls  = `transition-all duration-300 overflow-hidden whitespace-nowrap ${collapsed ? "max-w-0 opacity-0 pl-0" : "max-w-[160px] opacity-100 pl-3"}`;
  const badgeCls  = `transition-all duration-300 overflow-hidden whitespace-nowrap ${collapsed ? "max-w-0 opacity-0 ml-0" : "max-w-[56px] opacity-100 ml-auto"}`;
  const headerCls = `transition-all duration-300 overflow-hidden ${collapsed ? "max-h-0 opacity-0 mb-0 py-0" : "max-h-8 opacity-100 mb-2"}`;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className={`desktop-sidebar fixed left-0 top-0 bottom-0 grad-teal flex flex-col z-40 shadow-xl overflow-x-hidden overflow-y-auto transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${collapsed ? "w-[72px]" : "w-[260px]"}`}>

        {/* Logo — icon stays, text slides+fades out */}
        <div className="flex-shrink-0 border-b border-white/10 px-3 py-4 flex items-center">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
            <i className="ti ti-shield-heart text-xl text-white" />
          </div>
          <div className={`transition-all duration-300 overflow-hidden whitespace-nowrap ${collapsed ? "max-w-0 opacity-0 pl-0" : "max-w-[180px] opacity-100 pl-3"}`}>
            <div className="font-display font-black text-xl text-white tracking-tight leading-tight">
              Health<span className="text-teal-100">Mate</span>
            </div>
            <div className="text-white/50 text-[10px]">Sehat ka Smart Dost</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-0.5 px-2">
          {/* Section: Menu */}
          <p className={`text-white/30 text-[10px] font-semibold uppercase tracking-widest px-2 ${headerCls}`}>
            Menu
          </p>
          {NAV.map(({ to, icon, label, sos }) => (
            <NavLink key={to} to={to} title={collapsed ? label : undefined} className={navCls(to)}>
              <i className={`${icon} text-[18px] flex-shrink-0`} />
              {/* Label fades+slides in */}
              <span className={`${labelCls} truncate`}>{label}</span>
              {/* SOS badge fades in */}
              {sos && (
                <span className={badgeCls}>
                  <span className="text-[9px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full sos-pulse block">SOS</span>
                </span>
              )}
            </NavLink>
          ))}

          {/* Section: Account */}
          <div className="pt-2 border-t border-white/10 mt-2 space-y-0.5">
            <p className={`text-white/30 text-[10px] font-semibold uppercase tracking-widest px-2 ${headerCls}`}>
              Account
            </p>
            <NavLink to="/profile" title={collapsed ? "Profile" : undefined} className={navCls("/profile")}>
              <i className="ti ti-user-circle text-[18px] flex-shrink-0" />
              <span className={`${labelCls} truncate`}>Profile</span>
            </NavLink>
          </div>

          {/* Section: Admin */}
          {isAdmin && (
            <div className="pt-2 border-t border-white/10 mt-2 space-y-0.5">
              <p className={`text-white/30 text-[10px] font-semibold uppercase tracking-widest px-2 ${headerCls}`}>
                Admin
              </p>
              {[
                { to:"/admin/hospitals", icon:"ti ti-building-hospital", label:"Manage Hospitals" },
                { to:"/admin/emergency", icon:"bx bxs-first-aid",        label:"Manage Emergency" },
                { to:"/admin/settings",  icon:"ti ti-settings",           label:"Page Settings"    },
              ].map(({ to, icon, label }) => (
                <NavLink key={to} to={to} title={collapsed ? label : undefined} className={navCls(to)}>
                  <i className={`${icon} text-[18px] flex-shrink-0`} />
                  <span className={`${labelCls} flex-1 truncate`}>{label}</span>
                  <span className={badgeCls}>
                    <span className="text-[9px] font-bold bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full block whitespace-nowrap">ADMIN</span>
                  </span>
                </NavLink>
              ))}
            </div>
          )}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex-shrink-0 flex items-center border-t border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-colors duration-200 px-3 py-3"
        >
          <i className={`ti ti-chevrons-left text-lg flex-shrink-0 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
          <span className={`transition-all duration-300 overflow-hidden whitespace-nowrap text-xs font-medium ${collapsed ? "max-w-0 opacity-0 pl-0" : "max-w-[120px] opacity-100 pl-2"}`}>
            Collapse
          </span>
        </button>

        {/* User card — text+button fades out, avatar stays */}
        <div className="flex-shrink-0 border-t border-white/10 p-3">
          <div className="flex items-center bg-white/10 rounded-xl px-2 py-2.5 overflow-hidden">
            <img src={user?.imageUrl} alt=""
              className="w-9 h-9 rounded-full object-cover flex-shrink-0 border-2 border-white/30" />
            <div className={`transition-all duration-300 overflow-hidden whitespace-nowrap flex-1 min-w-0 ${collapsed ? "max-w-0 opacity-0 pl-0" : "max-w-[130px] opacity-100 pl-2"}`}>
              <div className="text-white text-sm font-semibold truncate">{user?.fullName || "User"}</div>
              <div className="text-white/50 text-xs truncate">{user?.primaryEmailAddress?.emailAddress}</div>
            </div>
            <div className={`transition-all duration-300 overflow-hidden flex-shrink-0 ${collapsed ? "max-w-0 opacity-0" : "max-w-[36px] opacity-100 ml-1"}`}>
              <button onClick={() => { signOut(); navigate("/auth"); }}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                title="Sign out">
                <i className="ti ti-logout text-white/70 text-[16px]" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="main-content flex flex-col min-h-screen">

        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-4 lg:px-6 h-16">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-400 flex items-center justify-center">
                <i className="ti ti-shield-heart text-lg text-white" />
              </div>
              <span className="font-display font-black text-lg text-gray-900 tracking-tight">
                Health<span className="text-teal-400">Mate</span>
              </span>
            </div>
            {/* Desktop date */}
            <div className="hidden lg:block text-sm text-gray-400">
              {new Date().toLocaleDateString("en-PK", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <button onClick={() => navigate("/emergency")}
                className="btn-sos sos-pulse text-xs px-3 py-2 rounded-xl hidden sm:flex">
                <i className="ti ti-urgent text-[15px]" /> SOS
              </button>

              {/* Profile dropdown */}
              <div className="relative">
                <button onClick={() => setProfileOpen(o => !o)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 transition-all">
                  <img src={user?.imageUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-semibold text-gray-800 leading-tight">{user?.fullName?.split(" ")[0]}</div>
                  </div>
                  <i className={`ti ti-chevron-down text-gray-400 text-sm transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`} />
                </button>

                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-52 card shadow-xl border border-gray-100 animate-scale-in z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="text-sm font-semibold text-gray-900">{user?.fullName}</div>
                        <div className="text-xs text-gray-400 truncate">{user?.primaryEmailAddress?.emailAddress}</div>
                      </div>
                      <div className="py-1">
                        <button onClick={() => { navigate("/profile"); setProfileOpen(false); }}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-all">
                          <i className="ti ti-user text-[16px] text-gray-400" /> My Profile
                        </button>
                        {isAdmin && (
                          <>
                            <div className="border-t border-gray-100 my-1" />
                            {[
                              { to:"/admin/hospitals", icon:"ti ti-building-hospital", label:"Manage Hospitals" },
                              { to:"/admin/emergency", icon:"bx bxs-first-aid",        label:"Manage Emergency" },
                              { to:"/admin/settings",  icon:"ti ti-settings",           label:"Page Settings"    },
                            ].map(item => (
                              <button key={item.to} onClick={() => { navigate(item.to); setProfileOpen(false); }}
                                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-amber-700 hover:bg-amber-50 transition-all">
                                <i className={`${item.icon} text-[16px] text-amber-500`} />
                                {item.label}
                                <span className="ml-auto text-[9px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">ADMIN</span>
                              </button>
                            ))}
                          </>
                        )}
                        <div className="border-t border-gray-100 mt-1 pt-1">
                          <button onClick={() => { signOut(); navigate("/auth"); setProfileOpen(false); }}
                            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-all">
                            <i className="ti ti-logout text-[16px]" /> Sign Out
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 animate-fade-up">
          <Outlet />
        </main>
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      <nav className="mobile-bottom-nav fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-2xl z-40 flex">
        {NAV.map(({ to, bIcon, label, sos }) => {
          const active = isActive(to);
          return (
            <button key={to} onClick={() => navigate(to)}
              className={`bottom-nav-item ${active ? "text-teal-600" : "text-gray-400"}`}>
              <div className={`w-11 h-11 flex items-center justify-center rounded-2xl transition-all duration-200 relative ${active ? "bg-teal-50 scale-105" : ""}`}>
                <i className={`${bIcon} text-[22px] transition-colors duration-200 ${active ? "text-teal-600" : "text-gray-400"}`} />
                {sos && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full sos-pulse" />}
              </div>
              <span className={`text-[10px] font-semibold transition-colors duration-200 ${active ? "text-teal-600" : "text-gray-400"}`}>
                {label}
              </span>
            </button>
          );
        })}
      </nav>

    </div>
  );
}

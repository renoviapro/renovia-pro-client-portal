import { useState, useEffect, useMemo } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { api } from "../lib/api";

type User = { name?: string | null; email: string };

type ClientContext = {
  hasChantiers: boolean;
  hasMaintenance: boolean;
  hasDocuments: boolean;
};

const allLinks = [
  {
    to: "/dashboard", label: "Accueil", always: true,
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9,22 9,12 15,12 15,22" />
      </svg>
    ),
  },
  {
    to: "/chantiers", label: "Mes chantiers", requiresChantiers: true,
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
  },
  {
    to: "/documents", label: "Documents", always: true,
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14,2 14,8 20,8" />
        <line x1="8" y1="13" x2="16" y2="13" />
        <line x1="8" y1="17" x2="12" y2="17" />
      </svg>
    ),
  },
  {
    to: "/tickets", label: "Support SAV", requiresChantiers: true,
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    ),
  },
  {
    to: "/maintenance", label: "Maintenance", always: true,
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [clientContext, setClientContext] = useState<ClientContext>({
    hasChantiers: false,
    hasMaintenance: false,
    hasDocuments: false,
  });
  const [contextLoaded, setContextLoaded] = useState(false);

  useEffect(() => {
    api<User>("/api/v1/me").then(setUser).catch(() => null);
    
    Promise.all([
      api<{ documents: unknown[] }>("/api/v1/documents").catch(() => ({ documents: [] })),
      api<{ contracts: unknown[] }>("/api/v1/maintenance/contracts").catch(() => ({ contracts: [] })),
    ]).then(([docsRes, maintRes]) => {
      const docs = docsRes.documents || [];
      const contracts = maintRes.contracts || [];
      const hasChantierDocs = docs.some((d: any) => d.source !== "maintenance");
      
      setClientContext({
        hasChantiers: hasChantierDocs,
        hasMaintenance: contracts.length > 0,
        hasDocuments: docs.length > 0 || contracts.length > 0,
      });
      setContextLoaded(true);
    });
  }, []);

  const links = useMemo(() => {
    if (!contextLoaded) return allLinks.filter(l => l.always);
    
    return allLinks.filter(l => {
      if (l.always) return true;
      if (l.requiresChantiers && !clientContext.hasChantiers) return false;
      return true;
    });
  }, [clientContext, contextLoaded]);

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/login");
  };

  const currentPage = links.find(l => location.pathname.startsWith(l.to))?.label ?? "Espace client";
  const firstName = user?.name?.split(" ")[0] || "";

  return (
    <div className="min-h-screen flex bg-[#FAFAF8]">
      {/* Sidebar desktop - style sombre premium */}
      <aside className="hidden lg:flex w-72 flex-col sidebar-dark fixed inset-y-0 left-0 z-30">
        {/* Logo */}
        <div className="p-6 pb-8">
          <a href="/dashboard" className="flex items-center gap-3 no-underline group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FEBD17] to-[#E6AA00] flex items-center justify-center shadow-lg shadow-[#FEBD17]/20">
              <img src="/logo.png" alt="Renovia Pro" className="h-8 w-8 object-contain" />
            </div>
            <div>
              <p className="text-white text-lg font-bold leading-tight tracking-tight" style={{ fontFamily: "'Black Ops One', sans-serif" }}>RENOVIA</p>
              <p className="text-[#FEBD17] text-sm font-bold leading-tight" style={{ fontFamily: "'Black Ops One', sans-serif" }}>PRO</p>
            </div>
          </a>
        </div>

        {/* Welcome */}
        {user && (
          <div className="px-6 pb-6">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
              <p className="text-white/40 text-xs mb-1">Bienvenue</p>
              <p className="text-white font-semibold text-sm truncate">{user.name || user.email}</p>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-4 space-y-1">
          <p className="px-3 text-white/30 text-[10px] uppercase tracking-widest mb-3">Navigation</p>
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium no-underline transition-all duration-200 " +
                (isActive
                  ? "bg-[#FEBD17] text-black shadow-lg shadow-[#FEBD17]/25"
                  : "text-white/60 hover:text-white hover:bg-white/5")
              }
            >
              {l.icon}
              {l.label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 mt-auto">
          <div className="border-t border-white/5 pt-4">
            <a
              href="https://depannage.renoviapro.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-red-500/10 to-transparent border border-red-500/20 text-red-400 text-sm font-medium no-underline hover:border-red-500/40 transition-all mb-3"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.6a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.6a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              Urgence 24/7
            </a>
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/40 hover:text-white hover:bg-white/5 transition-all"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16,17 21,12 16,7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Déconnexion
            </button>
          </div>
        </div>
      </aside>

      {/* Header mobile */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 bg-white border-b border-gray-100 flex items-center justify-between px-4 h-16 shadow-sm">
        <a href="/dashboard" className="flex items-center gap-2 no-underline">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FEBD17] to-[#E6AA00] flex items-center justify-center">
            <img src="/logo.png" alt="Renovia Pro" className="h-7 w-7 object-contain" />
          </div>
          <span className="text-gray-900 text-sm font-bold" style={{ fontFamily: "'Black Ops One', sans-serif" }}>
            RENOVIA <span className="text-[#FEBD17]">PRO</span>
          </span>
        </a>
        <button onClick={() => setMenuOpen(!menuOpen)} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
          {menuOpen
            ? <svg width="22" height="22" fill="none" stroke="#374151" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            : <svg width="22" height="22" fill="none" stroke="#374151" strokeWidth="2" viewBox="0 0 24 24"><line x1="3" y1="7" x2="21" y2="7" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="17" x2="21" y2="17" /></svg>
          }
        </button>
      </div>

      {/* Menu mobile overlay */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm" onClick={() => setMenuOpen(false)}>
          <div 
            className="absolute top-16 inset-x-0 bg-white border-b border-gray-100 p-4 space-y-1 shadow-xl fade-in" 
            onClick={e => e.stopPropagation()}
          >
            {user && (
              <div className="px-3 py-3 mb-2 bg-gray-50 rounded-xl">
                <p className="text-gray-400 text-xs">Connecté en tant que</p>
                <p className="text-gray-900 font-medium text-sm truncate">{user.name || user.email}</p>
              </div>
            )}
            {links.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  "flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium no-underline transition-all " +
                  (isActive ? "bg-[#FEBD17] text-black" : "text-gray-600 hover:bg-gray-50")
                }
              >
                {l.icon}
                {l.label}
              </NavLink>
            ))}
            <div className="pt-2 mt-2 border-t border-gray-100">
              <a
                href="https://depannage.renoviapro.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-red-500 no-underline hover:bg-red-50"
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.6a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.6a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                Urgence 24/7
              </a>
              <button 
                onClick={logout} 
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16,17 21,12 16,7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contenu principal */}
      <main className="flex-1 lg:ml-72 pt-16 lg:pt-0 min-h-screen">
        {/* Header page desktop */}
        <div className="hidden lg:flex items-center justify-between px-10 py-6 border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-20">
          <div>
            <h1 className="text-gray-900 font-semibold text-xl">{currentPage}</h1>
            <p className="text-gray-400 text-sm mt-0.5">Espace client Renovia Pro</p>
          </div>
          <div className="flex items-center gap-4">
            {firstName && (
              <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FEBD17] to-[#E6AA00] flex items-center justify-center text-black text-sm font-bold shadow-sm">
                  {firstName.charAt(0).toUpperCase()}
                </div>
                <span className="text-gray-700 text-sm font-medium">{firstName}</span>
              </div>
            )}
          </div>
        </div>
        <div className="p-4 lg:p-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

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
    to: "/dashboard", label: "Tableau de bord", always: true,
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    to: "/chantiers", label: "Mes chantiers", requiresChantiers: true,
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M2 20h20M4 20V10l8-7 8 7v10" /><path d="M9 20v-6h6v6" />
      </svg>
    ),
  },
  {
    to: "/documents", label: "Documents", always: true,
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14,2 14,8 20,8" />
        <line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="16" y2="17" />
      </svg>
    ),
  },
  {
    to: "/tickets", label: "Tickets SAV", requiresChantiers: true,
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    to: "/maintenance", label: "Maintenance", always: true,
    icon: (
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
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

  return (
    <div className="min-h-screen flex bg-[#0a0a0a]">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-[#111111] border-r border-white/5 fixed inset-y-0 left-0 z-30">
        {/* Logo */}
        <div className="p-6 border-b border-white/5">
          <a href="/dashboard" className="flex items-center gap-3 no-underline">
            <img src="/logo.png" alt="Renovia Pro" className="h-10 w-10 object-contain" />
            <div>
              <p className="text-white text-sm font-bold leading-tight" style={{ fontFamily: "'Black Ops One', sans-serif" }}>RENOVIA</p>
              <p className="text-[#FEBD17] text-xs font-bold leading-tight" style={{ fontFamily: "'Black Ops One', sans-serif" }}>PRO</p>
            </div>
          </a>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium no-underline transition-all " +
                (isActive
                  ? "bg-[#FEBD17] text-black shadow-lg shadow-[#FEBD17]/20"
                  : "text-white/50 hover:text-white hover:bg-white/5")
              }
            >
              {l.icon}
              {l.label}
            </NavLink>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="p-4 border-t border-white/5">
          {user && (
            <div className="flex items-center gap-3 mb-3 px-2">
              <div className="w-8 h-8 rounded-full bg-[#FEBD17]/20 border border-[#FEBD17]/30 flex items-center justify-center text-[#FEBD17] text-xs font-bold">
                {(user.name || user.email).charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{user.name || "Mon compte"}</p>
                <p className="text-white/30 text-xs truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-white/40 hover:text-red-400 hover:bg-red-500/5 transition-all"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16,17 21,12 16,7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Header mobile */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-[#111111] border-b border-white/5 flex items-center justify-between px-4 h-14">
        <a href="/dashboard" className="flex items-center gap-2 no-underline">
          <img src="/logo.png" alt="Renovia Pro" className="h-8 w-8 object-contain" />
          <span className="text-white text-sm font-bold" style={{ fontFamily: "'Black Ops One', sans-serif" }}>RENOVIA <span className="text-[#FEBD17]">PRO</span></span>
        </a>
        <button onClick={() => setMenuOpen(!menuOpen)} className="text-white/60 p-1">
          {menuOpen
            ? <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            : <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="17" x2="21" y2="17"/></svg>
          }
        </button>
      </div>

      {/* Menu mobile overlay */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/80" onClick={() => setMenuOpen(false)}>
          <div className="absolute top-14 inset-x-0 bg-[#111111] border-b border-white/5 p-4 space-y-1" onClick={e => e.stopPropagation()}>
            {links.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium no-underline transition-all " +
                  (isActive ? "bg-[#FEBD17] text-black" : "text-white/70 hover:bg-white/5 hover:text-white")
                }
              >
                {l.icon}{l.label}
              </NavLink>
            ))}
            <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-red-400">
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Déconnexion
            </button>
          </div>
        </div>
      )}

      {/* Contenu principal */}
      <main className="flex-1 md:ml-64 pt-14 md:pt-0 min-h-screen">
        {/* Header page desktop */}
        <div className="hidden md:flex items-center justify-between px-8 py-5 border-b border-white/5 bg-[#0a0a0a]">
          <h1 className="text-white font-semibold text-lg">{currentPage}</h1>
          {user?.name && <p className="text-white/30 text-sm">Bonjour, {user.name.split(" ")[0]} 👋</p>}
        </div>
        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

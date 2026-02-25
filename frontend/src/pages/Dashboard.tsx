import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

type User = { name?: string | null; email: string };

type Stats = {
  chantiers: number;
  ticketsOuverts: number;
  documents: number;
  maintenance: number;
};

function StatCard({ 
  icon, 
  label, 
  value, 
  color = "gold",
  loading = false 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string | number;
  color?: "gold" | "blue" | "green" | "purple";
  loading?: boolean;
}) {
  const colors = {
    gold: "from-[#FEBD17]/10 to-[#FEBD17]/5 border-[#FEBD17]/20",
    blue: "from-blue-500/10 to-blue-500/5 border-blue-500/20",
    green: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20",
    purple: "from-purple-500/10 to-purple-500/5 border-purple-500/20",
  };
  const iconColors = {
    gold: "text-[#FEBD17]",
    blue: "text-blue-500",
    green: "text-emerald-500",
    purple: "text-purple-500",
  };

  return (
    <div className={`card p-6 bg-gradient-to-br ${colors[color]} border hover:scale-[1.02] transition-transform`}>
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-2xl bg-white/80 flex items-center justify-center shadow-sm ${iconColors[color]}`}>
          {icon}
        </div>
      </div>
      <div className="mt-4">
        {loading ? (
          <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
        ) : (
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        )}
        <p className="text-gray-500 text-sm mt-1">{label}</p>
      </div>
    </div>
  );
}

function QuickAction({ 
  to, 
  icon, 
  title, 
  description, 
  badge,
  highlight = false 
}: { 
  to: string; 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  badge?: string;
  highlight?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`card group relative p-6 no-underline transition-all duration-300 hover:scale-[1.01] ${
        highlight ? "card-gold border-[#FEBD17]/30 bg-gradient-to-br from-[#FEBD17]/5 to-transparent" : ""
      }`}
    >
      {badge && (
        <span className="absolute top-4 right-4 text-xs font-semibold bg-[#FEBD17] text-black px-2.5 py-1 rounded-full">
          {badge}
        </span>
      )}
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-all duration-300 ${
        highlight 
          ? "bg-gradient-to-br from-[#FEBD17] to-[#E6AA00] text-black shadow-lg shadow-[#FEBD17]/20" 
          : "bg-gray-100 text-gray-600 group-hover:bg-[#FEBD17] group-hover:text-black"
      }`}>
        {icon}
      </div>
      <h3 className="text-gray-900 font-semibold text-base mb-2">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
      <div className="mt-4 flex items-center text-[#FEBD17] text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
        <span>Accéder</span>
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="ml-1">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats>({ chantiers: 0, ticketsOuverts: 0, documents: 0, maintenance: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<User>("/api/v1/me").then(setUser).catch(() => null);
    
    Promise.all([
      api<{ items: unknown[] }>("/api/v1/documents").catch(() => ({ items: [] })),
      api<{ contracts: unknown[] }>("/api/v1/maintenance/contracts").catch(() => ({ contracts: [] })),
      api<{ tickets: { status: string }[] }>("/api/v1/tickets").catch(() => ({ tickets: [] })),
    ]).then(([docsRes, maintRes, ticketsRes]) => {
      const docs = docsRes.items || [];
      const contracts = maintRes.contracts || [];
      const tickets = ticketsRes.tickets || [];
      const openTickets = tickets.filter(t => t.status !== "closed" && t.status !== "resolved");
      
      setStats({
        chantiers: docs.filter((d: any) => d.source !== "maintenance").length > 0 ? 1 : 0,
        ticketsOuverts: openTickets.length,
        documents: docs.length,
        maintenance: contracts.length,
      });
      setLoading(false);
    });
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";
  const firstName = user?.name?.split(" ")[0] || "";

  return (
    <div className="space-y-8 fade-in">
      {/* Hero Welcome */}
      <div className="card overflow-hidden">
        <div className="relative bg-black p-8 lg:p-10">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#FEBD17]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#FEBD17]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
          </div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FEBD17] to-[#E6AA00] flex items-center justify-center text-black text-xl font-bold shadow-lg shadow-[#FEBD17]/30">
                {firstName ? firstName.charAt(0).toUpperCase() : "👋"}
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-white">
                  {greeting}{firstName ? `, ${firstName}` : ""} !
                </h1>
                <p className="text-white/60 text-sm mt-0.5">Bienvenue dans votre espace client</p>
              </div>
            </div>
            <p className="text-white/50 text-sm max-w-xl leading-relaxed">
              Consultez vos documents, suivez vos chantiers et gérez vos demandes de maintenance depuis cet espace dédié.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div>
        <h2 className="text-gray-900 text-lg mb-4" style={{ fontFamily: "'Black Ops One', cursive" }}>Vue d'ensemble</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14,2 14,8 20,8" /></svg>}
            label="Documents"
            value={stats.documents}
            color="blue"
            loading={loading}
          />
          <StatCard
            icon={<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>}
            label="Tickets ouverts"
            value={stats.ticketsOuverts}
            color="purple"
            loading={loading}
          />
          <StatCard
            icon={<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>}
            label="Contrats maintenance"
            value={stats.maintenance}
            color="green"
            loading={loading}
          />
          <StatCard
            icon={<svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>}
            label="Chantiers"
            value={stats.chantiers > 0 ? stats.chantiers : "—"}
            color="gold"
            loading={loading}
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-gray-900 text-lg mb-4" style={{ fontFamily: "'Black Ops One', cursive" }}>Actions rapides</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <QuickAction
            to="/tickets/new"
            highlight
            badge="24-48h"
            icon={
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                <line x1="12" y1="8" x2="12" y2="14" />
                <line x1="9" y1="11" x2="15" y2="11" />
              </svg>
            }
            title="Nouveau ticket SAV"
            description="Diagnostic 49€ — offert si prise en charge, déduit si devis accepté."
          />
          <QuickAction
            to="/documents"
            icon={
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14,2 14,8 20,8" />
                <line x1="8" y1="13" x2="16" y2="13" />
                <line x1="8" y1="17" x2="12" y2="17" />
              </svg>
            }
            title="Mes documents"
            description="Consultez et signez vos devis, factures et attestations."
          />
          <QuickAction
            to="/maintenance"
            icon={
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            }
            title="Maintenance"
            description="Gérez vos contrats et demandez une intervention."
          />
        </div>
      </div>

      {/* Emergency CTA */}
      <a
        href="https://depannage.renoviapro.fr"
        target="_blank"
        rel="noopener noreferrer"
        className="card flex items-center gap-5 p-6 no-underline hover:border-red-200 group transition-all bg-gradient-to-r from-red-50 to-transparent border-red-100"
      >
        <div className="w-14 h-14 rounded-2xl bg-red-500 flex items-center justify-center shrink-0 shadow-lg shadow-red-500/20 group-hover:scale-105 transition-transform">
          <svg width="24" height="24" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.6a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.6a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-gray-900 font-semibold text-base">Besoin d'une intervention urgente ?</p>
          <p className="text-gray-500 text-sm mt-1">Dépannage rapide 24/7 à Nice et alentours</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-red-500 font-semibold text-sm shrink-0">
          <span>depannage.renoviapro.fr</span>
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
          </svg>
        </div>
      </a>
    </div>
  );
}

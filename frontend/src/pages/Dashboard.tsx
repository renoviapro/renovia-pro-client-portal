import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

type User = { name?: string | null; email: string };

const cards = [
  {
    to: "/tickets/new",
    icon: (
      <svg width="24" height="24" fill="none" stroke="#FEBD17" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
    label: "Nouveau ticket SAV",
    desc: "Diagnostic 49€ — offert si prise en charge, déduit si devis accepté.",
    badge: "24–48h",
  },
  {
    to: "/chantiers",
    icon: (
      <svg width="24" height="24" fill="none" stroke="#FEBD17" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M2 20h20M4 20V10l8-7 8 7v10" /><path d="M9 20v-6h6v6" />
      </svg>
    ),
    label: "Mes chantiers",
    desc: "Suivez l'avancement de vos travaux.",
    badge: null,
  },
  {
    to: "/documents",
    icon: (
      <svg width="24" height="24" fill="none" stroke="#FEBD17" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14,2 14,8 20,8" />
        <line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="16" y2="17" />
      </svg>
    ),
    label: "Mes documents",
    desc: "Devis, factures et attestations.",
    badge: null,
  },
];

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="bg-[#161616] rounded-2xl border border-white/5 p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-[#FEBD17]/10 flex items-center justify-center">{icon}</div>
        {sub && <span className="text-xs text-[#FEBD17] bg-[#FEBD17]/10 px-2 py-0.5 rounded-full">{sub}</span>}
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-white/40 text-sm">{label}</p>
    </div>
  );
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    api<User>("/api/v1/me").then(setUser).catch(() => null);
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  return (
    <div className="space-y-8">
      {/* Accueil */}
      <div>
        <h2 className="text-2xl font-bold text-white">
          {greeting}{user?.name ? `, ${user.name.split(" ")[0]}` : ""} !
        </h2>
        <p className="text-white/40 text-sm mt-1">Votre espace client Renovia Pro</p>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<svg width="18" height="18" fill="none" stroke="#FEBD17" strokeWidth="2" viewBox="0 0 24 24"><path d="M2 20h20M4 20V10l8-7 8 7v10"/><path d="M9 20v-6h6v6"/></svg>}
          label="Chantiers"
          value="—"
        />
        <StatCard
          icon={<svg width="18" height="18" fill="none" stroke="#FEBD17" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
          label="Tickets ouverts"
          value="—"
        />
        <StatCard
          icon={<svg width="18" height="18" fill="none" stroke="#FEBD17" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>}
          label="Documents"
          value="—"
        />
        <StatCard
          icon={<svg width="18" height="18" fill="none" stroke="#FEBD17" strokeWidth="2" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>}
          label="Maintenance"
          value="—"
        />
      </div>

      {/* Actions rapides */}
      <div>
        <p className="text-white/40 text-xs uppercase tracking-widest mb-4">Actions rapides</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map(c => (
            <Link
              key={c.to}
              to={c.to}
              className="group relative bg-[#161616] hover:bg-[#1c1c1c] border border-white/5 hover:border-[#FEBD17]/30 rounded-2xl p-5 no-underline transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-xl bg-[#FEBD17]/10 group-hover:bg-[#FEBD17]/15 flex items-center justify-center mb-4 transition-colors">
                {c.icon}
              </div>
              <p className="text-white font-semibold text-sm mb-1">{c.label}</p>
              <p className="text-white/40 text-xs leading-relaxed">{c.desc}</p>
              {c.badge && (
                <span className="absolute top-4 right-4 text-xs bg-[#FEBD17]/10 text-[#FEBD17] px-2 py-0.5 rounded-full">
                  {c.badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Besoin de dépannage urgent */}
      <a
        href="https://depannage.renoviapro.fr"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-4 bg-gradient-to-r from-[#FEBD17]/10 to-transparent border border-[#FEBD17]/20 rounded-2xl p-5 no-underline hover:border-[#FEBD17]/40 transition-all group"
      >
        <div className="w-12 h-12 rounded-xl bg-[#FEBD17]/15 flex items-center justify-center shrink-0">
          <svg width="22" height="22" fill="none" stroke="#FEBD17" strokeWidth="1.8" viewBox="0 0 24 24">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.6a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.6a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm">Dépannage urgent ?</p>
          <p className="text-white/40 text-xs mt-0.5">Intervention rapide à Nice et alentours → depannage.renoviapro.fr</p>
        </div>
        <svg width="16" height="16" fill="none" stroke="#FEBD17" strokeWidth="2" viewBox="0 0 24 24" className="shrink-0 opacity-60 group-hover:opacity-100">
          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12,5 19,12 12,19"/>
        </svg>
      </a>
    </div>
  );
}

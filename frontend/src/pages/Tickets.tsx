import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

type Ticket = { id: string; subject: string; status: string; created_at: string };

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  ouvert: { label: "Ouvert", bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  "en cours": { label: "En cours", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  résolu: { label: "Résolu", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  fermé: { label: "Fermé", bg: "bg-gray-100", text: "text-gray-500", dot: "bg-gray-400" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status?.toLowerCase()] ?? { label: status, bg: "bg-gray-100", text: "text-gray-500", dot: "bg-gray-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export default function Tickets() {
  const [items, setItems] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ items: Ticket[] }>("/api/v1/tickets")
      .then(r => setItems(r.items))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 fade-in max-w-3xl">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support SAV</h1>
          <p className="text-gray-500 text-sm mt-1">Diagnostic 49€ — offert si prise en charge, déduit si devis accepté.</p>
        </div>
        <Link 
          to="/tickets/new" 
          className="btn-gold shrink-0 flex items-center gap-2"
          style={{ padding: "12px 24px", width: "auto" }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nouveau ticket
        </Link>
      </div>

      {/* Info banner */}
      <div className="card flex items-center gap-4 p-5 bg-gradient-to-r from-[#FEBD17]/10 to-transparent border-[#FEBD17]/20">
        <div className="w-10 h-10 rounded-xl bg-[#FEBD17]/20 flex items-center justify-center shrink-0">
          <svg width="18" height="18" fill="none" stroke="#D9A200" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <p className="text-gray-600 text-sm">
          Réponse sous <strong className="text-gray-900">24–48h ouvrées</strong>. Vous serez notifié par email.
        </p>
      </div>

      {/* Liste */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-xl animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/3 bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-1/4 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="card text-center py-16 px-6">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gray-100 flex items-center justify-center">
            <svg width="36" height="36" fill="none" stroke="#9CA3AF" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </div>
          <h3 className="text-gray-900 font-semibold text-lg mb-2">Aucun ticket</h3>
          <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
            Vous n'avez pas encore créé de demande de support.
          </p>
          <Link 
            to="/tickets/new" 
            className="inline-flex items-center gap-2 text-[#FEBD17] font-semibold text-sm hover:underline"
          >
            Créer votre premier ticket
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="space-y-4">
          {items.map(t => (
            <Link
              key={t.id}
              to={`/tickets/${t.id}`}
              className="card group flex items-center gap-4 p-5 no-underline hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-gray-100 group-hover:bg-[#FEBD17]/10 flex items-center justify-center shrink-0 transition-colors">
                <svg width="20" height="20" fill="none" stroke="#6B7280" strokeWidth="1.8" viewBox="0 0 24 24" className="group-hover:stroke-[#FEBD17] transition-colors">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-900 font-medium text-sm truncate group-hover:text-gray-700">{t.subject}</p>
                <p className="text-gray-400 text-xs mt-1">
                  {new Date(t.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <StatusBadge status={t.status} />
              <svg width="18" height="18" fill="none" stroke="#D1D5DB" strokeWidth="2" viewBox="0 0 24 24" className="shrink-0 group-hover:stroke-[#FEBD17] transition-colors">
                <polyline points="9,18 15,12 9,6" />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

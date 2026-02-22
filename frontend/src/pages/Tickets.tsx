import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

type Ticket = { id: string; subject: string; status: string; created_at: string };

const statusConfig: Record<string, { label: string; color: string }> = {
  ouvert: { label: "Ouvert", color: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
  "en cours": { label: "En cours", color: "bg-[#FEBD17]/15 text-[#FEBD17] border-[#FEBD17]/20" },
  résolu: { label: "Résolu", color: "bg-green-500/15 text-green-400 border-green-500/20" },
  fermé: { label: "Fermé", color: "bg-white/5 text-white/40 border-white/10" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status?.toLowerCase()] ?? { label: status, color: "bg-white/5 text-white/40 border-white/10" };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.color}`}>{cfg.label}</span>
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
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Tickets SAV</h2>
          <p className="text-white/40 text-sm mt-1">Diagnostic 49€ — offert si prise en charge, déduit si devis accepté.</p>
        </div>
        <Link to="/tickets/new" className="btn-gold shrink-0" style={{ padding: "10px 20px", fontSize: "14px", width: "auto" }}>
          + Nouveau
        </Link>
      </div>

      {/* Info banner */}
      <div className="flex items-center gap-3 bg-[#FEBD17]/5 border border-[#FEBD17]/15 rounded-xl p-4">
        <svg width="18" height="18" fill="none" stroke="#FEBD17" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p className="text-white/60 text-sm">Réponse sous <strong className="text-white">24–48h ouvrées</strong>. Vous serez notifié par email.</p>
      </div>

      {/* Liste */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white/3 rounded-2xl animate-pulse" />)}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="text-center py-16 bg-[#161616] rounded-2xl border border-white/5">
          <svg width="40" height="40" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" viewBox="0 0 24 24" className="mx-auto mb-3">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <p className="text-white/30 text-sm">Aucun ticket pour l'instant</p>
          <Link to="/tickets/new" className="inline-block mt-4 text-[#FEBD17] text-sm hover:underline">Créer votre premier ticket →</Link>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="space-y-3">
          {items.map(t => (
            <Link
              key={t.id}
              to={`/tickets/${t.id}`}
              className="group flex items-center gap-4 bg-[#161616] hover:bg-[#1c1c1c] border border-white/5 hover:border-[#FEBD17]/20 rounded-2xl p-4 no-underline transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                <svg width="18" height="18" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">{t.subject}</p>
                <p className="text-white/30 text-xs mt-0.5">{t.created_at?.slice(0, 10)}</p>
              </div>
              <StatusBadge status={t.status} />
              <svg width="16" height="16" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" viewBox="0 0 24 24" className="shrink-0 group-hover:stroke-[#FEBD17] transition-colors">
                <polyline points="9,18 15,12 9,6"/>
              </svg>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

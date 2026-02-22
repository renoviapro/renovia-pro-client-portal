import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

type Chantier = { id: string; label: string; status: string; address: string };

const statusColor: Record<string, string> = {
  "en cours": "bg-[#FEBD17]/15 text-[#FEBD17] border-[#FEBD17]/20",
  terminé: "bg-green-500/15 text-green-400 border-green-500/20",
  planifié: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  suspendu: "bg-red-500/15 text-red-400 border-red-500/20",
};

export default function Chantiers() {
  const [items, setItems] = useState<Chantier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ items: Chantier[] }>("/api/v1/chantiers")
      .then(r => setItems(r.items))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Mes chantiers</h2>
        <p className="text-white/40 text-sm mt-1">Suivez l'avancement de vos travaux Renovia Pro.</p>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white/3 rounded-2xl animate-pulse" />)}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="text-center py-16 bg-[#161616] rounded-2xl border border-white/5">
          <svg width="40" height="40" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" viewBox="0 0 24 24" className="mx-auto mb-3">
            <path d="M2 20h20M4 20V10l8-7 8 7v10"/><path d="M9 20v-6h6v6"/>
          </svg>
          <p className="text-white/30 text-sm">Aucun chantier pour l'instant</p>
          <p className="text-white/20 text-xs mt-2">Vos chantiers apparaîtront ici une fois créés par notre équipe.</p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="space-y-3">
          {items.map(c => {
            const color = statusColor[c.status?.toLowerCase()] ?? "bg-white/5 text-white/40 border-white/10";
            return (
              <Link
                key={c.id}
                to={`/chantiers/${c.id}`}
                className="group flex items-center gap-4 bg-[#161616] hover:bg-[#1c1c1c] border border-white/5 hover:border-[#FEBD17]/20 rounded-2xl p-4 no-underline transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                  <svg width="18" height="18" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path d="M2 20h20M4 20V10l8-7 8 7v10"/><path d="M9 20v-6h6v6"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">{c.label}</p>
                  <p className="text-white/30 text-xs mt-0.5 truncate">{c.address}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ${color}`}>
                  {c.status}
                </span>
                <svg width="16" height="16" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" viewBox="0 0 24 24" className="shrink-0 group-hover:stroke-[#FEBD17] transition-colors">
                  <polyline points="9,18 15,12 9,6"/>
                </svg>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

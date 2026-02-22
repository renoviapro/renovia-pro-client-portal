import { useEffect, useState } from "react";
import { api } from "../lib/api";

type Doc = { id: string; type: string; label: string; date: string; url?: string };

const typeConfig: Record<string, { icon: string; color: string }> = {
  devis: { icon: "📋", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  facture: { icon: "🧾", color: "bg-green-500/10 text-green-400 border-green-500/20" },
  attestation: { icon: "📄", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
};

export default function Documents() {
  const [items, setItems] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ items: Doc[] }>("/api/v1/documents")
      .then(r => setItems(r.items))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Documents</h2>
        <p className="text-white/40 text-sm mt-1">Vos devis, factures et attestations téléchargeables.</p>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white/3 rounded-2xl animate-pulse" />)}
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="text-center py-16 bg-[#161616] rounded-2xl border border-white/5">
          <svg width="40" height="40" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" viewBox="0 0 24 24" className="mx-auto mb-3">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/>
          </svg>
          <p className="text-white/30 text-sm">Aucun document disponible</p>
          <p className="text-white/20 text-xs mt-2">Vos devis et factures apparaîtront ici.</p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="space-y-3">
          {items.map(d => {
            const cfg = typeConfig[d.type?.toLowerCase()] ?? { icon: "📄", color: "bg-white/5 text-white/40 border-white/10" };
            return (
              <div
                key={d.id}
                className="flex items-center gap-4 bg-[#161616] border border-white/5 rounded-2xl p-4"
              >
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-lg shrink-0">
                  {cfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">{d.label}</p>
                  <p className="text-white/30 text-xs mt-0.5">{d.date}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ${cfg.color}`}>
                  {d.type}
                </span>
                {d.url ? (
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl bg-[#FEBD17]/10 hover:bg-[#FEBD17]/20 flex items-center justify-center transition-colors shrink-0"
                  >
                    <svg width="16" height="16" fill="none" stroke="#FEBD17" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                  </a>
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-white/3 flex items-center justify-center shrink-0">
                    <svg width="16" height="16" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

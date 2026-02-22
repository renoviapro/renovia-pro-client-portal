import { useEffect, useState } from "react";
import { api } from "../lib/api";

type Facture = { label: string; date: string; amount?: string };
type Contract = { plan: string; next_renewal: string; factures?: Facture[] };

export default function Maintenance() {
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ contract: Contract }>("/api/v1/maintenance")
      .then(r => setContract(r.contract))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-white">Maintenance</h2>
        <p className="text-white/40 text-sm mt-1">Contrat actif, échéances et historique des factures.</p>
      </div>

      {loading && <div className="h-40 bg-white/3 rounded-2xl animate-pulse" />}

      {!loading && !contract && (
        <>
          <div className="text-center py-12 bg-[#161616] rounded-2xl border border-white/5">
            <svg width="40" height="40" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" viewBox="0 0 24 24" className="mx-auto mb-3">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
            <p className="text-white/30 text-sm">Aucun contrat de maintenance actif</p>
          </div>
          <a
            href="https://renoviapro.fr/maintenance"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 bg-gradient-to-r from-[#FEBD17]/10 to-transparent border border-[#FEBD17]/20 rounded-2xl p-5 no-underline hover:border-[#FEBD17]/40 transition-all group"
          >
            <div className="w-12 h-12 rounded-xl bg-[#FEBD17]/15 flex items-center justify-center shrink-0">
              <svg width="22" height="22" fill="none" stroke="#FEBD17" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm">Découvrir nos packs maintenance</p>
              <p className="text-white/40 text-xs mt-0.5">Entretien régulier, priorité d'intervention → renoviapro.fr</p>
            </div>
            <svg width="16" height="16" fill="none" stroke="#FEBD17" strokeWidth="2" viewBox="0 0 24 24" className="shrink-0 opacity-60">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12,5 19,12 12,19"/>
            </svg>
          </a>
        </>
      )}

      {!loading && contract && (
        <>
          {/* Carte contrat */}
          <div className="bg-gradient-to-br from-[#FEBD17]/10 to-[#161616] border border-[#FEBD17]/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#FEBD17]/20 flex items-center justify-center">
                <svg width="18" height="18" fill="none" stroke="#FEBD17" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                </svg>
              </div>
              <div>
                <p className="text-white font-bold">{contract.plan}</p>
                <span className="text-xs bg-green-500/15 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full">Actif</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Prochaine échéance : <strong className="text-white">{contract.next_renewal}</strong>
            </div>
          </div>

          {/* Factures */}
          {contract.factures && contract.factures.length > 0 && (
            <div>
              <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Historique</p>
              <div className="space-y-2">
                {contract.factures.map((f, i) => (
                  <div key={i} className="flex items-center justify-between bg-[#161616] border border-white/5 rounded-xl px-4 py-3">
                    <span className="text-white/70 text-sm">{f.label}</span>
                    <div className="flex items-center gap-3">
                      {f.amount && <span className="text-[#FEBD17] text-sm font-medium">{f.amount}</span>}
                      <span className="text-white/30 text-xs">{f.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { api } from "../lib/api";

type Contract = { plan: string; next_renewal: string; factures?: { label: string; date: string; amount?: string }[] };

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
        <p className="text-white/40 text-sm mt-1">Contrat actif, échéances et historique.</p>
      </div>

      {loading && <div className="h-40 bg-white/3 rounded-2xl animate-pulse" />}

      {/* Contrat actif */}
      {!loading && contract && (
        <>
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
            <p className="text-white/60 text-sm">Prochaine échéance : <strong className="text-white">{contract.next_renewal}</strong></p>
          </div>
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

      {/* Aucun contrat */}
      {!loading && !contract && (
        <div className="text-center py-12 bg-[#161616] rounded-2xl border border-white/5 space-y-5">
          <svg width="40" height="40" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" viewBox="0 0 24 24" className="mx-auto">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
          <div>
            <p className="text-white/60 text-sm font-medium">Aucun contrat de maintenance actif</p>
            <p className="text-white/30 text-xs mt-1">Souscrivez depuis notre site pour bénéficier de nos contrats Tranquille.</p>
          </div>
          <a
            href="https://renoviapro.fr/maintenance"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-2.5 rounded-xl bg-[#FEBD17] text-black font-bold text-sm hover:bg-[#ffd04d] transition-colors"
          >
            Découvrir les offres
          </a>
        </div>
      )}
    </div>
  );
}

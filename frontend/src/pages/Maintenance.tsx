import { useEffect, useState } from "react";
import { api, apiUrl } from "../lib/api";

type Invoice = {
  id: string;
  amount: number;
  status: string;
  due_date: string;
  paid_at?: string;
  pay_url?: string;
};

type Contract = {
  id: string;
  contract_number: string;
  pack: string;
  pack_label: string;
  billing_cycle: string;
  price: number;
  status: string;
  next_billing_date: string;
  start_date: string;
  invoices: Invoice[];
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  ACTIVE:            { label: "Actif",          color: "bg-green-500/15 text-green-400 border border-green-500/20" },
  PENDING_SIGNATURE: { label: "En attente de signature", color: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20" },
  SUSPENDED:         { label: "Suspendu",        color: "bg-red-500/15 text-red-400 border border-red-500/20" },
  CANCELLED:         { label: "Résilié",         color: "bg-zinc-500/15 text-zinc-400 border border-zinc-500/20" },
};

const INV_STATUS: Record<string, { label: string; color: string }> = {
  PAID:   { label: "Payée",    color: "text-green-400" },
  UNPAID: { label: "En attente", color: "text-yellow-400" },
};

const PACKS = [
  { id: "tranquille", label: "Tranquille", price: 29 },
  { id: "tranquille_plus", label: "Tranquille +", price: 49 },
];

function fmt(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR");
}

export default function Maintenance() {
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [selectedPack, setSelectedPack] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    api<{ contract: Contract }>("/api/v1/maintenance")
      .then(r => setContract(r.contract))
      .finally(() => setLoading(false));
  }, []);

  const cycle = contract?.billing_cycle === "annual" ? "an" : "mois";

  const handleDownloadContract = () => {
    window.open(apiUrl("/api/v1/maintenance/contract-pdf"), "_blank");
  };

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      const res = await api<{ ok: boolean; message: string }>("/api/v1/maintenance/cancel", {
        method: "POST",
        body: JSON.stringify({ reason: cancelReason }),
      });
      setActionMessage({ ok: true, text: res.message });
      setShowCancelModal(false);
    } catch (e: unknown) {
      setActionMessage({ ok: false, text: (e as Error).message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpgrade = async () => {
    if (!selectedPack) return;
    setActionLoading(true);
    try {
      const res = await api<{ ok: boolean; message: string }>("/api/v1/maintenance/upgrade", {
        method: "POST",
        body: JSON.stringify({ new_pack: selectedPack }),
      });
      setActionMessage({ ok: true, text: res.message });
      setShowUpgradeModal(false);
    } catch (e: unknown) {
      setActionMessage({ ok: false, text: (e as Error).message });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-white">Maintenance</h2>
        <p className="text-white/40 text-sm mt-1">Votre contrat actif, échéances et historique.</p>
      </div>

      {loading && <div className="h-40 bg-white/3 rounded-2xl animate-pulse" />}

      {/* Contrat actif */}
      {!loading && contract && (
        <div className="space-y-4">
          {/* Carte contrat */}
          <div className="bg-gradient-to-br from-[#FEBD17]/10 to-[#161616] border border-[#FEBD17]/20 rounded-2xl p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FEBD17]/20 flex items-center justify-center shrink-0">
                  <svg width="18" height="18" fill="none" stroke="#FEBD17" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-white font-bold text-lg">{contract.pack_label}</p>
                  <p className="text-white/40 text-xs">{contract.contract_number}</p>
                </div>
              </div>
              {STATUS_LABEL[contract.status] && (
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold shrink-0 ${STATUS_LABEL[contract.status].color}`}>
                  {STATUS_LABEL[contract.status].label}
                </span>
              )}
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-white/40 text-[10px] uppercase tracking-wider">Montant</p>
                <p className="text-white font-bold text-lg mt-0.5">{contract.price}€<span className="text-white/40 text-xs font-normal">/{cycle}</span></p>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-white/40 text-[10px] uppercase tracking-wider">Début</p>
                <p className="text-white font-semibold text-sm mt-0.5">{fmt(contract.start_date)}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-white/40 text-[10px] uppercase tracking-wider">Prochain paiement</p>
                <p className="text-white font-semibold text-sm mt-0.5">{fmt(contract.next_billing_date)}</p>
              </div>
            </div>

            {contract.status === "PENDING_SIGNATURE" && (
              <div className="mt-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3">
                <p className="text-yellow-400 text-sm">
                  Votre contrat est en attente de signature. Vous avez reçu le PDF par email — veuillez le signer et nous le retourner.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                onClick={handleDownloadContract}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 text-sm font-medium hover:bg-white/10 transition-colors"
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                </svg>
                Télécharger le contrat
              </button>
              
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FEBD17]/10 border border-[#FEBD17]/30 text-[#FEBD17] text-sm font-medium hover:bg-[#FEBD17]/20 transition-colors"
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 19V5M5 12l7-7 7 7"/>
                </svg>
                Changer d'abonnement
              </button>

              <button
                onClick={() => setShowCancelModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors"
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>
                </svg>
                Résilier
              </button>
            </div>
          </div>

          {/* Factures */}
          {contract.invoices && contract.invoices.length > 0 && (
            <div>
              <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Historique des paiements</p>
              <div className="space-y-2">
                {contract.invoices.map((inv) => {
                  const s = INV_STATUS[inv.status] || { label: inv.status, color: "text-white/40" };
                  return (
                    <div key={inv.id} className="flex items-center justify-between bg-[#161616] border border-white/5 rounded-xl px-4 py-3">
                      <div>
                        <p className={`text-sm font-medium ${s.color}`}>{s.label}</p>
                        <p className="text-white/30 text-xs mt-0.5">
                          {inv.status === "PAID" ? `Payée le ${fmt(inv.paid_at)}` : `Échéance : ${fmt(inv.due_date)}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[#FEBD17] font-semibold">{Number(inv.amount).toFixed(2)}€</span>
                        {inv.status === "UNPAID" && inv.pay_url && (
                          <a
                            href={inv.pay_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold hover:bg-green-500/20 transition-colors no-underline"
                          >
                            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                            </svg>
                            Payer
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Message de confirmation */}
          {actionMessage && (
            <div className={`p-4 rounded-xl border ${actionMessage.ok ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
              <p className="text-sm">{actionMessage.text}</p>
            </div>
          )}

          {/* Contact */}
          <p className="text-white/20 text-xs text-center pt-2">
            Une question ? Contactez-nous :{" "}
            <a href="mailto:contact@renoviapro.fr" className="text-white/40 hover:text-white/60">contact@renoviapro.fr</a>
          </p>
        </div>
      )}

      {/* Modal Résiliation */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-white mb-4">Demande de résiliation</h3>
            <p className="text-white/60 text-sm mb-4">
              Êtes-vous sûr de vouloir résilier votre contrat ? Cette action enverra une demande à notre équipe.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Raison de la résiliation (optionnel)"
              className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 resize-none"
              rows={3}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-medium hover:bg-white/10"
              >
                Annuler
              </button>
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-bold hover:bg-red-500/30 disabled:opacity-50"
              >
                {actionLoading ? "Envoi..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Changement d'abonnement */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-white mb-4">Changer d'abonnement</h3>
            <p className="text-white/60 text-sm mb-4">
              Sélectionnez votre nouveau pack. Un conseiller vous contactera pour finaliser le changement.
            </p>
            <div className="space-y-2 mb-4">
              {PACKS.filter(p => p.id !== contract?.pack).map(pack => (
                <button
                  key={pack.id}
                  onClick={() => setSelectedPack(pack.id)}
                  className={`w-full p-4 rounded-xl border text-left transition-colors ${
                    selectedPack === pack.id
                      ? "bg-[#FEBD17]/10 border-[#FEBD17]/40"
                      : "bg-white/5 border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-white font-semibold">{pack.label}</span>
                    <span className="text-[#FEBD17] font-bold">{pack.price}€/mois</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-medium hover:bg-white/10"
              >
                Annuler
              </button>
              <button
                onClick={handleUpgrade}
                disabled={!selectedPack || actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-[#FEBD17]/20 border border-[#FEBD17]/30 text-[#FEBD17] text-sm font-bold hover:bg-[#FEBD17]/30 disabled:opacity-50"
              >
                {actionLoading ? "Envoi..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
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

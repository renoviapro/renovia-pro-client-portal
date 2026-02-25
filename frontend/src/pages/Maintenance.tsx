import { useEffect, useState } from "react";
import { api } from "../lib/api";

type Invoice = {
  id: string;
  reference: string;
  amount: number;
  status: string;
  due_date: string;
  created_at: string;
  payment_url?: string;
};

type Contract = {
  id: string;
  contract_number: string;
  plan: string;
  pack: string;
  billing_cycle: string;
  price: number;
  status: string;
  next_renewal: string;
  start_date: string;
  property_address: string;
  property_label: string;
  sign_url?: string | null;
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
  PENDING: { label: "En attente", color: "text-yellow-400" },
  TRANSFER_PENDING: { label: "En attente", color: "text-yellow-400" },
};

const PACKS = [
  { id: "tranquille", label: "Tranquille", price: 19, priceAnnual: 205 },
  { id: "tranquille_plus", label: "Tranquille+", price: 29, priceAnnual: 313 },
];

function fmt(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR");
}

export default function Maintenance() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const [newContract, setNewContract] = useState({
    pack: "tranquille_plus",
    billing_cycle: "monthly",
    property_address: "",
    property_postal_code: "",
    property_city: "",
    property_label: "",
  });

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    setLoading(true);
    try {
      const r = await api<{ contracts: Contract[] }>("/api/v1/maintenance/contracts");
      setContracts(r.contracts || []);
      if (r.contracts?.length === 1) {
        setExpandedId(r.contracts[0].id);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadContract = async (contractId: string, contractNumber: string) => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`/api/v1/maintenance/contract-pdf/${contractId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erreur téléchargement");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `contrat-maintenance-${contractNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setActionMessage({ ok: false, text: "Impossible de télécharger le contrat" });
    }
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`/api/v1/maintenance/invoice-pdf/${invoiceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erreur téléchargement");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `facture-maintenance-${invoiceId.slice(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setActionMessage({ ok: false, text: "Impossible de télécharger la facture" });
    }
  };

  const handleCancel = async (contractId: string) => {
    setActionLoading(true);
    try {
      const res = await api<{ ok: boolean; message: string }>(`/api/v1/maintenance/cancel/${contractId}`, {
        method: "POST",
        body: JSON.stringify({ reason: cancelReason }),
      });
      setActionMessage({ ok: true, text: res.message });
      setShowCancelModal(null);
      setCancelReason("");
      loadContracts();
    } catch (e: unknown) {
      setActionMessage({ ok: false, text: (e as Error).message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpgrade = async (contractId: string, newPack: string) => {
    setActionLoading(true);
    try {
      const res = await api<{ ok: boolean; message: string }>(`/api/v1/maintenance/upgrade/${contractId}`, {
        method: "POST",
        body: JSON.stringify({ new_pack: newPack }),
      });
      setActionMessage({ ok: true, text: res.message });
      setShowUpgradeModal(null);
      loadContracts();
    } catch (e: unknown) {
      setActionMessage({ ok: false, text: (e as Error).message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddContract = async () => {
    if (!newContract.property_address || !newContract.property_postal_code || !newContract.property_city) {
      setActionMessage({ ok: false, text: "Veuillez remplir tous les champs obligatoires" });
      return;
    }
    setActionLoading(true);
    try {
      const res = await api<{ ok: boolean; contract?: Contract }>("/api/v1/maintenance/contracts", {
        method: "POST",
        body: JSON.stringify(newContract),
      });
      if (res.ok) {
        setActionMessage({ ok: true, text: "Contrat créé ! Vérifiez votre email pour le signer." });
        setShowAddModal(false);
        setNewContract({
          pack: "tranquille_plus",
          billing_cycle: "monthly",
          property_address: "",
          property_postal_code: "",
          property_city: "",
          property_label: "",
        });
        loadContracts();
      }
    } catch (e: unknown) {
      const msg = (e as Error).message;
      if (msg.includes("déjà") || msg.includes("existe")) {
        setActionMessage({ ok: false, text: "Un contrat existe déjà pour cette adresse" });
      } else if (msg.includes("patienter")) {
        setActionMessage({ ok: false, text: msg });
      } else {
        setActionMessage({ ok: false, text: "Erreur lors de la création" });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const activeContracts = contracts.filter(c => c.status === "ACTIVE" || c.status === "PENDING_SIGNATURE");
  const archivedContracts = contracts.filter(c => c.status !== "ACTIVE" && c.status !== "PENDING_SIGNATURE");

  const ContractCard = ({ contract }: { contract: Contract }) => {
    const isExpanded = expandedId === contract.id;
    const cycle = contract.billing_cycle === "annual" ? "an" : "mois";
    const s = STATUS_LABEL[contract.status] || { label: contract.status, color: "bg-white/10 text-white/60" };

    return (
      <div className={`bg-[#161616] border rounded-2xl overflow-hidden transition-all ${
        isExpanded ? "border-[#FEBD17]/30" : "border-white/5 hover:border-white/10"
      }`}>
        <button
          onClick={() => setExpandedId(isExpanded ? null : contract.id)}
          className="w-full p-4 flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FEBD17]/10 flex items-center justify-center shrink-0">
              <svg width="16" height="16" fill="none" stroke="#FEBD17" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold truncate">
                {contract.property_label || contract.property_address || "Bien"}
              </p>
              <p className="text-white/40 text-xs truncate">
                {contract.property_label ? contract.property_address : contract.plan}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.color}`}>{s.label}</span>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
              className={`text-white/40 transition-transform ${isExpanded ? "rotate-180" : ""}`}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </button>

        {isExpanded && (
          <div className="px-4 pb-4 space-y-4">
            <div className="h-px bg-white/5" />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-white/40 text-[10px] uppercase tracking-wider">Pack</p>
                <p className="text-white font-semibold text-sm mt-0.5">{contract.plan}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-white/40 text-[10px] uppercase tracking-wider">Montant</p>
                <p className="text-[#FEBD17] font-bold text-sm mt-0.5">{contract.price}€/{cycle}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-white/40 text-[10px] uppercase tracking-wider">Début</p>
                <p className="text-white font-semibold text-sm mt-0.5">{fmt(contract.start_date)}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-white/40 text-[10px] uppercase tracking-wider">Prochain paiement</p>
                <p className="text-white font-semibold text-sm mt-0.5">{fmt(contract.next_renewal)}</p>
              </div>
            </div>

            {contract.status === "PENDING_SIGNATURE" && contract.sign_url && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                <p className="text-yellow-400 text-sm mb-3">Votre contrat est en attente de signature.</p>
                <a
                  href={contract.sign_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-sm font-bold hover:bg-yellow-500/30 transition-colors"
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/>
                  </svg>
                  Signer le contrat
                </a>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleDownloadContract(contract.id, contract.contract_number)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 text-xs font-medium hover:bg-white/10"
              >
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                </svg>
                Télécharger PDF
              </button>
              {contract.status === "ACTIVE" && (
                <>
                  <button
                    onClick={() => setShowUpgradeModal(contract.id)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FEBD17]/10 border border-[#FEBD17]/30 text-[#FEBD17] text-xs font-medium hover:bg-[#FEBD17]/20"
                  >
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M12 19V5M5 12l7-7 7 7"/>
                    </svg>
                    Changer
                  </button>
                  <button
                    onClick={() => setShowCancelModal(contract.id)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/20"
                  >
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>
                    </svg>
                    Résilier
                  </button>
                </>
              )}
            </div>

            {contract.invoices && contract.invoices.length > 0 && (
              <div>
                <p className="text-white/40 text-xs uppercase tracking-wider mb-2">Historique des paiements</p>
                <div className="space-y-2">
                  {contract.invoices.slice(0, 5).map((inv) => {
                    const invS = INV_STATUS[inv.status] || { label: inv.status, color: "text-white/40" };
                    return (
                      <div key={inv.id} className="flex items-center justify-between bg-white/3 rounded-xl px-3 py-2">
                        <div>
                          <p className={`text-xs font-medium ${invS.color}`}>{invS.label}</p>
                          <p className="text-white/30 text-[10px]">{fmt(inv.due_date || inv.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[#FEBD17] font-semibold text-sm">{Number(inv.amount).toFixed(2)}€</span>
                          <button
                            onClick={() => handleDownloadInvoice(inv.id)}
                            className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white/60 text-[10px] font-medium hover:bg-white/10"
                          >
                            PDF
                          </button>
                          {inv.payment_url && inv.status !== "PAID" && (
                            <a href={inv.payment_url} target="_blank" rel="noopener noreferrer"
                              className="px-2 py-1 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold hover:bg-green-500/20">
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
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Maintenance</h2>
          <p className="text-white/40 text-sm mt-1">Vos contrats de maintenance par bien.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FEBD17] text-black text-sm font-bold hover:bg-[#ffd04d] transition-colors"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Ajouter un bien
        </button>
      </div>

      {loading && <div className="h-40 bg-white/3 rounded-2xl animate-pulse" />}

      {actionMessage && (
        <div className={`p-4 rounded-xl border ${actionMessage.ok ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
          <p className="text-sm">{actionMessage.text}</p>
          <button onClick={() => setActionMessage(null)} className="text-xs underline mt-1 opacity-60">Fermer</button>
        </div>
      )}

      {!loading && activeContracts.length > 0 && (
        <div className="space-y-3">
          <p className="text-white/40 text-xs uppercase tracking-wider">Contrats actifs</p>
          {activeContracts.map(c => <ContractCard key={c.id} contract={c} />)}
        </div>
      )}

      {!loading && archivedContracts.length > 0 && (
        <div className="space-y-3">
          <p className="text-white/40 text-xs uppercase tracking-wider">Contrats archivés</p>
          {archivedContracts.map(c => <ContractCard key={c.id} contract={c} />)}
        </div>
      )}

      {!loading && contracts.length === 0 && (
        <div className="text-center py-12 bg-[#161616] rounded-2xl border border-white/5 space-y-5">
          <svg width="40" height="40" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" viewBox="0 0 24 24" className="mx-auto">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <div>
            <p className="text-white/60 text-sm font-medium">Aucun contrat de maintenance</p>
            <p className="text-white/30 text-xs mt-1">Ajoutez un bien pour bénéficier de nos services.</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-block px-6 py-2.5 rounded-xl bg-[#FEBD17] text-black font-bold text-sm hover:bg-[#ffd04d] transition-colors"
          >
            Ajouter mon premier bien
          </button>
        </div>
      )}

      {/* Modal Ajouter un bien */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-4">Ajouter un nouveau bien</h3>

            <div className="space-y-4">
              <div>
                <p className="text-white/60 text-xs uppercase tracking-wider mb-2">Choisissez votre pack</p>
                <div className="grid grid-cols-2 gap-2">
                  {PACKS.map(pack => (
                    <button
                      key={pack.id}
                      onClick={() => setNewContract({ ...newContract, pack: pack.id })}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        newContract.pack === pack.id
                          ? "bg-[#FEBD17]/10 border-[#FEBD17]/40"
                          : "bg-white/5 border-white/10 hover:border-white/20"
                      }`}
                    >
                      <p className="text-white font-semibold text-sm">{pack.label}</p>
                      <p className="text-[#FEBD17] font-bold text-xs mt-0.5">{pack.price}€/mois</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-white/60 text-xs uppercase tracking-wider mb-2">Fréquence de paiement</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setNewContract({ ...newContract, billing_cycle: "monthly" })}
                    className={`p-3 rounded-xl border text-left ${
                      newContract.billing_cycle === "monthly"
                        ? "bg-[#FEBD17]/10 border-[#FEBD17]/40"
                        : "bg-white/5 border-white/10"
                    }`}
                  >
                    <p className="text-white font-semibold text-sm">Mensuel</p>
                    <p className="text-white/40 text-xs">{PACKS.find(p => p.id === newContract.pack)?.price}€/mois</p>
                  </button>
                  <button
                    onClick={() => setNewContract({ ...newContract, billing_cycle: "annual" })}
                    className={`p-3 rounded-xl border text-left relative ${
                      newContract.billing_cycle === "annual"
                        ? "bg-[#FEBD17]/10 border-[#FEBD17]/40"
                        : "bg-white/5 border-white/10"
                    }`}
                  >
                    <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">-10%</span>
                    <p className="text-white font-semibold text-sm">Annuel</p>
                    <p className="text-white/40 text-xs">{PACKS.find(p => p.id === newContract.pack)?.priceAnnual}€/an</p>
                  </button>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-white/60 text-xs font-semibold">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  Adresse du bien
                </div>
                <input
                  value={newContract.property_label}
                  onChange={(e) => setNewContract({ ...newContract, property_label: e.target.value })}
                  placeholder="Nom du bien (optionnel, ex: Appt Paris)"
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30"
                />
                <input
                  value={newContract.property_address}
                  onChange={(e) => setNewContract({ ...newContract, property_address: e.target.value })}
                  placeholder="Adresse *"
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={newContract.property_postal_code}
                    onChange={(e) => setNewContract({ ...newContract, property_postal_code: e.target.value })}
                    placeholder="Code postal *"
                    maxLength={5}
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30"
                  />
                  <input
                    value={newContract.property_city}
                    onChange={(e) => setNewContract({ ...newContract, property_city: e.target.value })}
                    placeholder="Ville *"
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-medium hover:bg-white/10"
              >
                Annuler
              </button>
              <button
                onClick={handleAddContract}
                disabled={actionLoading || !newContract.property_address || !newContract.property_postal_code || !newContract.property_city}
                className="flex-1 py-2.5 rounded-xl bg-[#FEBD17] text-black text-sm font-bold hover:bg-[#ffd04d] disabled:opacity-50"
              >
                {actionLoading ? "Création..." : "Créer le contrat"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Résiliation */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-white mb-4">Demande de résiliation</h3>
            <p className="text-white/60 text-sm mb-4">
              Êtes-vous sûr de vouloir résilier ce contrat ?
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
                onClick={() => { setShowCancelModal(null); setCancelReason(""); }}
                className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-medium hover:bg-white/10"
              >
                Annuler
              </button>
              <button
                onClick={() => handleCancel(showCancelModal)}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm font-bold hover:bg-red-500/30 disabled:opacity-50"
              >
                {actionLoading ? "Envoi..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Changement */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-white mb-4">Changer d'abonnement</h3>
            <div className="space-y-2">
              {PACKS.filter(p => p.id !== contracts.find(c => c.id === showUpgradeModal)?.pack).map(pack => (
                <button
                  key={pack.id}
                  onClick={() => handleUpgrade(showUpgradeModal, pack.id)}
                  disabled={actionLoading}
                  className="w-full p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#FEBD17]/40 text-left transition-colors disabled:opacity-50"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-white font-semibold">{pack.label}</span>
                    <span className="text-[#FEBD17] font-bold">{pack.price}€/mois</span>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowUpgradeModal(null)}
              className="w-full mt-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-medium hover:bg-white/10"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      <p className="text-white/20 text-xs text-center">
        Une question ?{" "}
        <a href="mailto:contact@renoviapro.fr" className="text-white/40 hover:text-white/60">contact@renoviapro.fr</a>
      </p>
    </div>
  );
}

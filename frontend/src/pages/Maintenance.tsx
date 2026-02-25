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

const STATUS_LABEL: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  ACTIVE:            { label: "Actif",          bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  PENDING_SIGNATURE: { label: "En attente de signature", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  SUSPENDED:         { label: "Suspendu",        bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  CANCELLED:         { label: "Résilié",         bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
};

const INV_STATUS: Record<string, { label: string; color: string }> = {
  PAID:   { label: "Payée",    color: "text-emerald-600" },
  PENDING: { label: "En attente", color: "text-amber-600" },
  TRANSFER_PENDING: { label: "En attente", color: "text-amber-600" },
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
    const s = STATUS_LABEL[contract.status] || { label: contract.status, bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" };

    return (
      <div className={`card overflow-hidden transition-all ${isExpanded ? "border-[#FEBD17]/40 shadow-lg" : ""}`}>
        <button
          onClick={() => setExpandedId(isExpanded ? null : contract.id)}
          className="w-full p-5 flex items-center justify-between text-left hover:bg-gray-50/50 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FEBD17]/20 to-[#FEBD17]/10 flex items-center justify-center shrink-0">
              <svg width="20" height="20" fill="none" stroke="#D9A200" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-gray-900 font-semibold truncate">
                {contract.property_label || contract.property_address || "Bien"}
              </p>
              <p className="text-gray-400 text-sm truncate">
                {contract.property_label ? contract.property_address : contract.plan}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${s.bg} ${s.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
              {s.label}
            </span>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
              className={`text-gray-300 transition-transform ${isExpanded ? "rotate-180" : ""}`}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </button>

        {isExpanded && (
          <div className="px-5 pb-5 space-y-5 border-t border-gray-100">
            <div className="pt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-gray-400 text-[10px] uppercase tracking-wider font-medium">Pack</p>
                <p className="text-gray-900 font-semibold text-sm mt-1">{contract.plan}</p>
              </div>
              <div className="bg-gradient-to-br from-[#FEBD17]/10 to-[#FEBD17]/5 rounded-xl p-4 border border-[#FEBD17]/20">
                <p className="text-[#D9A200] text-[10px] uppercase tracking-wider font-medium">Montant</p>
                <p className="text-gray-900 font-bold text-sm mt-1">{contract.price}€/{cycle}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-gray-400 text-[10px] uppercase tracking-wider font-medium">Début</p>
                <p className="text-gray-900 font-semibold text-sm mt-1">{fmt(contract.start_date)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-gray-400 text-[10px] uppercase tracking-wider font-medium">Prochain paiement</p>
                <p className="text-gray-900 font-semibold text-sm mt-1">{fmt(contract.next_renewal)}</p>
              </div>
            </div>

            {contract.status === "PENDING_SIGNATURE" && contract.sign_url && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                <p className="text-amber-800 text-sm mb-3 font-medium">Votre contrat est en attente de signature.</p>
                <a
                  href={contract.sign_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors no-underline"
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />
                  </svg>
                  Signer le contrat
                </a>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleDownloadContract(contract.id, contract.contract_number)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors"
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
                Télécharger PDF
              </button>
              {contract.status === "ACTIVE" && (
                <>
                  <button
                    onClick={() => setShowUpgradeModal(contract.id)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FEBD17]/10 border border-[#FEBD17]/30 text-[#D9A200] text-sm font-semibold hover:bg-[#FEBD17]/20 transition-colors"
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M12 19V5M5 12l7-7 7 7" />
                    </svg>
                    Changer
                  </button>
                  <button
                    onClick={() => setShowCancelModal(contract.id)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors"
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" />
                    </svg>
                    Résilier
                  </button>
                </>
              )}
            </div>

            {contract.invoices && contract.invoices.length > 0 && (
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wider font-medium mb-3">Historique des paiements</p>
                <div className="space-y-2">
                  {contract.invoices.slice(0, 5).map((inv) => {
                    const invS = INV_STATUS[inv.status] || { label: inv.status, color: "text-gray-500" };
                    return (
                      <div key={inv.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                        <div>
                          <p className={`text-sm font-medium ${invS.color}`}>{invS.label}</p>
                          <p className="text-gray-400 text-xs">{fmt(inv.due_date || inv.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-900 font-semibold text-sm">{Number(inv.amount).toFixed(2)}€</span>
                          <button
                            onClick={() => handleDownloadInvoice(inv.id)}
                            className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 text-xs font-medium hover:bg-gray-100 transition-colors"
                          >
                            PDF
                          </button>
                          {inv.payment_url && inv.status !== "PAID" && (
                            <a href={inv.payment_url} target="_blank" rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 no-underline">
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
    <div className="space-y-8 fade-in max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance</h1>
          <p className="text-gray-500 text-sm mt-1">Gérez vos contrats de maintenance par bien.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-gold flex items-center gap-2"
          style={{ padding: "12px 24px", width: "auto" }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Ajouter un bien
        </button>
      </div>

      {loading && (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="card p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-xl animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-2/3 bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-1/3 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {actionMessage && (
        <div className={`card p-5 ${actionMessage.ok ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}>
          <p className={`text-sm font-medium ${actionMessage.ok ? "text-emerald-700" : "text-red-700"}`}>
            {actionMessage.text}
          </p>
          <button onClick={() => setActionMessage(null)} className="text-xs underline mt-2 opacity-60">Fermer</button>
        </div>
      )}

      {!loading && activeContracts.length > 0 && (
        <div className="space-y-4">
          <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Contrats actifs</p>
          {activeContracts.map(c => <ContractCard key={c.id} contract={c} />)}
        </div>
      )}

      {!loading && archivedContracts.length > 0 && (
        <div className="space-y-4">
          <p className="text-gray-400 text-xs uppercase tracking-wider font-medium">Contrats archivés</p>
          {archivedContracts.map(c => <ContractCard key={c.id} contract={c} />)}
        </div>
      )}

      {!loading && contracts.length === 0 && (
        <div className="card text-center py-16 px-6">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gray-100 flex items-center justify-center">
            <svg width="36" height="36" fill="none" stroke="#9CA3AF" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <h3 className="text-gray-900 font-semibold text-lg mb-2">Aucun contrat de maintenance</h3>
          <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
            Ajoutez un bien pour bénéficier de nos services de maintenance.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-gold inline-flex"
            style={{ width: "auto", padding: "12px 24px" }}
          >
            Ajouter mon premier bien
          </button>
        </div>
      )}

      {/* Modal Ajouter un bien */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Ajouter un nouveau bien</h3>

            <div className="space-y-5">
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider font-medium mb-3">Choisissez votre pack</p>
                <div className="grid grid-cols-2 gap-3">
                  {PACKS.map(pack => (
                    <button
                      key={pack.id}
                      onClick={() => setNewContract({ ...newContract, pack: pack.id })}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        newContract.pack === pack.id
                          ? "bg-[#FEBD17]/10 border-[#FEBD17]"
                          : "bg-gray-50 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <p className="text-gray-900 font-semibold">{pack.label}</p>
                      <p className={`font-bold text-sm mt-1 ${newContract.pack === pack.id ? "text-[#D9A200]" : "text-gray-500"}`}>
                        {pack.price}€/mois
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider font-medium mb-3">Fréquence de paiement</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setNewContract({ ...newContract, billing_cycle: "monthly" })}
                    className={`p-4 rounded-xl border-2 text-left ${
                      newContract.billing_cycle === "monthly"
                        ? "bg-[#FEBD17]/10 border-[#FEBD17]"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <p className="text-gray-900 font-semibold">Mensuel</p>
                    <p className="text-gray-400 text-sm">{PACKS.find(p => p.id === newContract.pack)?.price}€/mois</p>
                  </button>
                  <button
                    onClick={() => setNewContract({ ...newContract, billing_cycle: "annual" })}
                    className={`p-4 rounded-xl border-2 text-left relative ${
                      newContract.billing_cycle === "annual"
                        ? "bg-[#FEBD17]/10 border-[#FEBD17]"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">-10%</span>
                    <p className="text-gray-900 font-semibold">Annuel</p>
                    <p className="text-gray-400 text-sm">{PACKS.find(p => p.id === newContract.pack)?.priceAnnual}€/an</p>
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold">
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  Adresse du bien
                </div>
                <input
                  value={newContract.property_label}
                  onChange={(e) => setNewContract({ ...newContract, property_label: e.target.value })}
                  placeholder="Nom du bien (optionnel, ex: Appt Paris)"
                  className="input-field"
                />
                <input
                  value={newContract.property_address}
                  onChange={(e) => setNewContract({ ...newContract, property_address: e.target.value })}
                  placeholder="Adresse *"
                  className="input-field"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={newContract.property_postal_code}
                    onChange={(e) => setNewContract({ ...newContract, property_postal_code: e.target.value })}
                    placeholder="Code postal *"
                    maxLength={5}
                    className="input-field"
                  />
                  <input
                    value={newContract.property_city}
                    onChange={(e) => setNewContract({ ...newContract, property_city: e.target.value })}
                    placeholder="Ville *"
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleAddContract}
                disabled={actionLoading || !newContract.property_address || !newContract.property_postal_code || !newContract.property_city}
                className="flex-1 btn-gold disabled:opacity-50"
                style={{ padding: "12px 24px" }}
              >
                {actionLoading ? "Création..." : "Créer le contrat"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Résiliation */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Demande de résiliation</h3>
            <p className="text-gray-500 text-sm mb-5">
              Êtes-vous sûr de vouloir résilier ce contrat ?
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Raison de la résiliation (optionnel)"
              className="input-field resize-none"
              rows={3}
            />
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { setShowCancelModal(null); setCancelReason(""); }}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleCancel(showCancelModal)}
                disabled={actionLoading}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {actionLoading ? "Envoi..." : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Changement */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-5">Changer d'abonnement</h3>
            <div className="space-y-3">
              {PACKS.filter(p => p.id !== contracts.find(c => c.id === showUpgradeModal)?.pack).map(pack => (
                <button
                  key={pack.id}
                  onClick={() => handleUpgrade(showUpgradeModal, pack.id)}
                  disabled={actionLoading}
                  className="w-full p-5 rounded-xl bg-gray-50 border-2 border-gray-200 hover:border-[#FEBD17] text-left transition-colors disabled:opacity-50"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-gray-900 font-semibold">{pack.label}</span>
                    <span className="text-[#D9A200] font-bold">{pack.price}€/mois</span>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowUpgradeModal(null)}
              className="w-full mt-5 py-3 rounded-xl bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      <p className="text-gray-400 text-sm text-center">
        Une question ?{" "}
        <a href="mailto:contact@renoviapro.fr" className="text-[#FEBD17] hover:underline">contact@renoviapro.fr</a>
      </p>
    </div>
  );
}

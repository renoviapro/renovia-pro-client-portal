import { useEffect, useState } from "react";
import { api, getToken } from "../lib/api";

type Contract = { plan: string; next_renewal: string; factures?: { label: string; date: string; amount?: string }[] };

const PACK_LABELS: Record<string, string> = {
  tranquille: "Tranquille",
  tranquille_plus: "Tranquille+",
};

const PACK_FEATURES: Record<string, string[]> = {
  tranquille: ["Priorité 72h ouvrées", "-10% main d'œuvre", "1 contrôle annuel (optionnel)"],
  tranquille_plus: ["Priorité 48h ouvrées", "-10% main d'œuvre", "1 dépannage/an inclus (45 min)"],
};

export default function Maintenance() {
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);

  // Lecture du ?pack= dans l'URL
  const params = new URLSearchParams(window.location.search);
  const packParam = params.get("pack") || "";
  const packLabel = PACK_LABELS[packParam] || "";

  // Formulaire de souscription
  const [form, setForm] = useState({ phone: "", address: "", notes: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ contract: Contract }>("/api/v1/maintenance")
      .then(r => setContract(r.contract))
      .finally(() => setLoading(false));
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.phone.trim() || !form.address.trim()) { setError("Téléphone et adresse sont requis."); return; }
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/v1/maintenance/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ pack: packParam || "tranquille_plus", ...form }),
      });
      if (res.ok) { setSent(true); window.history.replaceState({}, "", "/maintenance"); }
      else { const d = await res.json().catch(() => ({})); setError(d.detail || "Erreur lors de l'envoi."); }
    } catch { setError("Erreur réseau. Réessayez."); }
    finally { setSending(false); }
  };

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

      {/* Formulaire souscription si ?pack= dans l'URL */}
      {!loading && !contract && packLabel && !sent && (
        <div className="bg-[#161616] border border-[#FEBD17]/30 rounded-2xl p-6 space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs bg-[#FEBD17]/10 text-[#FEBD17] px-2 py-0.5 rounded-full font-semibold">Pack sélectionné</span>
            </div>
            <h3 className="text-white font-bold text-lg">Contrat {packLabel}</h3>
            <ul className="mt-2 space-y-1">
              {(PACK_FEATURES[packParam] || []).map((f, i) => (
                <li key={i} className="flex gap-2 text-sm text-white/60">
                  <span className="text-[#FEBD17]">✓</span>{f}
                </li>
              ))}
            </ul>
          </div>

          <form onSubmit={handleSubscribe} className="space-y-4">
            <div>
              <label className="block text-white/50 text-xs uppercase tracking-wider mb-1.5">Téléphone *</label>
              <input
                type="tel" required
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="06 00 00 00 00"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#FEBD17]/50"
              />
            </div>
            <div>
              <label className="block text-white/50 text-xs uppercase tracking-wider mb-1.5">Adresse du logement *</label>
              <input
                type="text" required
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                placeholder="87 Boulevard Jean Behra, Nice"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#FEBD17]/50"
              />
            </div>
            <div>
              <label className="block text-white/50 text-xs uppercase tracking-wider mb-1.5">Message (optionnel)</label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Précisions sur votre logement, questions…"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#FEBD17]/50 resize-none"
              />
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button
              type="submit"
              disabled={sending}
              className="w-full py-3 rounded-xl bg-[#FEBD17] text-black font-bold text-sm hover:bg-[#ffd04d] transition-colors disabled:opacity-50"
            >
              {sending ? "Envoi en cours…" : `Demander le contrat ${packLabel}`}
            </button>
            <p className="text-white/30 text-xs text-center">
              Renovia Pro vous contacte sous 24h ouvrées pour finaliser votre contrat.
            </p>
          </form>
        </div>
      )}

      {/* Confirmation envoi */}
      {sent && (
        <div className="text-center py-10 bg-[#161616] rounded-2xl border border-green-500/20">
          <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" fill="none" stroke="#22c55e" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
          </div>
          <p className="text-white font-bold text-lg">Demande envoyée !</p>
          <p className="text-white/40 text-sm mt-1">Renovia Pro vous contacte sous 24h ouvrées.</p>
        </div>
      )}

      {/* Aucun contrat, pas de pack param */}
      {!loading && !contract && !packLabel && !sent && (
        <div className="text-center py-12 bg-[#161616] rounded-2xl border border-white/5 space-y-4">
          <svg width="40" height="40" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" viewBox="0 0 24 24" className="mx-auto">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
          <p className="text-white/30 text-sm">Aucun contrat de maintenance actif</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center px-6">
            <button
              onClick={() => window.location.search = "?pack=tranquille"}
              className="px-5 py-2.5 rounded-xl border border-white/10 text-white/60 text-sm hover:text-white hover:border-white/30 transition-colors"
            >Souscrire Tranquille</button>
            <button
              onClick={() => window.location.search = "?pack=tranquille_plus"}
              className="px-5 py-2.5 rounded-xl bg-[#FEBD17] text-black font-bold text-sm hover:bg-[#ffd04d] transition-colors"
            >Souscrire Tranquille+ ⭐</button>
          </div>
        </div>
      )}
    </div>
  );
}

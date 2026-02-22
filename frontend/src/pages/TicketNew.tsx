import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiForm } from "../lib/api";

export default function TicketNew() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);

  const inputClass = "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white placeholder-white/30 focus:border-[#FEBD17]/50 focus:outline-none focus:ring-1 focus:ring-[#FEBD17]/20 transition text-sm resize-none";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("subject", subject);
      fd.append("description", description);
      photos.forEach(f => fd.append("photos", f));
      await apiForm("/api/v1/tickets", fd);
      navigate("/tickets");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/tickets" className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors no-underline">
          <svg width="16" height="16" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="15,18 9,12 15,6"/>
          </svg>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-white">Nouveau ticket SAV</h2>
          <p className="text-white/40 text-sm">Décrivez votre problème, nous vous répondons sous 24–48h ouvrées.</p>
        </div>
      </div>

      {/* Info tarif */}
      <div className="flex items-start gap-3 bg-[#FEBD17]/5 border border-[#FEBD17]/15 rounded-xl p-4">
        <svg width="18" height="18" fill="none" stroke="#FEBD17" strokeWidth="2" viewBox="0 0 24 24" className="shrink-0 mt-0.5">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p className="text-white/60 text-sm leading-relaxed">
          Diagnostic SAV <strong className="text-[#FEBD17]">49€</strong> — <strong className="text-white">offert</strong> si pris en charge par Renovia Pro, <strong className="text-white">déduit</strong> du devis si accepté.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-[#161616] rounded-2xl border border-white/5 p-6 space-y-5">
        <div>
          <label className="block text-white/50 text-xs uppercase tracking-wider mb-2">Sujet *</label>
          <input
            required
            type="text"
            placeholder="Ex : Fuite sous l'évier, panne chaudière…"
            className={inputClass}
            value={subject}
            onChange={e => setSubject(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-white/50 text-xs uppercase tracking-wider mb-2">Description *</label>
          <textarea
            required
            rows={5}
            placeholder="Décrivez le problème en détail : quand ça a commencé, symptômes, ce que vous avez déjà essayé…"
            className={inputClass}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-white/50 text-xs uppercase tracking-wider mb-2">
            Photos <span className="normal-case text-white/30">(optionnel)</span>
          </label>
          <label className="flex flex-col items-center gap-3 border-2 border-dashed border-white/10 hover:border-[#FEBD17]/30 rounded-xl p-6 cursor-pointer transition-colors text-center">
            <svg width="28" height="28" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21,15 16,10 5,21"/>
            </svg>
            <span className="text-white/30 text-sm">{photos.length > 0 ? `${photos.length} photo(s) sélectionnée(s)` : "Cliquez pour ajouter des photos"}</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={e => setPhotos(Array.from(e.target.files || []))} />
          </label>
        </div>

        {error && <p className="text-red-400 text-sm bg-red-500/10 rounded-xl px-4 py-3">{error}</p>}

        <button type="submit" disabled={loading} className="btn-gold w-full">
          {loading ? "Envoi en cours…" : "Envoyer le ticket"}
        </button>
      </form>
    </div>
  );
}

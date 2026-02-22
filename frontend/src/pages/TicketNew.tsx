import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiForm } from "../lib/api";

export default function TicketNew() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("subject", subject);
      fd.append("description", description);
      photos.forEach((f) => fd.append("photos", f));
      await apiForm("/api/v1/tickets", fd);
      navigate("/tickets");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    }
    setLoading(false);
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Nouveau ticket SAV</h1>
      <p className="mt-2 text-sm text-white/60">Diagnostic SAV 49€ — offert si pris en charge RenoviaPro, déduit si devis accepté. Réponse sous 24–48h ouvrées.</p>
      <form onSubmit={handleSubmit} className="mt-8 max-w-xl flex flex-col gap-4">
        <input required placeholder="Sujet *" className="rounded-lg border border-white/30 bg-white/5 px-4 py-3 text-white placeholder-white/50" value={subject} onChange={(e) => setSubject(e.target.value)} />
        <textarea required rows={5} placeholder="Description du problème *" className="rounded-lg border border-white/30 bg-white/5 px-4 py-3 text-white placeholder-white/50" value={description} onChange={(e) => setDescription(e.target.value)} />
        <div>
          <label className="text-sm text-white/70">Photos (optionnel)</label>
          <input type="file" accept="image/*" multiple className="mt-2 block w-full text-sm text-white/70" onChange={(e) => setPhotos(Array.from(e.target.files || []))} />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="btn-gold w-full">
          {loading ? "Envoi..." : "Créer le ticket"}
        </button>
      </form>
    </div>
  );
}

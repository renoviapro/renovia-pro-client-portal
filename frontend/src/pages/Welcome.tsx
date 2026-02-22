import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getToken } from "../lib/api";

const API = (import.meta as unknown as { env: { VITE_API_URL?: string } }).env?.VITE_API_URL ?? "";

export default function Welcome() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white placeholder-white/30 focus:border-[#FEBD17]/60 focus:outline-none focus:ring-1 focus:ring-[#FEBD17]/30 transition text-sm";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Veuillez entrer votre nom."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/api/v1/me/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || "Erreur lors de la sauvegarde.");
        setLoading(false);
        return;
      }
    } catch {
      // on continue quand même
    }
    navigate("/dashboard", { replace: true });
  };

  const skip = () => navigate("/dashboard", { replace: true });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0d0d0d] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Renovia Pro" className="h-24 w-24 object-contain mx-auto mb-4 drop-shadow-xl" />
          <h1 className="text-3xl text-white" style={{ fontFamily: "'Black Ops One', sans-serif" }}>
            Bienvenue !
          </h1>
          <div className="w-12 h-0.5 bg-[#FEBD17] mx-auto mt-3 mb-3" />
          <p className="text-white/40 text-sm">
            Votre compte a bien été créé. Complétez votre profil pour une meilleure expérience.
          </p>
        </div>

        <div className="bg-[#161616] rounded-2xl p-8 border border-white/5 shadow-2xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label htmlFor="name" className="block text-white/50 text-xs uppercase tracking-wider mb-1.5">
                Votre nom complet <span className="text-[#FEBD17]">*</span>
              </label>
              <input
                id="name"
                type="text"
                required
                placeholder="Prénom Nom"
                className={inputClass}
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-white/50 text-xs uppercase tracking-wider mb-1.5">
                Téléphone <span className="text-white/30 normal-case">(optionnel)</span>
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="06 01 02 03 04"
                className={inputClass}
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
            )}

            <button type="submit" disabled={loading} className="btn-gold w-full mt-1">
              {loading ? "Enregistrement…" : "Accéder à mon espace client"}
            </button>
          </form>

          <p className="text-center mt-4">
            <button
              type="button"
              onClick={skip}
              className="text-white/30 text-xs hover:text-white/50 transition"
            >
              Passer cette étape →
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = (import.meta as unknown as { env: { VITE_API_URL?: string } }).env?.VITE_API_URL ?? "";

export default function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/auth/magic-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      await res.json();
      setSent(true);
    } catch {
      setSent(true);
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-[#0d0d0d]">
        <div className="max-w-md text-center">
          <h2 className="text-xl font-semibold text-white">Vérifiez votre boîte mail</h2>
          <p className="mt-3 text-white/70">Si un compte existe, vous recevrez un lien de connexion (valable 15 min).</p>
          <button onClick={() => { setSent(false); setEmail(""); }} className="mt-6 text-[#febd17] underline">
            Utiliser une autre adresse
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#0d0d0d]">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold text-white text-center">Espace client Renovia Pro</h1>
        <p className="mt-2 text-white/60 text-center text-sm">Connexion par lien magique (email)</p>
        <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-4">
          <input
            type="email"
            required
            placeholder="votre@email.fr"
            className="rounded-lg border border-white/30 bg-white/5 px-4 py-3 text-white placeholder-white/50"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" disabled={loading} className="rounded-full bg-[#febd17] px-8 py-4 font-semibold text-black hover:bg-[#ffd24d] disabled:opacity-70">
            {loading ? "Envoi..." : "Recevoir le lien de connexion"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-white/50">
          <a href="https://renoviapro.fr" className="text-[#febd17] no-underline">renoviapro.fr</a>
        </p>
      </div>
    </div>
  );
}

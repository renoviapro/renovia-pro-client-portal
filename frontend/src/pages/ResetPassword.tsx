import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { setToken } from "../lib/api";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Lien invalide. Veuillez redemander une réinitialisation.");
    }
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Le mot de passe doit comporter au moins 8 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Erreur");
      setToken(data.access_token);
      if (data.refresh_token) localStorage.setItem("refresh_token", data.refresh_token);
      setSuccess(true);
      setTimeout(() => navigate("/dashboard"), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0d0d0d] px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <img src="/logo.png" alt="Renovia Pro" className="h-20 w-20 object-contain" />
        </div>

        <div className="bg-[#161616] rounded-2xl p-8 border border-white/5 shadow-2xl">
          <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Black Ops One', sans-serif" }}>
            Nouveau mot de passe
          </h1>
          <p className="text-white/50 text-sm mb-6">Choisissez un mot de passe sécurisé (min. 8 caractères).</p>

          {success ? (
            <div className="text-center py-8">
              <div className="text-[#FEBD17] text-4xl mb-4">✓</div>
              <p className="text-white font-semibold mb-1">Mot de passe modifié !</p>
              <p className="text-white/50 text-sm">Redirection vers votre espace…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                  {error}
                </div>
              )}
              <div>
                <label htmlFor="new-password" className="block text-white/60 text-xs uppercase tracking-wider mb-1">
                  Nouveau mot de passe
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#FEBD17]/50 transition"
                />
              </div>
              <div>
                <label htmlFor="confirm-password" className="block text-white/60 text-xs uppercase tracking-wider mb-1">
                  Confirmer le mot de passe
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#FEBD17]/50 transition"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !token}
                className="btn-gold w-full mt-2"
              >
                {loading ? "Enregistrement…" : "Enregistrer le mot de passe"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center mt-6 text-white/30 text-sm">
          <a href="/login" className="hover:text-[#FEBD17] transition">← Retour à la connexion</a>
        </p>
      </div>
    </div>
  );
}

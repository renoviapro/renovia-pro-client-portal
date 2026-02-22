import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = (import.meta as unknown as { env: { VITE_API_URL?: string } }).env?.VITE_API_URL ?? "";

type Mode = "magic" | "password" | "set-password" | "forgot";

function IconMagic() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  );
}
function IconLock() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export default function Login() {
  const [mode, setMode] = useState<Mode>("magic");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const inputClass =
    "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white placeholder-white/30 focus:border-[#FEBD17]/60 focus:outline-none focus:ring-1 focus:ring-[#FEBD17]/30 transition text-sm";

  const handleMagicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await fetch(`${API}/api/v1/auth/magic-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      setSent(true);
    } catch {
      setSent(true);
    }
    setLoading(false);
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || "Email ou mot de passe incorrect"); setLoading(false); return; }
      localStorage.setItem("access_token", data.access_token);
      if (data.refresh_token) localStorage.setItem("refresh_token", data.refresh_token);
      navigate("/dashboard", { replace: true });
    } catch {
      setError("Erreur réseau");
    }
    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await fetch(`${API}/api/v1/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      setSent(true);
    } catch {
      setSent(true);
    }
    setLoading(false);
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Minimum 8 caractères."); return; }
    if (password !== confirmPassword) { setError("Les mots de passe ne correspondent pas."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/auth/set-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || "Erreur"); setLoading(false); return; }
      localStorage.setItem("access_token", data.access_token);
      if (data.refresh_token) localStorage.setItem("refresh_token", data.refresh_token);
      navigate("/dashboard", { replace: true });
    } catch {
      setError("Erreur réseau");
    }
    setLoading(false);
  };

  /* ── Écran de confirmation envoi ── */
  if (sent) {
    const isForgot = mode === "forgot";
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0d0d0d] px-4">
        <img src="/logo.png" alt="Renovia Pro" className="h-28 w-28 object-contain mb-8 drop-shadow-xl" />
        <div className="w-full max-w-md bg-[#161616] rounded-2xl p-8 border border-white/5 shadow-2xl text-center">
          <div className="w-16 h-16 rounded-full bg-[#FEBD17]/10 border border-[#FEBD17]/30 flex items-center justify-center mx-auto mb-5">
            <span className="text-[#FEBD17] text-2xl">✉</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Black Ops One', sans-serif" }}>
            {isForgot ? "Email de réinitialisation envoyé" : "Vérifiez votre boîte mail"}
          </h2>
          <p className="text-white/50 text-sm leading-relaxed mb-6">
            {isForgot
              ? "Si un compte existe avec cet email, vous recevrez un lien de réinitialisation valable 15 minutes."
              : "Si un compte existe, vous recevrez un lien de connexion valable 15 minutes. Pensez à vérifier vos spams."}
          </p>
          <button
            onClick={() => { setSent(false); setEmail(""); setMode("magic"); }}
            className="text-[#FEBD17] text-sm hover:underline"
          >
            ← Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#0d0d0d]">
      {/* Colonne gauche décorative (desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center bg-black">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FEBD17]/10 via-transparent to-black" />
        <div className="relative z-10 text-center px-12">
          <img src="/logo.png" alt="Renovia Pro" className="h-40 w-40 object-contain mx-auto mb-8 drop-shadow-2xl" />
          <h1 className="text-4xl text-white leading-tight mb-3" style={{ fontFamily: "'Black Ops One', sans-serif" }}>
            RENOVIA <span className="text-[#FEBD17]">PRO</span>
          </h1>
          <div className="w-16 h-0.5 bg-[#FEBD17] mx-auto mb-4" />
          <p className="text-white/40 text-sm">Votre espace client sécurisé</p>
        </div>
      </div>

      {/* Colonne droite : formulaire */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo mobile */}
        <div className="lg:hidden mb-8 text-center">
          <img src="/logo.png" alt="Renovia Pro" className="h-24 w-24 object-contain mx-auto drop-shadow-xl" />
          <h1 className="text-2xl text-white mt-4" style={{ fontFamily: "'Black Ops One', sans-serif" }}>
            RENOVIA <span className="text-[#FEBD17]">PRO</span>
          </h1>
        </div>

        <div className="w-full max-w-md">
          {/* Titre */}
          {mode !== "set-password" && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white">
                {mode === "forgot" ? "Mot de passe oublié" : "Connexion"}
              </h2>
              <p className="text-white/40 text-sm mt-1">
                {mode === "forgot"
                  ? "Entrez votre email pour recevoir un lien de réinitialisation."
                  : "Accédez à votre espace client Renovia Pro."}
              </p>
            </div>
          )}

          {/* Onglets magic / password */}
          {(mode === "magic" || mode === "password") && (
            <div className="flex mb-6 bg-white/5 rounded-xl p-1 gap-1">
              <button
                type="button"
                onClick={() => { setMode("magic"); setError(""); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  mode === "magic"
                    ? "bg-[#FEBD17] text-black shadow"
                    : "text-white/50 hover:text-white"
                }`}
              >
                <IconMagic /> Lien magique
              </button>
              <button
                type="button"
                onClick={() => { setMode("password"); setError(""); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  mode === "password"
                    ? "bg-[#FEBD17] text-black shadow"
                    : "text-white/50 hover:text-white"
                }`}
              >
                <IconLock /> Mot de passe
              </button>
            </div>
          )}

          {/* ── Mode lien magique ── */}
          {mode === "magic" && (
            <form onSubmit={handleMagicSubmit} className="flex flex-col gap-4">
              <input type="email" required placeholder="votre@email.fr" className={inputClass}
                value={email} onChange={e => setEmail(e.target.value)} />
              <button type="submit" disabled={loading} className="btn-gold w-full">
                {loading ? "Envoi…" : "Recevoir mon lien de connexion"}
              </button>
              <p className="text-center text-xs text-white/30 mt-1">
                Un lien sécurisé vous sera envoyé par email (valable 15 min).<br />
                Aucun mot de passe nécessaire.
              </p>
            </form>
          )}

          {/* ── Mode mot de passe ── */}
          {mode === "password" && (
            <form onSubmit={handlePasswordLogin} className="flex flex-col gap-4">
              <input type="email" required placeholder="votre@email.fr" className={inputClass}
                value={email} onChange={e => setEmail(e.target.value)} />
              <input type="password" required placeholder="Mot de passe" className={inputClass}
                value={password} onChange={e => setPassword(e.target.value)} />
              {error && <p className="text-red-400 text-sm bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}
              <button type="submit" disabled={loading} className="btn-gold w-full">
                {loading ? "Connexion…" : "Se connecter"}
              </button>
              <p className="text-center text-sm">
                <button type="button" onClick={() => { setMode("forgot"); setError(""); }}
                  className="text-[#FEBD17] hover:underline text-xs">
                  Mot de passe oublié ?
                </button>
              </p>
            </form>
          )}

          {/* ── Mode mot de passe oublié ── */}
          {mode === "forgot" && (
            <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
              <input type="email" required placeholder="votre@email.fr" className={inputClass}
                value={email} onChange={e => setEmail(e.target.value)} />
              {error && <p className="text-red-400 text-sm bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}
              <button type="submit" disabled={loading} className="btn-gold w-full">
                {loading ? "Envoi…" : "Recevoir le lien de réinitialisation"}
              </button>
              <p className="text-center text-sm">
                <button type="button" onClick={() => { setMode("password"); setError(""); }}
                  className="text-white/40 hover:text-white text-xs">
                  ← Retour à la connexion
                </button>
              </p>
            </form>
          )}

          {/* ── Mode créer mot de passe ── */}
          {mode === "set-password" && (
            <div>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white">Créer un mot de passe</h2>
                <p className="text-white/40 text-sm mt-1">Associez un mot de passe à votre compte (min. 8 caractères).</p>
              </div>
              <form onSubmit={handleSetPassword} className="flex flex-col gap-4">
                <input type="email" required placeholder="votre@email.fr" className={inputClass}
                  value={email} onChange={e => setEmail(e.target.value)} />
                <input type="password" required minLength={8} placeholder="Mot de passe" className={inputClass}
                  value={password} onChange={e => setPassword(e.target.value)} />
                <input type="password" required placeholder="Confirmer le mot de passe" className={inputClass}
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                {error && <p className="text-red-400 text-sm bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}
                <button type="submit" disabled={loading} className="btn-gold w-full">
                  {loading ? "Création…" : "Créer mon mot de passe"}
                </button>
              </form>
              <p className="mt-5 text-center text-sm">
                <button type="button" onClick={() => { setMode("magic"); setError(""); }}
                  className="text-[#FEBD17] hover:underline text-xs">
                  ← Retour à la connexion
                </button>
              </p>
            </div>
          )}

          {/* Séparateur + option créer compte */}
          {(mode === "magic" || mode === "password") && (
            <div className="mt-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-white/30 text-xs">ou</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
              <button
                type="button"
                onClick={() => { setMode("set-password"); setError(""); }}
                className="w-full py-3 rounded-xl border border-white/10 text-white/50 text-sm hover:border-[#FEBD17]/40 hover:text-[#FEBD17] transition-all"
              >
                Créer / modifier mon mot de passe
              </button>
            </div>
          )}

          <p className="mt-8 text-center text-xs text-white/20">
            <a href="https://renoviapro.fr" className="hover:text-[#FEBD17] transition">renoviapro.fr</a>
          </p>
        </div>
      </div>
    </div>
  );
}

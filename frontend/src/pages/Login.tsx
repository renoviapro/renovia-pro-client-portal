import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = (import.meta as unknown as { env: { VITE_API_URL?: string } }).env?.VITE_API_URL ?? "";

type Mode = "magic" | "password" | "set-password" | "forgot";

function IconMagic() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  );
}
function IconLock() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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

  if (sent) {
    const isForgot = mode === "forgot";
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAF8] px-4">
        <div className="w-full max-w-md slide-up">
          <div className="card p-10 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FEBD17]/20 to-[#FEBD17]/10 flex items-center justify-center mx-auto mb-6">
              <svg width="36" height="36" fill="none" stroke="#FEBD17" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6z" />
                <path d="M22 6l-10 7L2 6" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3" style={{ fontFamily: "'Black Ops One', sans-serif" }}>
              {isForgot ? "Email envoyé !" : "Vérifiez votre boîte mail"}
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-8">
              {isForgot
                ? "Si un compte existe avec cet email, vous recevrez un lien de réinitialisation valable 30 minutes."
                : "Si un compte existe, vous recevrez un lien de connexion valable 30 minutes. Pensez à vérifier vos spams."}
            </p>
            <button
              onClick={() => { setSent(false); setEmail(""); setMode("magic"); }}
              className="text-[#FEBD17] text-sm font-medium hover:underline flex items-center justify-center gap-2 mx-auto"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Retour à la connexion
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#FAFAF8]">
      {/* Colonne gauche décorative (desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center bg-black">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#FEBD17]/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-[#FEBD17]/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 text-center px-12">
          <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-[#FEBD17] to-[#E6AA00] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-[#FEBD17]/30">
            <img src="/logo.png" alt="Renovia Pro" className="h-20 w-20 object-contain" />
          </div>
          <h1 className="text-5xl text-white leading-tight mb-4" style={{ fontFamily: "'Black Ops One', sans-serif" }}>
            RENOVIA <span className="text-[#FEBD17]">PRO</span>
          </h1>
          <div className="w-20 h-1 bg-gradient-to-r from-[#FEBD17] to-[#E6AA00] mx-auto mb-6 rounded-full" />
          <p className="text-white/50 text-lg">Votre espace client sécurisé</p>
          <div className="mt-12 flex items-center justify-center gap-8 text-white/30 text-sm">
            <div className="flex items-center gap-2">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              Devis & Factures
            </div>
            <div className="flex items-center gap-2">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              Suivi Chantiers
            </div>
            <div className="flex items-center gap-2">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              SAV 24/7
            </div>
          </div>
        </div>
      </div>

      {/* Colonne droite : formulaire */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo mobile */}
        <div className="lg:hidden mb-10 text-center">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#FEBD17] to-[#E6AA00] flex items-center justify-center mx-auto shadow-xl shadow-[#FEBD17]/20">
            <img src="/logo.png" alt="Renovia Pro" className="h-16 w-16 object-contain" />
          </div>
          <h1 className="text-3xl text-gray-900 mt-6" style={{ fontFamily: "'Black Ops One', sans-serif" }}>
            RENOVIA <span className="text-[#FEBD17]">PRO</span>
          </h1>
        </div>

        <div className="w-full max-w-md slide-up">
          {/* Titre */}
          {mode !== "set-password" && (
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900">
                {mode === "forgot" ? "Mot de passe oublié" : "Connexion"}
              </h2>
              <p className="text-gray-500 text-base mt-2">
                {mode === "forgot"
                  ? "Entrez votre email pour recevoir un lien de réinitialisation."
                  : "Accédez à votre espace client Renovia Pro."}
              </p>
            </div>
          )}

          {/* Onglets magic / password */}
          {(mode === "magic" || mode === "password") && (
            <div className="flex mb-8 bg-gray-100 rounded-2xl p-1.5 gap-1">
              <button
                type="button"
                onClick={() => { setMode("magic"); setError(""); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold rounded-xl transition-all ${
                  mode === "magic"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <IconMagic /> Lien magique
              </button>
              <button
                type="button"
                onClick={() => { setMode("password"); setError(""); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold rounded-xl transition-all ${
                  mode === "password"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <IconLock /> Mot de passe
              </button>
            </div>
          )}

          {/* ── Mode lien magique ── */}
          {mode === "magic" && (
            <form onSubmit={handleMagicSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Adresse email</label>
                <input 
                  type="email" 
                  required 
                  placeholder="votre@email.fr" 
                  className="input-field"
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                />
              </div>
              <button type="submit" disabled={loading} className="btn-gold w-full py-4">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Envoi en cours...
                  </span>
                ) : "Recevoir mon lien de connexion"}
              </button>
              <p className="text-center text-sm text-gray-400 leading-relaxed">
                Un lien sécurisé vous sera envoyé par email (valable 30 min).
                <br />Aucun mot de passe nécessaire.
              </p>
            </form>
          )}

          {/* ── Mode mot de passe ── */}
          {mode === "password" && (
            <form onSubmit={handlePasswordLogin} className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Adresse email</label>
                <input 
                  type="email" 
                  required 
                  placeholder="votre@email.fr" 
                  className="input-field"
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
                <input 
                  type="password" 
                  required 
                  placeholder="••••••••" 
                  className="input-field"
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}
              <button type="submit" disabled={loading} className="btn-gold w-full py-4">
                {loading ? "Connexion..." : "Se connecter"}
              </button>
              <p className="text-center">
                <button type="button" onClick={() => { setMode("forgot"); setError(""); }}
                  className="text-[#FEBD17] hover:underline text-sm font-medium">
                  Mot de passe oublié ?
                </button>
              </p>
            </form>
          )}

          {/* ── Mode mot de passe oublié ── */}
          {mode === "forgot" && (
            <form onSubmit={handleForgotPassword} className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Adresse email</label>
                <input 
                  type="email" 
                  required 
                  placeholder="votre@email.fr" 
                  className="input-field"
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  {error}
                </div>
              )}
              <button type="submit" disabled={loading} className="btn-gold w-full py-4">
                {loading ? "Envoi..." : "Recevoir le lien de réinitialisation"}
              </button>
              <p className="text-center">
                <button type="button" onClick={() => { setMode("password"); setError(""); }}
                  className="text-gray-500 hover:text-gray-700 text-sm flex items-center justify-center gap-2 mx-auto">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                  Retour à la connexion
                </button>
              </p>
            </form>
          )}

          {/* ── Mode créer mot de passe ── */}
          {mode === "set-password" && (
            <div>
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900">Créer un mot de passe</h2>
                <p className="text-gray-500 text-base mt-2">Associez un mot de passe à votre compte (min. 8 caractères).</p>
              </div>
              <form onSubmit={handleSetPassword} className="flex flex-col gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Adresse email</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="votre@email.fr" 
                    className="input-field"
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
                  <input 
                    type="password" 
                    required 
                    minLength={8} 
                    placeholder="Minimum 8 caractères" 
                    className="input-field"
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirmer le mot de passe</label>
                  <input 
                    type="password" 
                    required 
                    placeholder="Confirmer le mot de passe" 
                    className="input-field"
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                  />
                </div>
                {error && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                    {error}
                  </div>
                )}
                <button type="submit" disabled={loading} className="btn-gold w-full py-4">
                  {loading ? "Création..." : "Créer mon mot de passe"}
                </button>
              </form>
              <p className="mt-6 text-center">
                <button type="button" onClick={() => { setMode("magic"); setError(""); }}
                  className="text-[#FEBD17] hover:underline text-sm font-medium flex items-center justify-center gap-2 mx-auto">
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                  Retour à la connexion
                </button>
              </p>
            </div>
          )}

          {/* Séparateur + option créer compte */}
          {(mode === "magic" || mode === "password") && (
            <div className="mt-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-gray-400 text-sm">ou</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <button
                type="button"
                onClick={() => { setMode("set-password"); setError(""); }}
                className="w-full py-3.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-medium hover:border-[#FEBD17] hover:text-[#FEBD17] transition-all"
              >
                Créer / modifier mon mot de passe
              </button>
            </div>
          )}

          <p className="mt-10 text-center text-sm text-gray-400">
            <a href="https://renoviapro.fr" className="hover:text-[#FEBD17] transition">renoviapro.fr</a>
          </p>
        </div>
      </div>
    </div>
  );
}

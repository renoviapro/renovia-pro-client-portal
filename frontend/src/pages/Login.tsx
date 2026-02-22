import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = (import.meta as unknown as { env: { VITE_API_URL?: string } }).env?.VITE_API_URL ?? "";

type Mode = "magic" | "password" | "set-password";

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
      if (!res.ok) {
        setError(data.detail || "Erreur de connexion");
        setLoading(false);
        return;
      }
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      navigate("/dashboard", { replace: true });
    } catch {
      setError("Erreur réseau");
    }
    setLoading(false);
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Le mot de passe doit faire au moins 8 caractères.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/auth/set-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || "Erreur");
        setLoading(false);
        return;
      }
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      navigate("/dashboard", { replace: true });
    } catch {
      setError("Erreur réseau");
    }
    setLoading(false);
  };

  const inputClass =
    "w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-[#FEBD17] focus:outline-none focus:ring-1 focus:ring-[#FEBD17]";
  const btnClass = "btn-gold w-full";

  if (sent && mode === "magic") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-[#0d0d0d]">
        <div className="max-w-md w-full text-center">
          <img src="/logo.png" alt="Renovia Pro" className="h-[100px] w-auto mx-auto mb-6 object-contain" />
          <h2 className="text-xl font-semibold text-white">Vérifiez votre boîte mail</h2>
          <p className="mt-3 text-white/70">
            Si un compte existe, vous recevrez un lien de connexion (valable 15 min).
          </p>
          <button
            onClick={() => {
              setSent(false);
              setEmail("");
            }}
            className="mt-6 text-[#FEBD17] hover:underline"
          >
            Utiliser une autre adresse
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#0d0d0d]">
      <div className="w-full max-w-md">
        <img src="/logo.png" alt="Renovia Pro" className="h-14 w-auto mx-auto mb-6 object-contain" />
        <h1 className="text-2xl font-semibold text-white text-center" style={{ fontFamily: "'Black Ops One', sans-serif" }}>Espace client Renovia Pro</h1>

        {mode === "set-password" ? (
          <>
            <p className="mt-2 text-white/60 text-center text-sm">Créer un mot de passe (min. 8 caractères)</p>
            <form onSubmit={handleSetPassword} className="mt-8 flex flex-col gap-4">
              <input
                type="email"
                required
                placeholder="votre@email.fr"
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="password"
                required
                minLength={8}
                placeholder="Mot de passe"
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <input
                type="password"
                required
                placeholder="Confirmer le mot de passe"
                className={inputClass}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button type="submit" disabled={loading} className={btnClass}>
                {loading ? "Création..." : "Créer mon mot de passe et me connecter"}
              </button>
            </form>
            <p className="mt-4 text-center text-sm text-white/50">
              <button type="button" onClick={() => setMode("magic")} className="text-[#FEBD17] hover:underline">
                Retour à la connexion
              </button>
            </p>
          </>
        ) : (
          <>
            <div className="flex mt-6 rounded-lg bg-white/5 p-1">
              <button
                type="button"
                onClick={() => setMode("magic")}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${mode === "magic" ? "bg-[#FEBD17] text-black" : "text-white/70 hover:text-white"}`}
              >
                Lien magique
              </button>
              <button
                type="button"
                onClick={() => setMode("password")}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${mode === "password" ? "bg-[#FEBD17] text-black" : "text-white/70 hover:text-white"}`}
              >
                Mot de passe
              </button>
            </div>

            {mode === "magic" && (
              <form onSubmit={handleMagicSubmit} className="mt-6 flex flex-col gap-4">
                <input
                  type="email"
                  required
                  placeholder="votre@email.fr"
                  className={inputClass}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button type="submit" disabled={loading} className={btnClass}>
                  {loading ? "Envoi..." : "Recevoir le lien de connexion"}
                </button>
              </form>
            )}

            {mode === "password" && (
              <form onSubmit={handlePasswordLogin} className="mt-6 flex flex-col gap-4">
                <input
                  type="email"
                  required
                  placeholder="votre@email.fr"
                  className={inputClass}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <input
                  type="password"
                  required
                  placeholder="Mot de passe"
                  className={inputClass}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <button type="submit" disabled={loading} className={btnClass}>
                  {loading ? "Connexion..." : "Se connecter"}
                </button>
              </form>
            )}

            <p className="mt-6 text-center text-sm text-white/50">
              Pas encore de mot de passe ?{" "}
              <button type="button" onClick={() => setMode("set-password")} className="text-[#FEBD17] hover:underline">
                Créer un mot de passe
              </button>
            </p>
          </>
        )}

        <p className="mt-8 text-center text-sm text-white/40">
          <a href="https://renoviapro.fr" className="text-[#FEBD17] no-underline hover:underline">
            renoviapro.fr
          </a>
        </p>
      </div>
    </div>
  );
}

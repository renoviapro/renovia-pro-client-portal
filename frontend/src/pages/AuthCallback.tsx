import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const API = (import.meta as unknown as { env: { VITE_API_URL?: string } }).env?.VITE_API_URL ?? "";

export default function AuthCallback() {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const token = search.get("token");
    if (!token) { setError("Lien invalide"); return; }

    fetch(`${API}/api/v1/auth/verify?token=${encodeURIComponent(token)}`, { method: "POST" })
      .then(res => res.json())
      .then(data => {
        if (data.access_token) {
          localStorage.setItem("access_token", data.access_token);
          if (data.refresh_token) localStorage.setItem("refresh_token", data.refresh_token);
          if (data.is_new_user) {
            navigate("/welcome", { replace: true });
          } else {
            navigate("/dashboard", { replace: true });
          }
        } else {
          setError(data.detail || "Lien expiré ou déjà utilisé");
        }
      })
      .catch(() => setError("Erreur de connexion"));
  }, [search, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-[#0d0d0d]">
        <div className="text-center bg-[#161616] rounded-2xl p-8 border border-white/5 max-w-sm w-full">
          <div className="text-red-400 text-4xl mb-4">⚠</div>
          <p className="text-white font-semibold mb-2">Lien invalide</p>
          <p className="text-white/40 text-sm mb-6">{error}</p>
          <a href="/login" className="btn-gold">Retour à la connexion</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0d0d0d]">
      <img src="/logo.png" alt="Renovia Pro" className="h-20 w-20 object-contain mb-6 animate-pulse" />
      <p className="text-white/50 text-sm">Connexion en cours…</p>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const API = (import.meta as unknown as { env: { VITE_API_URL?: string } }).env?.VITE_API_URL ?? "";

export default function AuthCallback() {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const token = search.get("token");
    if (!token) {
      setError("Lien invalide");
      return;
    }
    fetch(`${API}/api/v1/auth/verify?token=${encodeURIComponent(token)}`, { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (data.access_token) {
          localStorage.setItem("access_token", data.access_token);
          if (data.refresh_token) localStorage.setItem("refresh_token", data.refresh_token);
          navigate("/dashboard", { replace: true });
        } else {
          setError(data.detail || "Lien expiré ou déjà utilisé");
        }
      })
      .catch(() => setError("Erreur de connexion"));
  }, [search, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-[#0d0d0d]">
        <div className="text-center">
          <p className="text-red-400">{error}</p>
          <a href="/login" className="mt-4 inline-block text-[#febd17]">Retour à la connexion</a>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0d0d]">
      <p className="text-white/70">Connexion en cours...</p>
    </div>
  );
}

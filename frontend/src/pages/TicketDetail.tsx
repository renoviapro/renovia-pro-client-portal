import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";

type Message = { body: string; from_client: boolean; created_at?: string };
type Ticket = { subject: string; description: string; status: string; created_at: string; messages?: Message[] };

const statusConfig: Record<string, { label: string; color: string }> = {
  ouvert: { label: "Ouvert", color: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
  "en cours": { label: "En cours", color: "bg-[#FEBD17]/15 text-[#FEBD17] border-[#FEBD17]/20" },
  résolu: { label: "Résolu", color: "bg-green-500/15 text-green-400 border-green-500/20" },
  fermé: { label: "Fermé", color: "bg-white/5 text-white/40 border-white/10" },
};

export default function TicketDetail() {
  const { id } = useParams();
  const [data, setData] = useState<Ticket | null>(null);

  useEffect(() => {
    if (!id) return;
    api<Record<string, unknown>>(`/api/v1/tickets/${id}`).then(r => setData(r as unknown as Ticket));
  }, [id]);

  if (!data) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-[#FEBD17] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statusCfg = statusConfig[data.status?.toLowerCase()] ?? { label: data.status, color: "bg-white/5 text-white/40 border-white/10" };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/tickets" className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors no-underline">
          <svg width="16" height="16" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="15,18 9,12 15,6"/>
          </svg>
        </Link>
        <span className="text-white/40 text-sm no-underline">Tickets SAV</span>
      </div>

      {/* Header ticket */}
      <div className="bg-[#161616] rounded-2xl border border-white/5 p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <h2 className="text-xl font-bold text-white">{data.subject}</h2>
          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium shrink-0 ${statusCfg.color}`}>
            {statusCfg.label}
          </span>
        </div>
        <p className="text-white/30 text-xs mb-5">Créé le {data.created_at?.slice(0, 10)}</p>
        <div className="bg-black/30 rounded-xl p-4 border border-white/5">
          <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap">{data.description}</p>
        </div>
      </div>

      {/* Messages */}
      {data.messages && data.messages.length > 0 && (
        <div className="space-y-3">
          <p className="text-white/40 text-xs uppercase tracking-wider">Échanges</p>
          {data.messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.from_client ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                m.from_client
                  ? "bg-[#FEBD17]/15 border border-[#FEBD17]/20 text-white"
                  : "bg-[#161616] border border-white/5 text-white/70"
              }`}>
                <p className={`text-xs mb-2 font-medium ${m.from_client ? "text-[#FEBD17]" : "text-white/30"}`}>
                  {m.from_client ? "Vous" : "Renovia Pro"}
                </p>
                {m.body}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Statut final */}
      {(data.status === "résolu" || data.status === "fermé") ? (
        <div className="flex items-center gap-3 bg-green-500/5 border border-green-500/15 rounded-xl p-4">
          <svg width="18" height="18" fill="none" stroke="#4ade80" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/><polyline points="9,12 11,14 15,10"/>
          </svg>
          <p className="text-white/60 text-sm">Ce ticket est clôturé. Créez un nouveau ticket si nécessaire.</p>
        </div>
      ) : (
        <div className="flex items-center gap-3 bg-[#161616] border border-white/5 rounded-xl p-4">
          <svg width="18" height="18" fill="none" stroke="#FEBD17" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p className="text-white/60 text-sm">Notre équipe traitera votre demande sous 24–48h ouvrées.</p>
        </div>
      )}
    </div>
  );
}

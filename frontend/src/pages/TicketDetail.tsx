import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";

export default function TicketDetail() {
  const { id } = useParams();
  const [data, setData] = useState<{ subject: string; description: string; status: string; created_at: string; messages?: { body: string; from_client: boolean }[] } | null>(null);
  useEffect(() => {
    if (!id) return;
    api<Record<string, unknown>>(`/api/v1/tickets/${id}`).then((r) => setData(r as typeof data));
  }, [id]);
  if (!data) return <p className="text-white/70">Chargement...</p>;
  return (
    <div>
      <Link to="/tickets" className="text-[#febd17] text-sm no-underline">← Tickets SAV</Link>
      <h1 className="mt-4 text-2xl font-semibold text-white">{data.subject}</h1>
      <p className="text-white/50 text-sm">{data.status} — {data.created_at?.slice(0, 10)}</p>
      <div className="mt-6 rounded-xl border border-white/20 bg-white/5 p-4">
        <p className="text-white/80 whitespace-pre-wrap">{data.description}</p>
      </div>
      {data.messages && data.messages.length > 0 && (
        <div className="mt-6 space-y-3">
          <h2 className="font-medium text-white">Messages</h2>
          {data.messages.map((m, i) => (
            <div key={i} className="rounded-lg bg-white/5 p-3 text-sm text-white/80">{m.body}</div>
          ))}
        </div>
      )}
    </div>
  );
}

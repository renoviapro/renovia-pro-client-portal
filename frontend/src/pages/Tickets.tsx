import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

export default function Tickets() {
  const [items, setItems] = useState<{ id: string; subject: string; status: string; created_at: string }[]>([]);
  useEffect(() => {
    api<{ items: typeof items }>("/api/v1/tickets").then((r) => setItems(r.items));
  }, []);
  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Tickets SAV</h1>
      <p className="mt-2 text-white/60 text-sm">Créer un ticket, suivre le statut. Diagnostic SAV 49€ — offert si pris en charge, déduit si devis accepté.</p>
      <Link to="/tickets/new" className="mt-6 inline-block rounded-lg bg-[#FEBD17] px-8 py-3 font-semibold text-black no-underline hover:bg-[#FEC01F] transition-colors">
        Créer un ticket SAV
      </Link>
      <div className="mt-8 space-y-4">
        {items.length === 0 && <p className="text-white/50">Aucun ticket.</p>}
        {items.map((t) => (
          <Link key={t.id} to={`/tickets/${t.id}`} className="block rounded-xl border border-white/20 bg-white/5 p-4 no-underline hover:border-[#FEBD17]/40 transition-colors">
            <span className="font-medium text-white">{t.subject}</span>
            <p className="text-sm text-white/50">{t.status} — {t.created_at?.slice(0, 10)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

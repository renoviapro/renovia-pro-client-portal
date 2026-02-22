import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function Documents() {
  const [items, setItems] = useState<{ id: string; type: string; label: string; date: string }[]>([]);
  useEffect(() => {
    api<{ items: typeof items }>("/api/v1/documents").then((r) => setItems(r.items));
  }, []);
  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Documents</h1>
      <p className="mt-2 text-white/60 text-sm">Devis et factures téléchargeables.</p>
      <div className="mt-8 space-y-3">
        {items.length === 0 && <p className="text-white/50">Aucun document.</p>}
        {items.map((d) => (
          <div key={d.id} className="rounded-xl border border-white/20 bg-white/5 p-4 flex justify-between items-center">
            <span className="text-white">{d.label}</span>
            <span className="text-sm text-white/50">{d.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

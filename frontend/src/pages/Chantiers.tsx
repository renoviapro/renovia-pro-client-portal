import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

export default function Chantiers() {
  const [items, setItems] = useState<{ id: string; label: string; status: string; address: string }[]>([]);
  useEffect(() => {
    api<{ items: typeof items }>("/api/v1/chantiers").then((r) => setItems(r.items));
  }, []);
  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Mes chantiers</h1>
      <p className="mt-2 text-white/60 text-sm">Liste et statut. Détails et photos avant/après.</p>
      <div className="mt-8 space-y-4">
        {items.length === 0 && <p className="text-white/50">Aucun chantier.</p>}
        {items.map((c) => (
          <Link key={c.id} to={`/chantiers/${c.id}`} className="block rounded-xl border border-white/20 bg-white/5 p-4 no-underline hover:border-[#febd17]/50">
            <span className="font-medium text-white">{c.label}</span>
            <p className="text-sm text-white/50">{c.status} — {c.address}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

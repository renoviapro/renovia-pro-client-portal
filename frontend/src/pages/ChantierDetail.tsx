import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";

export default function ChantierDetail() {
  const { id } = useParams();
  const [data, setData] = useState<{ label: string; status: string; address: string; photos_avant?: string[]; photos_apres?: string[] } | null>(null);
  useEffect(() => {
    if (!id) return;
    api<Record<string, unknown>>(`/api/v1/chantiers/${id}`).then((r) => setData(r as typeof data));
  }, [id]);
  if (!data) return <p className="text-white/70">Chargement...</p>;
  return (
    <div>
      <Link to="/chantiers" className="text-[#febd17] text-sm no-underline">← Mes chantiers</Link>
      <h1 className="mt-4 text-2xl font-semibold text-white">{data.label}</h1>
      <p className="text-white/60">{data.status} — {data.address}</p>
      <p className="mt-6 text-white/50">Photos avant/après : à venir.</p>
    </div>
  );
}

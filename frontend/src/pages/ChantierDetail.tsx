import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";

type Chantier = { label: string; status: string; address: string; photos_avant?: string[]; photos_apres?: string[] };

const statusColor: Record<string, string> = {
  "en cours": "bg-[#FEBD17]/15 text-[#FEBD17] border-[#FEBD17]/20",
  terminé: "bg-green-500/15 text-green-400 border-green-500/20",
  planifié: "bg-blue-500/15 text-blue-400 border-blue-500/20",
};

export default function ChantierDetail() {
  const { id } = useParams();
  const [data, setData] = useState<Chantier | null>(null);

  useEffect(() => {
    if (!id) return;
    api<Record<string, unknown>>(`/api/v1/chantiers/${id}`).then(r => setData(r as unknown as Chantier));
  }, [id]);

  if (!data) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-[#FEBD17] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const color = statusColor[data.status?.toLowerCase()] ?? "bg-white/5 text-white/40 border-white/10";

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/chantiers" className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors no-underline">
          <svg width="16" height="16" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="15,18 9,12 15,6"/>
          </svg>
        </Link>
        <span className="text-white/40 text-sm">Mes chantiers</span>
      </div>

      <div className="bg-[#161616] rounded-2xl border border-white/5 p-6">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h2 className="text-xl font-bold text-white">{data.label}</h2>
          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium shrink-0 ${color}`}>{data.status}</span>
        </div>
        <div className="flex items-center gap-2 text-white/40 text-sm">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          {data.address}
        </div>
      </div>

      {/* Photos avant/après */}
      {data.photos_avant && data.photos_avant.length > 0 && (
        <div>
          <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Photos avant travaux</p>
          <div className="grid grid-cols-2 gap-3">
            {data.photos_avant.map((url, i) => (
              <img key={i} src={url} alt="Avant" className="rounded-xl object-cover w-full h-40 bg-white/5" />
            ))}
          </div>
        </div>
      )}

      {data.photos_apres && data.photos_apres.length > 0 && (
        <div>
          <p className="text-white/40 text-xs uppercase tracking-wider mb-3">Photos après travaux</p>
          <div className="grid grid-cols-2 gap-3">
            {data.photos_apres.map((url, i) => (
              <img key={i} src={url} alt="Après" className="rounded-xl object-cover w-full h-40 bg-white/5" />
            ))}
          </div>
        </div>
      )}

      {(!data.photos_avant || data.photos_avant.length === 0) && (!data.photos_apres || data.photos_apres.length === 0) && (
        <div className="text-center py-10 bg-[#161616] rounded-2xl border border-white/5">
          <svg width="36" height="36" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" viewBox="0 0 24 24" className="mx-auto mb-3">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21,15 16,10 5,21"/>
          </svg>
          <p className="text-white/30 text-sm">Les photos seront disponibles prochainement</p>
        </div>
      )}
    </div>
  );
}

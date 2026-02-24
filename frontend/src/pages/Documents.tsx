import { useEffect, useState } from "react";
import { api, getToken } from "../lib/api";

type Doc = {
  id: string; type: string; label: string; date: string;
  url?: string; status?: string; source?: string;
  actions?: string[]; total_ttc?: number;
  sign_url?: string; pay_url?: string;
};

type TabType = "all" | "devis" | "factures" | "maintenance";

const CACHE_KEY = "docs_cache";
const CACHE_TTL = 5 * 60 * 1000;

const statusColors: Record<string, string> = {
  "Payé": "bg-green-500/15 text-green-400 border-green-500/20",
  "Payée": "bg-green-500/15 text-green-400 border-green-500/20",
  "Accepté": "bg-green-500/15 text-green-400 border-green-500/20",
  "Envoyé": "bg-blue-500/15 text-blue-400 border-blue-500/20",
  "En attente": "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  "Refusé": "bg-red-500/15 text-red-400 border-red-500/20",
};

function DocumentCard({ doc: d, openPreview }: { doc: Doc; openPreview: (d: Doc) => void }) {
  const isMaintenance = d.source === "maintenance";
  const statusColor = statusColors[d.status || ""] || "bg-white/5 text-white/40 border-white/10";
  
  return (
    <div className={`group relative bg-[#161616] border rounded-2xl p-5 transition-all hover:border-white/20 ${
      isMaintenance ? "border-[#FEBD17]/20" : "border-white/5"
    }`}>
      {/* Badge source */}
      {isMaintenance && (
        <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-[#FEBD17]/20 border border-[#FEBD17]/30 text-[#FEBD17] text-[10px] font-bold uppercase tracking-wider">
          Maintenance
        </div>
      )}
      
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Type badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
              d.type?.toLowerCase() === "devis" 
                ? "bg-blue-500/10 text-blue-400" 
                : "bg-emerald-500/10 text-emerald-400"
            }`}>
              {d.type}
            </span>
            {d.status && (
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${statusColor}`}>
                {d.status}
              </span>
            )}
          </div>
          
          {/* Label */}
          <p className="text-white font-semibold text-sm leading-tight mb-1 line-clamp-2">{d.label}</p>
          
          {/* Meta */}
          <div className="flex items-center gap-3 text-xs text-white/40">
            <span className="flex items-center gap-1">
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              {new Date(d.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
            </span>
            {d.total_ttc != null && (
              <span className="font-semibold text-white/60">
                {d.total_ttc.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
        {/* Signer */}
        {d.actions?.includes("sign") && d.sign_url && (
          <a
            href={d.sign_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#FEBD17] text-black text-xs font-bold hover:bg-[#ffd04d] transition-colors no-underline"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
            </svg>
            Signer le devis
          </a>
        )}

        {/* Payer */}
        {d.actions?.includes("pay") && d.pay_url && (
          <a
            href={d.pay_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500/15 border border-green-500/25 text-green-400 text-xs font-bold hover:bg-green-500/25 transition-colors no-underline"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
            Payer
          </a>
        )}

        {/* Aperçu */}
        {d.url && (
          <button
            onClick={() => openPreview(d)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-medium transition-colors"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            Voir
          </button>
        )}

        {/* Si pas d'actions, bouton voir seul prend toute la place */}
        {!d.actions?.includes("sign") && !d.actions?.includes("pay") && !d.url && (
          <span className="text-white/20 text-xs">Aucune action disponible</span>
        )}
      </div>
    </div>
  );
}

function readCache(): Doc[] | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) { sessionStorage.removeItem(CACHE_KEY); return null; }
    return data;
  } catch { return null; }
}
function writeCache(data: Doc[]) {
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data })); } catch {}
}

export default function Documents() {
  const [items, setItems] = useState<Doc[]>(() => readCache() ?? []);
  const [loading, setLoading] = useState(!readCache());
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("all");

  const fetchDocs = (force = false) => {
    if (!force) {
      const cached = readCache();
      if (cached) { setItems(cached); setLoading(false); return; }
    }
    setRefreshing(true);
    api<{ items: Doc[] }>("/api/v1/documents")
      .then(r => { setItems(r.items); writeCache(r.items); })
      .finally(() => { setLoading(false); setRefreshing(false); });
  };

  useEffect(() => { fetchDocs(); }, []);

  const openPreview = async (doc: Doc) => {
    if (!doc.url) return;
    const res = await fetch(doc.url, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!res.ok) { alert("Document introuvable."); return; }
    const html = await res.text();
    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); }
  };

  // Filtrage et comptage
  const devis = items.filter(d => d.type?.toLowerCase() === "devis" && d.source !== "maintenance");
  const factures = items.filter(d => d.type?.toLowerCase() === "facture" && d.source !== "maintenance");
  const maintenance = items.filter(d => d.source === "maintenance");
  
  const filteredItems = activeTab === "all" 
    ? items 
    : activeTab === "devis" 
      ? devis 
      : activeTab === "factures" 
        ? factures 
        : maintenance;

  const sortedItems = [...filteredItems].sort((a, b) => b.date.localeCompare(a.date));

  const tabs: { id: TabType; label: string; count: number; icon: React.ReactNode }[] = [
    { 
      id: "all", 
      label: "Tout", 
      count: items.length,
      icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
    },
    { 
      id: "devis", 
      label: "Devis", 
      count: devis.length,
      icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
    },
    { 
      id: "factures", 
      label: "Factures", 
      count: factures.length,
      icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
    },
    { 
      id: "maintenance", 
      label: "Maintenance", 
      count: maintenance.length,
      icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Documents</h2>
          <p className="text-white/40 text-sm mt-1">Vos devis, factures et documents de maintenance.</p>
        </div>
        <button
          onClick={() => fetchDocs(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-white/60 hover:text-white transition-all disabled:opacity-40"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
            className={refreshing ? "animate-spin" : ""}>
            <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          {refreshing ? "Chargement…" : "Actualiser"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-[#0d0d0d] rounded-2xl overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? tab.id === "maintenance"
                  ? "bg-[#FEBD17]/20 text-[#FEBD17] border border-[#FEBD17]/30"
                  : "bg-white/10 text-white border border-white/10"
                : "text-white/40 hover:text-white/70 hover:bg-white/5 border border-transparent"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeTab === tab.id 
                ? tab.id === "maintenance" ? "bg-[#FEBD17]/30" : "bg-white/20" 
                : "bg-white/10"
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-40 bg-white/3 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && sortedItems.length === 0 && (
        <div className="text-center py-16 bg-[#161616] rounded-2xl border border-white/5">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
            <svg width="28" height="28" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
            </svg>
          </div>
          <p className="text-white/50 text-sm font-medium">
            {activeTab === "all" ? "Aucun document disponible" : `Aucun ${activeTab === "devis" ? "devis" : activeTab === "factures" ? "facture" : "document de maintenance"}`}
          </p>
          <p className="text-white/30 text-xs mt-2">
            {activeTab === "all" 
              ? "Vos devis et factures apparaîtront ici." 
              : "Changez d'onglet pour voir d'autres documents."}
          </p>
        </div>
      )}

      {/* Documents grid */}
      {!loading && sortedItems.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {sortedItems.map(d => (
            <DocumentCard key={d.id} doc={d} openPreview={openPreview} />
          ))}
        </div>
      )}

      {/* Stats footer */}
      {!loading && items.length > 0 && (
        <div className="flex items-center justify-center gap-6 pt-4 border-t border-white/5 text-xs text-white/30">
          <span>{devis.length} devis</span>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <span>{factures.length} factures</span>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <span>{maintenance.length} maintenance</span>
        </div>
      )}
    </div>
  );
}

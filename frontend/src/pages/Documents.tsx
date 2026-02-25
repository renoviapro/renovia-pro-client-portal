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

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  "Payé": { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  "Payée": { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  "Accepté": { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  "Envoyé": { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  "En attente": { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  "Refusé": { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
};

function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  const config = statusConfig[status] || { bg: "bg-gray-50", text: "text-gray-600", dot: "bg-gray-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {status}
    </span>
  );
}

function DocumentCard({ doc: d, openPreview }: { doc: Doc; openPreview: (d: Doc) => void }) {
  const isMaintenance = d.source === "maintenance";
  const isDevis = d.type?.toLowerCase() === "devis";
  
  return (
    <div className={`card group overflow-hidden transition-all duration-300 hover:shadow-lg ${
      isMaintenance ? "border-[#FEBD17]/30" : ""
    }`}>
      {/* Header badge */}
      {isMaintenance && (
        <div className="bg-gradient-to-r from-[#FEBD17]/15 to-transparent px-5 py-2.5 flex items-center gap-2 border-b border-[#FEBD17]/10">
          <svg width="14" height="14" fill="none" stroke="#FEBD17" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
          <span className="text-[#D9A200] text-xs font-semibold">Contrat Maintenance</span>
        </div>
      )}
      
      <div className="p-6">
        {/* Type + Status */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg ${
            isMaintenance
              ? "bg-[#FEBD17]/10 text-[#D9A200]"
              : isDevis 
                ? "bg-blue-100 text-blue-700" 
                : "bg-emerald-100 text-emerald-700"
          }`}>
            {d.type}
          </span>
          <StatusBadge status={d.status} />
        </div>
        
        {/* Label */}
        <h3 className="text-gray-900 font-semibold text-base leading-snug mb-3 line-clamp-2 group-hover:text-gray-700 transition-colors">
          {d.label}
        </h3>
        
        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-5">
          <span className="flex items-center gap-1.5">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {new Date(d.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
          </span>
          {d.total_ttc != null && (
            <span className={`font-semibold ${isMaintenance ? "text-[#D9A200]" : "text-gray-900"}`}>
              {d.total_ttc.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
            </span>
          )}
        </div>
      
        {/* Actions */}
        <div className="flex items-center gap-3 pt-5 border-t border-gray-100">
          {/* Signer */}
          {d.actions?.includes("sign") && d.sign_url && (
            <a
              href={d.sign_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#FEBD17] to-[#E6AA00] text-black text-sm font-semibold hover:shadow-lg hover:shadow-[#FEBD17]/30 transition-all no-underline"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              </svg>
              Signer
            </a>
          )}

          {/* Payer */}
          {d.actions?.includes("pay") && d.pay_url && (
            <a
              href={d.pay_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/30 transition-all no-underline"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <rect x="1" y="4" width="22" height="16" rx="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
              Payer
            </a>
          )}

          {/* Aperçu */}
          {d.url && (
            <button
              onClick={() => openPreview(d)}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-all ${
                !d.actions?.includes("sign") && !d.actions?.includes("pay") ? "flex-1" : "px-5"
              }`}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Voir
            </button>
          )}

          {!d.actions?.includes("sign") && !d.actions?.includes("pay") && !d.url && (
            <span className="text-gray-400 text-sm">Aucune action disponible</span>
          )}
        </div>
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
    
    const contentType = res.headers.get("content-type") || "";
    
    if (contentType.includes("application/pdf")) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } else {
      const html = await res.text();
      const win = window.open("", "_blank");
      if (win) { win.document.write(html); win.document.close(); }
    }
  };

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

  const tabs: { id: TabType; label: string; count: number; color?: string }[] = [
    { id: "all", label: "Tous", count: items.length },
    { id: "devis", label: "Devis", count: devis.length },
    { id: "factures", label: "Factures", count: factures.length },
    { id: "maintenance", label: "Maintenance", count: maintenance.length, color: "gold" },
  ];

  return (
    <div className="space-y-8 fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes documents</h1>
          <p className="text-gray-500 text-sm mt-1">Consultez et gérez vos devis, factures et documents de maintenance.</p>
        </div>
        <button
          onClick={() => fetchDocs(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:border-gray-300 text-sm font-medium text-gray-700 transition-all disabled:opacity-50 shadow-sm"
        >
          <svg 
            width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
            className={refreshing ? "animate-spin" : ""}
          >
            <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          {refreshing ? "Actualisation..." : "Actualiser"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-gray-100 rounded-2xl overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? tab.color === "gold"
                  ? "bg-[#FEBD17] text-black shadow-sm"
                  : "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
            }`}
          >
            <span>{tab.label}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              activeTab === tab.id 
                ? tab.color === "gold" ? "bg-black/10" : "bg-gray-100" 
                : "bg-gray-200/80"
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="card p-6">
              <div className="h-5 w-20 bg-gray-100 rounded mb-4 animate-pulse" />
              <div className="h-5 w-full bg-gray-100 rounded mb-2 animate-pulse" />
              <div className="h-5 w-2/3 bg-gray-100 rounded mb-6 animate-pulse" />
              <div className="h-10 w-full bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && sortedItems.length === 0 && (
        <div className="card text-center py-16 px-6">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gray-100 flex items-center justify-center">
            <svg width="36" height="36" fill="none" stroke="#9CA3AF" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14,2 14,8 20,8" />
            </svg>
          </div>
          <h3 className="text-gray-900 font-semibold text-lg mb-2">
            {activeTab === "all" ? "Aucun document" : `Aucun ${activeTab === "devis" ? "devis" : activeTab === "factures" ? "facture" : "document de maintenance"}`}
          </h3>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">
            {activeTab === "all" 
              ? "Vos devis et factures apparaîtront ici dès qu'ils seront disponibles." 
              : "Changez d'onglet pour voir d'autres documents."}
          </p>
        </div>
      )}

      {/* Documents grid */}
      {!loading && sortedItems.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sortedItems.map(d => (
            <DocumentCard key={d.id} doc={d} openPreview={openPreview} />
          ))}
        </div>
      )}

      {/* Stats footer */}
      {!loading && items.length > 0 && (
        <div className="flex items-center justify-center gap-8 pt-6 border-t border-gray-100 text-sm text-gray-400">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            {devis.length} devis
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            {factures.length} factures
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FEBD17]" />
            {maintenance.length} maintenance
          </span>
        </div>
      )}
    </div>
  );
}

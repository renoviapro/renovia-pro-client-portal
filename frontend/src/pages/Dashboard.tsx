import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Tableau de bord</h1>
      <p className="mt-2 text-white/60 text-sm">Chantiers récents, documents, actions rapides.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link to="/tickets/new" className="block rounded-xl border border-white/20 bg-white/5 p-6 no-underline transition-colors hover:border-[#FEBD17]/50 hover:bg-white/[0.07]">
          <span className="font-medium text-white">Créer un ticket SAV</span>
          <p className="mt-1 text-sm text-white/50">Diagnostic SAV 49€ — offert si pris en charge, déduit si devis accepté. Réponse 24–48h ouvrées.</p>
        </Link>
        <a href="https://depannage.renoviapro.fr" target="_blank" rel="noopener noreferrer" className="block rounded-xl border border-white/20 bg-white/5 p-6 no-underline transition-colors hover:border-[#FEBD17]/50 hover:bg-white/[0.07]">
          <span className="font-medium text-white">Demander une intervention dépannage</span>
          <p className="mt-1 text-sm text-white/50">Dépannage & petits travaux à Nice.</p>
        </a>
        <Link to="/chantiers" className="block rounded-xl border border-white/20 bg-white/5 p-6 no-underline transition-colors hover:border-[#FEBD17]/50 hover:bg-white/[0.07]">
          <span className="font-medium text-white">Mes chantiers</span>
          <p className="mt-1 text-sm text-white/50">Liste et statuts.</p>
        </Link>
      </div>
      <div className="mt-10 rounded-xl border border-white/20 bg-white/5 p-6 border-l-4 border-l-[#FEBD17]">
        <h2 className="font-medium text-white">Chantiers récents</h2>
        <p className="mt-2 text-sm text-white/50">Aucun chantier.</p>
      </div>
      <div className="mt-6 rounded-xl border border-white/20 bg-white/5 p-6 border-l-4 border-l-[#FEBD17]">
        <h2 className="font-medium text-white">Documents récents</h2>
        <p className="mt-2 text-sm text-white/50">Aucun document.</p>
      </div>
    </div>
  );
}

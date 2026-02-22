import { useEffect, useState } from "react";
import { api } from "../lib/api";

export default function Maintenance() {
  const [contract, setContract] = useState<{ plan: string; next_renewal: string; factures?: { label: string; date: string }[] } | null>(null);
  useEffect(() => {
    api<{ contract: typeof contract }>("/api/v1/maintenance").then((r) => setContract(r.contract));
  }, []);
  return (
    <div>
      <h1 className="text-2xl font-semibold text-white">Maintenance</h1>
      <p className="mt-2 text-white/60 text-sm">Contrat actif, prochaines échéances, factures.</p>
      {!contract && <p className="mt-8 text-white/50">Aucun contrat actif.</p>}
      {contract && (
        <div className="mt-8 rounded-xl border border-white/20 bg-white/5 p-6">
          <h2 className="font-medium text-[#febd17]">{contract.plan}</h2>
          <p className="mt-2 text-white/70">Prochaine échéance : {contract.next_renewal}</p>
          {contract.factures && contract.factures.length > 0 && (
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              {contract.factures.map((f, i) => (
                <li key={i}>{f.label} — {f.date}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      <p className="mt-6 text-sm text-white/50">
        <a href="https://renoviapro.fr/maintenance" className="text-[#febd17] no-underline">Découvrir les packs sur renoviapro.fr</a>
      </p>
    </div>
  );
}

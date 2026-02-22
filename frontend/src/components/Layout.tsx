import { Outlet, NavLink, useNavigate } from "react-router-dom";

export default function Layout() {
  const navigate = useNavigate();
  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/login");
  };

  const links = [
    { to: "/dashboard", label: "Tableau de bord" },
    { to: "/chantiers", label: "Mes chantiers" },
    { to: "/documents", label: "Documents" },
    { to: "/tickets", label: "Tickets SAV" },
    { to: "/maintenance", label: "Maintenance" },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#0d0d0d]">
      <aside className="w-full md:w-56 border-b md:border-b-0 md:border-r border-white/10 bg-black/50 p-5">
        <a href="/dashboard" className="block mb-6">
          <img src="/logo.png" alt="Renovia Pro" className="h-[80px] w-auto object-contain" />
        </a>
        <nav className="flex flex-wrap gap-2 md:flex-col md:gap-0">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                "block py-2.5 px-3 rounded no-underline text-sm font-medium transition-colors " +
                (isActive ? "bg-[#FEBD17] text-black" : "text-white/80 hover:text-[#FEBD17] hover:bg-white/5")
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={logout}
          className="mt-6 text-sm text-white/50 hover:text-[#FEBD17] transition-colors"
        >
          Déconnexion
        </button>
      </aside>
      <main className="flex-1 p-6 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}

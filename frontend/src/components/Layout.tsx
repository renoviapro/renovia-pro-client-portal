import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { getToken } from "../lib/api";

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
      <aside className="w-full md:w-56 border-b md:border-b-0 md:border-r border-white/10 bg-black/40 p-4">
        <div className="font-semibold text-[#febd17] mb-6">Renovia Pro</div>
        <nav className="flex flex-wrap gap-2 md:flex-col md:gap-0">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                "block py-2 px-3 rounded no-underline " +
                (isActive ? "bg-[#febd17] text-black" : "text-white/80 hover:text-[#febd17]")
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <button onClick={logout} className="mt-6 text-sm text-white/50 hover:text-white">
          Déconnexion
        </button>
      </aside>
      <div className="flex-1 p-6">
        <Outlet />
      </div>
    </div>
  );
}

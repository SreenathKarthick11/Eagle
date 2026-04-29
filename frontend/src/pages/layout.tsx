import { Outlet } from "react-router-dom";
import { Navbar } from "../components/navbar";

import "./styles/layout.css";

export const Layout = () => {
  return (
    <div className="layout_shell">
      <header className="layout_navbar">
        <Navbar />
      </header>

      <main className="layout_main">
        {/* Outlet renders the specific page (Home, Blacklist, etc.) */}
        <Outlet />
      </main>
    </div>
  );
};

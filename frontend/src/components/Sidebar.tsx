import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";

const navItems = [
  { to: "/", label: "Dashboard", icon: "📊" },
  { to: "/datos", label: "Datos", icon: "📋" },
  { to: "/predicciones", label: "Predicciones", icon: "🔮" },
  { to: "/modelos", label: "Modelos", icon: "🧠" },
  { to: "/resultados", label: "Resultados", icon: "📈" },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Handle ESC key to close sidebar on mobile
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Prevent background scroll when mobile sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const activeItem = navItems.find((item) =>
    item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to)
  );

  return (
    <>
      {/* Mobile Topbar */}
      <header className="mobile-topbar">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={isOpen}
        >
          <span className="hamburger-icon">{isOpen ? "✕" : "☰"}</span>
        </button>

        <div className="mobile-brand">
          <span className="mobile-logo-icon">📊</span>
          <div className="mobile-titles">
            <span className="mobile-title">Sistema de Predicciones</span>
            <span className="mobile-subtitle">
              {activeItem ? activeItem.label : "Sistema de Predicción"}
            </span>
          </div>
        </div>

        <div className="mobile-topbar-pill">Perú</div>
      </header>

      {/* Backdrop overlay for mobile */}
      <div
        className={`sidebar-backdrop ${isOpen ? "sidebar-backdrop--visible" : ""}`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Main Sidebar Drawer */}
      <aside className={`sidebar ${isOpen ? "sidebar--open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-title-wrapper">
            <h2>Sistema de Predicciones</h2>
            <span className="sidebar-subtitle">Predicción Epidemiológica</span>
          </div>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={() => setIsOpen(false)}
            aria-label="Cerrar menú lateral"
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `sidebar-link${isActive ? " sidebar-link--active" : ""}`
              }
              onClick={() => setIsOpen(false)}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className="sidebar-footer-text">Periodo: 2006 – 2024</span>
        </div>
      </aside>
    </>
  );
}


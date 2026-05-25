import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { scrollToSection } from "../utils/scroll";
import Icon from "./Icon";
import logo from "../assets/logo.png";
import { isAuthenticated, getUserRole, logout } from "../services/authService";
import { button3d, button3dSubtle } from "../utils/tailwindStyles";

const navLinks = [
  { label: "Home", icon: "home", to: "/" },
  { label: "Services", icon: "wrench", to: "/services" },
  { label: "How It Works", icon: "spark", to: "/#how-it-works" },
  { label: "Contact", icon: "phone", to: "/#contact" },
];

function ThemeIconButton({ darkMode, onToggleDarkMode }) {
  return (
    <button
      type="button"
      onClick={onToggleDarkMode}
      aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={darkMode}
      className={`grid h-11 w-11 place-items-center rounded-full border shadow-[0_14px_28px_rgba(79,70,229,0.18),inset_0_1px_0_rgba(255,255,255,0.8)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(79,70,229,0.24)] active:translate-y-1 ${
        darkMode
          ? "border-slate-700 bg-slate-900 text-white"
          : "border-indigo-100 bg-white text-indigo-600"
      }`}
    >
      <Icon name={darkMode ? "moon" : "sun"} className="h-5 w-5" />
    </button>
  );
}

function Navbar({ darkMode, onToggleDarkMode, onLoginClick, onRegisterClick }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const authenticated = isAuthenticated();
  const userRole = getUserRole();

  const handleAnchorRoute = (to) => {
    setIsMenuOpen(false);
    const [path, hash] = to.split("#");
    navigate(hash ? `${path || "/"}#${hash}` : path || "/");
    if (hash) {
      setTimeout(() => scrollToSection(hash), 0);
    }
  };

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    navigate('/', { replace: true });
  };

  const handleDashboard = () => {
    if (userRole === 'admin') navigate('/dashboard/admin');
    else if (userRole === 'service_provider') navigate('/dashboard/provider');
    else navigate('/dashboard/user');
  };

  const isActive = (to) => {
    const [path, hash] = to.split("#");
    if (hash) return location.pathname === path && location.hash === `#${hash}`;
    return location.pathname === path;
  };

  return (
    <header
      data-app-header
      className={`sticky top-0 z-50 border-b backdrop-blur-xl ${
        darkMode
          ? "border-white/10 bg-slate-950/90"
          : "border-white/60 bg-white/90"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <img
            src={logo}
            alt="LocalFixr logo"
            className="h-13 w-13 object-contain"
          />
          <div>
            <span
              className={`text-2xl font-black tracking-tight ${
                darkMode ? "text-white" : "text-slate-900"
              }`}
            >
              Local
            </span>
            <span className="text-2xl font-black tracking-tight text-indigo-500">
              Fixr
            </span>
          </div>
        </div>

        <nav className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <button
              key={link.label}
              type="button"
              onClick={() => handleAnchorRoute(link.to)}
              className={`${button3dSubtle} flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold hover:text-indigo-500 ${
                isActive(link.to)
                  ? darkMode
                    ? "bg-white/10 text-indigo-300"
                    : "bg-indigo-50 text-indigo-600"
                  : darkMode
                    ? "text-slate-200"
                    : "text-slate-700"
              }`}
            >
              <Icon name={link.icon} className="h-4 w-4 text-indigo-500" />
              {link.label}
            </button>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {authenticated ? (
            <>
              <button
                type="button"
                onClick={handleDashboard}
                className={`${button3dSubtle} rounded-xl border px-5 py-2.5 text-sm font-semibold ${
                  darkMode
                    ? "border-white/15 bg-white/5 text-indigo-200 hover:bg-white/10"
                    : "border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                }`}
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className={`${button3d} rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/25`}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onLoginClick}
                className={`${button3dSubtle} rounded-xl border px-5 py-2.5 text-sm font-semibold ${
                  darkMode
                    ? "border-white/15 bg-white/5 text-indigo-200 hover:bg-white/10"
                    : "border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={onRegisterClick}
                className={`${button3d} rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25`}
              >
                Register
              </button>
            </>
          )}
          <ThemeIconButton
            darkMode={darkMode}
            onToggleDarkMode={onToggleDarkMode}
          />
        </div>

        <button
          type="button"
          onClick={() => setIsMenuOpen((current) => !current)}
          className={`${button3dSubtle} flex h-11 w-11 items-center justify-center rounded-2xl border lg:hidden ${
            darkMode
              ? "border-white/15 bg-white/5 text-white"
              : "border-slate-200 text-slate-700"
          }`}
        >
          <Icon name={isMenuOpen ? "close" : "menu"} className="h-5 w-5" />
        </button>
      </div>

      {isMenuOpen && (
        <div
          className={`border-t px-4 py-4 lg:hidden ${
            darkMode
              ? "border-white/10 bg-slate-950"
              : "border-slate-100 bg-white"
          }`}
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-3">
            {navLinks.map((link) => (
              <button
                key={link.label}
                type="button"
                onClick={() => handleAnchorRoute(link.to)}
                className={`${button3dSubtle} flex items-center gap-2 rounded-2xl px-4 py-3 font-semibold hover:bg-slate-50 hover:text-indigo-500 ${
                  isActive(link.to)
                    ? darkMode
                      ? "bg-white/10 text-indigo-300"
                      : "bg-indigo-50 text-indigo-600"
                    : darkMode
                      ? "text-slate-200"
                      : "text-slate-700"
                }`}
              >
                <Icon name={link.icon} className="h-4 w-4 text-indigo-500" />
                {link.label}
              </button>
            ))}
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {authenticated ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleDashboard();
                    }}
                    className={`${button3dSubtle} rounded-2xl border px-5 py-3 font-semibold ${
                      darkMode
                        ? "border-white/15 bg-white/5 text-indigo-200"
                        : "border-indigo-200 text-indigo-600"
                    }`}
                  >
                    Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleLogout();
                    }}
                    className={`${button3d} rounded-2xl bg-gradient-to-r from-red-500 to-red-600 px-5 py-3 font-semibold text-white`}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onLoginClick();
                    }}
                    className={`${button3dSubtle} rounded-2xl border px-5 py-3 font-semibold ${
                      darkMode
                        ? "border-white/15 bg-white/5 text-indigo-200"
                        : "border-indigo-200 text-indigo-600"
                    }`}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onRegisterClick();
                    }}
                    className={`${button3d} rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-600 px-5 py-3 font-semibold text-white`}
                  >
                    Register
                  </button>
                </>
              )}
              <div className="flex justify-center sm:col-span-2">
                <ThemeIconButton
                  darkMode={darkMode}
                  onToggleDarkMode={onToggleDarkMode}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;

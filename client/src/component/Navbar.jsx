import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { scrollToSection } from "../utils/scroll";
import Icon from "./Icon";
import logo from "../assets/logo.png";
import { isAuthenticated, getUserRole, logout } from "../services/authService";

const navLinks = [
  { label: "Home", icon: "home", to: "/" },
  { label: "Services", icon: "wrench", to: "/#services" },
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
      className={`grid h-10 w-10 cursor-pointer place-items-center rounded-full border transition duration-200 hover:-translate-y-0.5 active:translate-y-0 ${
        darkMode
          ? "border-white/15 bg-white/8 text-slate-100 hover:bg-white/12"
          : "border-slate-200 bg-white text-indigo-600 shadow-sm hover:border-indigo-200 hover:bg-indigo-50"
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
    if (to === "/" && location.hash) return false;
    return location.pathname === path;
  };

  return (
    <header
      data-app-header
      className={`sticky top-0 z-50 border-b backdrop-blur-xl ${
        darkMode
          ? "border-white/10 bg-slate-950/92"
          : "border-slate-200/70 bg-white/92 shadow-sm"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6 lg:px-8">
        <button type="button" onClick={() => handleAnchorRoute('/')} className="inline-flex h-11 cursor-pointer items-center gap-2.5 rounded-lg pr-2">
          <img
            src={logo}
            alt="LocalFixr logo"
            className="h-9 w-9 shrink-0 object-contain"
          />
          <div className="flex items-baseline leading-none">
            <span
              className={`text-xl font-black tracking-tight ${
                darkMode ? "text-white" : "text-slate-900"
              }`}
            >
              Local
            </span>
            <span className="text-xl font-black tracking-tight text-indigo-500">
              Fixr
            </span>
          </div>
        </button>

        <nav className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <button
              key={link.label}
              type="button"
              onClick={() => handleAnchorRoute(link.to)}
              className={`relative inline-flex h-10 cursor-pointer items-center gap-2 text-sm font-bold transition duration-200 ${
                isActive(link.to)
                  ? darkMode
                    ? "text-indigo-200"
                    : "text-indigo-700"
                  : darkMode
                    ? "text-slate-300 hover:text-white"
                    : "text-slate-600 hover:text-slate-950"
              }`}
            >
              <Icon name={link.icon} className="h-4 w-4 text-indigo-500" />
              {link.label}
              {isActive(link.to) && (
                <span className="absolute -bottom-1 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-indigo-500" />
              )}
            </button>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {authenticated ? (
            <>
              <button
                type="button"
                onClick={handleDashboard}
                className={`inline-flex h-10 cursor-pointer items-center justify-center px-2 text-sm font-bold transition duration-200 ${
                  darkMode
                    ? "text-indigo-200 hover:text-white"
                    : "text-indigo-700 hover:text-indigo-900"
                }`}
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex h-10 cursor-pointer items-center justify-center px-2 text-sm font-bold text-red-600 transition duration-200 hover:text-red-700"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onLoginClick}
                className={`inline-flex h-10 cursor-pointer items-center justify-center px-2 text-sm font-bold transition duration-200 ${
                  darkMode
                    ? "text-indigo-200 hover:text-white"
                    : "text-indigo-700 hover:text-indigo-900"
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={onRegisterClick}
                className="inline-flex h-10 cursor-pointer items-center justify-center rounded-lg bg-indigo-600 px-5 text-sm font-bold text-white transition duration-200 hover:bg-indigo-700"
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

        <div className="flex items-center gap-2 lg:hidden">
          {!authenticated && (
            <button
              type="button"
              onClick={onLoginClick}
              className={`inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border px-3 text-sm font-bold transition duration-200 ${
                darkMode
                  ? "border-white/15 bg-white/8 text-indigo-100 hover:bg-white/12 hover:text-white"
                  : "border-indigo-200 bg-white text-indigo-700 shadow-sm hover:bg-indigo-50"
              }`}
            >
              Login
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsMenuOpen((current) => !current)}
            className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border transition duration-200 ${
              darkMode
                ? "border-white/15 bg-white/8 text-white hover:bg-white/12"
                : "border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-indigo-50 hover:text-indigo-700"
            }`}
          >
            <Icon name={isMenuOpen ? "close" : "menu"} className="h-5 w-5" />
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div
          className={`border-t px-4 py-4 shadow-lg lg:hidden ${
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
                className={`relative flex h-11 cursor-pointer items-center gap-3 px-1 text-sm font-bold transition duration-200 ${
                  isActive(link.to)
                    ? darkMode
                      ? "text-indigo-200"
                      : "text-indigo-700"
                    : darkMode
                      ? "text-slate-200 hover:text-white"
                      : "text-slate-700 hover:text-slate-950"
                }`}
              >
                <Icon name={link.icon} className="h-4 w-4 text-indigo-500" />
                {link.label}
                {isActive(link.to) && (
                  <span className="absolute bottom-1 left-1 h-0.5 w-6 rounded-full bg-indigo-500" />
                )}
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
                    className={`inline-flex h-11 cursor-pointer items-center justify-center rounded-lg border px-4 text-sm font-bold transition duration-200 ${
                      darkMode
                        ? "border-white/15 bg-white/8 text-indigo-100 hover:bg-white/12 hover:text-white"
                        : "border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50"
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
                    className="inline-flex h-11 cursor-pointer items-center justify-center rounded-lg border border-red-200 bg-white px-4 text-sm font-bold text-red-600 transition duration-200 hover:bg-red-50 hover:text-red-700"
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
                    className={`inline-flex h-11 cursor-pointer items-center justify-center rounded-lg border px-4 text-sm font-bold transition duration-200 ${
                      darkMode
                        ? "border-white/15 bg-white/8 text-indigo-100 hover:bg-white/12 hover:text-white"
                        : "border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50"
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
                    className="h-11 cursor-pointer rounded-lg bg-indigo-600 px-5 text-sm font-bold text-white transition duration-200 hover:bg-indigo-700"
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

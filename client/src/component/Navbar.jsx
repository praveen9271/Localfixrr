import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { scrollToSection } from "../utils/scroll";
import Icon from "./Icon";
import logo from "../assets/logo.png";
import { isAuthenticated, getUserRole, logout } from "../services/authService";
import ConfirmModal from "../components/ui/ConfirmModal";

const navLinks = [
  { label: "Home", icon: "home", to: "/" },
  { label: "Services", icon: "wrench", to: "/#services" },
  { label: "How It Works", icon: "spark", to: "/#how-it-works" },
  { label: "Contact", icon: "phone", to: "/#contact" },
];

const cx = (...classes) => classes.filter(Boolean).join(" ");

function ThemeIconButton({ darkMode, onToggleDarkMode }) {
  return (
    <button
      type="button"
      onClick={onToggleDarkMode}
      aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={darkMode}
      className={cx(
        "grid h-10 w-10 cursor-pointer place-items-center rounded-full border transition duration-200 hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2",
        darkMode
          ? "border-white/15 bg-white/8 text-slate-100 hover:bg-white/12 focus-visible:ring-offset-slate-950"
          : "border-slate-200 bg-white text-indigo-600 shadow-sm hover:border-indigo-200 hover:bg-indigo-50 focus-visible:ring-offset-white",
      )}
    >
      <Icon name={darkMode ? "moon" : "sun"} className="h-5 w-5" />
    </button>
  );
}

function Navbar({ darkMode, onToggleDarkMode, onLoginClick, onRegisterClick, onToast }) {
  const [hasScrolled, setHasScrolled] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [pendingCloseMenu, setPendingCloseMenu] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const authenticated = isAuthenticated();
  const userRole = getUserRole();

  useEffect(() => {
    let frameId = 0;

    const updateScrollState = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        setHasScrolled(window.scrollY > 16);
      });
    };

    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", updateScrollState);
    };
  }, []);

  const handleAnchorRoute = (to, closeMenu) => {
    closeMenu?.();
    const [path, hash] = to.split("#");
    navigate(hash ? `${path || "/"}#${hash}` : path || "/");
    if (hash) {
      setTimeout(() => scrollToSection(hash), 0);
    }
  };

  const requestLogout = (closeMenu) => {
    setPendingCloseMenu(() => closeMenu || null);
    setLogoutConfirmOpen(true);
  };

  const handleLogout = () => {
    logout();
    pendingCloseMenu?.();
    setPendingCloseMenu(null);
    setLogoutConfirmOpen(false);
    onToast?.("Logged out successfully.");
    navigate("/", { replace: true });
  };

  const closeLogoutConfirm = () => {
    setPendingCloseMenu(null);
    setLogoutConfirmOpen(false);
  };

  const handleDashboard = (closeMenu) => {
    closeMenu?.();
    if (userRole === "admin") navigate("/dashboard/admin");
    else if (userRole === "service_provider") navigate("/dashboard/provider");
    else navigate("/dashboard/user");
  };

  const isActive = (to) => {
    const [path, hash] = to.split("#");
    if (hash) return location.pathname === path && location.hash === `#${hash}`;
    if (to === "/" && location.hash) return false;
    return location.pathname === path;
  };

  const navSurface = darkMode
    ? "border-white/10 bg-slate-950/92"
    : "border-slate-200/70 bg-white/92";
  const floatingSurface = darkMode
    ? "border-white/10 bg-slate-950/88 shadow-[0_22px_70px_rgba(0,0,0,0.38)]"
    : "border-slate-200/70 bg-white/90 shadow-[0_22px_70px_rgba(15,23,42,0.14)]";
  const menuSurface = darkMode
    ? "border-white/10 bg-slate-950/96 shadow-black/35"
    : "border-slate-100 bg-white/96 shadow-slate-900/12";

  const desktopLinkClass = (active) =>
    cx(
      "relative inline-flex h-10 cursor-pointer items-center gap-2 rounded-full px-3 text-sm font-bold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
      active
        ? darkMode
          ? "bg-indigo-400/12 text-indigo-100"
          : "bg-indigo-50 text-indigo-700"
        : darkMode
          ? "text-slate-300 hover:bg-white/8 hover:text-white"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
    );

  const mobileLinkClass = (active) =>
    cx(
      "relative flex h-11 cursor-pointer items-center gap-3 rounded-xl px-3 text-sm font-bold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
      active
        ? darkMode
          ? "bg-indigo-400/12 text-indigo-100"
          : "bg-indigo-50 text-indigo-700"
        : darkMode
          ? "text-slate-200 hover:bg-white/8 hover:text-white"
          : "text-slate-700 hover:bg-slate-100 hover:text-slate-950",
    );

  return (
    <Disclosure as="header" data-app-header className="sticky top-0 z-50 h-[72px]">
      {({ open, close }) => (
        <>
          <div
            className={cx(
              "absolute inset-x-0 top-0 transition-all duration-300",
              hasScrolled ? "px-3 py-2 sm:px-4" : "px-0 py-0",
            )}
          >
            <div
              className={cx(
                "mx-auto border backdrop-blur-xl transition-all duration-300",
                hasScrolled
                  ? `max-w-6xl rounded-full ${floatingSurface}`
                  : `max-w-none rounded-none border-x-0 border-t-0 shadow-sm ${navSurface}`,
              )}
            >
              <div
                className={cx(
                  "mx-auto flex h-14 items-center justify-between",
                  hasScrolled ? "px-3 sm:px-4" : "max-w-7xl px-4 sm:px-6 lg:px-8",
                )}
              >
                <button
                  type="button"
                  onClick={() => handleAnchorRoute("/", close)}
                  className="inline-flex h-11 cursor-pointer items-center gap-2.5 rounded-full pr-2 transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                >
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

                <nav className="hidden items-center gap-1.5 lg:flex">
                  {navLinks.map((link) => {
                    const active = isActive(link.to);

                    return (
                      <button
                        key={link.label}
                        type="button"
                        aria-current={active ? "page" : undefined}
                        onClick={() => handleAnchorRoute(link.to)}
                        className={desktopLinkClass(active)}
                      >
                        <Icon
                          name={link.icon}
                          className={cx(
                            "h-4 w-4",
                            active ? "text-indigo-500" : "text-indigo-400",
                          )}
                        />
                        {link.label}
                      </button>
                    );
                  })}
                </nav>

                <div className="hidden items-center gap-3 lg:flex">
                  {authenticated ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleDashboard()}
                        className={cx(
                          "inline-flex h-10 cursor-pointer items-center justify-center rounded-full px-3 text-sm font-bold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                          darkMode
                            ? "text-indigo-200 hover:bg-white/8 hover:text-white"
                            : "text-indigo-700 hover:bg-indigo-50 hover:text-indigo-900",
                        )}
                      >
                        Dashboard
                      </button>
                      <button
                        type="button"
                        onClick={() => requestLogout()}
                        className="inline-flex h-10 cursor-pointer items-center justify-center rounded-full px-3 text-sm font-bold text-red-600 transition duration-200 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={onLoginClick}
                        className={cx(
                          "inline-flex h-10 cursor-pointer items-center justify-center rounded-full px-3 text-sm font-bold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                          darkMode
                            ? "text-indigo-200 hover:bg-white/8 hover:text-white"
                            : "text-indigo-700 hover:bg-indigo-50 hover:text-indigo-900",
                        )}
                      >
                        Login
                      </button>
                      <button
                        type="button"
                        onClick={onRegisterClick}
                        className="inline-flex h-10 cursor-pointer items-center justify-center rounded-full bg-indigo-600 px-5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(79,70,229,0.24)] transition duration-200 hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
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
                      onClick={() => {
                        close();
                        onLoginClick();
                      }}
                      className={cx(
                        "inline-flex h-9 cursor-pointer items-center justify-center rounded-full border px-3 text-sm font-bold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                        darkMode
                          ? "border-white/15 bg-white/8 text-indigo-100 hover:bg-white/12 hover:text-white"
                          : "border-indigo-200 bg-white text-indigo-700 shadow-sm hover:bg-indigo-50",
                      )}
                    >
                      Login
                    </button>
                  )}
                  <DisclosureButton
                    className={cx(
                      "flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                      darkMode
                        ? "border-white/15 bg-white/8 text-white hover:bg-white/12"
                        : "border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-indigo-50 hover:text-indigo-700",
                    )}
                  >
                    <span className="sr-only">
                      {open ? "Close menu" : "Open menu"}
                    </span>
                    <Icon name={open ? "close" : "menu"} className="h-5 w-5" />
                  </DisclosureButton>
                </div>
              </div>
            </div>
          </div>

          <DisclosurePanel
            transition
            className={cx(
              "absolute inset-x-0 top-[64px] z-10 px-3 transition duration-200 ease-out data-closed:-translate-y-1 data-closed:opacity-0 sm:px-4 lg:hidden",
              !hasScrolled && "px-0 sm:px-0",
            )}
          >
            <div
              className={cx(
                "mx-auto max-w-6xl border px-4 py-4 backdrop-blur-xl",
                hasScrolled
                  ? `rounded-2xl shadow-xl ${menuSurface}`
                  : `rounded-b-2xl border-x-0 border-t-0 shadow-lg ${menuSurface}`,
              )}
            >
              <div className="flex flex-col gap-2">
                {navLinks.map((link) => {
                  const active = isActive(link.to);

                  return (
                    <button
                      key={link.label}
                      type="button"
                      aria-current={active ? "page" : undefined}
                      onClick={() => handleAnchorRoute(link.to, close)}
                      className={mobileLinkClass(active)}
                    >
                      <Icon
                        name={link.icon}
                        className={cx(
                          "h-4 w-4",
                          active ? "text-indigo-500" : "text-indigo-400",
                        )}
                      />
                      {link.label}
                    </button>
                  );
                })}
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {authenticated ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleDashboard(close)}
                        className={cx(
                          "inline-flex h-11 cursor-pointer items-center justify-center rounded-full border px-4 text-sm font-bold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                          darkMode
                            ? "border-white/15 bg-white/8 text-indigo-100 hover:bg-white/12 hover:text-white"
                            : "border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50",
                        )}
                      >
                        Dashboard
                      </button>
                      <button
                        type="button"
                        onClick={() => requestLogout(close)}
                        className="inline-flex h-11 cursor-pointer items-center justify-center rounded-full border border-red-200 bg-white px-4 text-sm font-bold text-red-600 transition duration-200 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          close();
                          onLoginClick();
                        }}
                        className={cx(
                          "inline-flex h-11 cursor-pointer items-center justify-center rounded-full border px-4 text-sm font-bold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                          darkMode
                            ? "border-white/15 bg-white/8 text-indigo-100 hover:bg-white/12 hover:text-white"
                            : "border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50",
                        )}
                      >
                        Login
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          close();
                          onRegisterClick();
                        }}
                        className="h-11 cursor-pointer rounded-full bg-indigo-600 px-5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(79,70,229,0.22)] transition duration-200 hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
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
          </DisclosurePanel>
          <ConfirmModal
            isOpen={logoutConfirmOpen}
            title="Logout"
            message="Are you sure you want to logout from your LocalFixr account?"
            confirmText="Logout"
            cancelText="Cancel"
            variant="danger"
            onConfirm={handleLogout}
            onClose={closeLogoutConfirm}
          />
        </>
      )}
    </Disclosure>
  );
}

export default Navbar;

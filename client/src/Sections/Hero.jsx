import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import Icon from "../component/Icon";
import { getPublicServices } from "../services/dashboardService";
import { SERVICE_AREA_FULL, isSupportedLocation, unsupportedLocationMessage } from "../utils/serviceArea";
import { button3d, floatingCard, orbitRing } from "../utils/tailwindStyles";
import heroImg from "../assets/hero.png";

const floatingCards = [
  {
    title: "Plumber",
    query: "Plumbing",
    rating: "4.7",
    icon: "wrench",
    position: "left-2 top-20 sm:left-0 sm:top-24",
    delay: "0s",
    tint: "bg-indigo-50 text-indigo-600",
  },
  {
    title: "Electrician",
    query: "Electrical",
    rating: "4.8",
    icon: "bolt",
    position: "right-2 top-6 sm:right-0 sm:top-8",
    delay: "0.7s",
    tint: "bg-violet-50 text-violet-600",
  },
  {
    title: "AC Repair",
    query: "Appliance Repair",
    rating: "4.6",
    icon: "snow",
    position: "right-2 bottom-20 sm:right-0 sm:bottom-16",
    delay: "1.2s",
    tint: "bg-sky-50 text-sky-600",
  },
  {
    title: "Appliance Repair",
    query: "Appliance Repair",
    rating: "4.6",
    icon: "spark",
    position: "left-2 bottom-6 sm:left-8 sm:bottom-8",
    delay: "1.8s",
    tint: "bg-blue-50 text-blue-600",
  },
];

function Hero({ darkMode, onToast }) {
  const navigate = useNavigate();
  const [location, setLocation] = useState(SERVICE_AREA_FULL);
  const [service, setService] = useState("");
  const [serviceOptions, setServiceOptions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const data = await getPublicServices();
        setServiceOptions(data.services || []);
      } catch {
        setServiceOptions([]);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(serviceOptions.map((item) => item.category || item.title).filter(Boolean))).sort(),
    [serviceOptions],
  );

  const runSearch = (selectedService = service, requireAllInputs = true) => {
    if (requireAllInputs && (!location.trim() || !selectedService)) {
      onToast?.("Enter a location and choose a service to search.");
      return;
    }

    if (!isSupportedLocation(location)) {
      onToast?.(unsupportedLocationMessage);
      return;
    }

    const params = new URLSearchParams();

    if (location.trim()) params.set("location", SERVICE_AREA_FULL);
    if (selectedService) params.set("category", selectedService);

    setIsSearching(true);
    setTimeout(() => {
      navigate(`/services${params.toString() ? `?${params.toString()}` : ""}`);
    }, 450);
  };

  const handleSearch = (event) => {
    event.preventDefault();
    runSearch();
  };

  const handleQuickService = (selectedService) => {
    if (!isSupportedLocation(location)) {
      onToast?.(unsupportedLocationMessage);
      return;
    }

    const params = new URLSearchParams({
      location: SERVICE_AREA_FULL,
      category: selectedService,
    });
    navigate(`/services?${params.toString()}`);
  };

  return (
    <section id="search" className="relative overflow-hidden">
      <div
        className={`absolute inset-0 ${
          darkMode
            ? "bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.18),transparent_30%),radial-gradient(circle_at_85%_20%,rgba(59,130,246,0.16),transparent_25%),linear-gradient(135deg,#020617,#111827,#1e1b4b)]"
            : "bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.12),transparent_30%),radial-gradient(circle_at_85%_20%,rgba(59,130,246,0.12),transparent_25%),linear-gradient(135deg,#eff6ff,#ffffff,#ede9fe)]"
        }`}
      />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:py-12">
        <div className="self-center">
          <div
            className={`inline-flex items-center gap-3 rounded-full border px-4 py-2 text-sm font-medium shadow-sm ${
              darkMode
                ? "border-white/10 bg-white/10 text-slate-200"
                : "border-emerald-100 bg-white text-slate-600"
            }`}
          >
            <div className="flex -space-x-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-100 text-xs">
                A
              </span>
              <span className="grid h-8 w-8 place-items-center rounded-full bg-orange-100 text-xs">
                R
              </span>
              <span className="grid h-8 w-8 place-items-center rounded-full bg-indigo-100 text-xs">
                S
              </span>
            </div>
            Now onboarding local customers and providers
          </div>

          <h1
            className={`mt-6 max-w-xl text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl ${
              darkMode ? "text-white" : "text-slate-900"
            }`}
          >
            Find Trusted <span className="text-indigo-500">Home Services</span>{" "}
            Near You
          </h1>
          <p
            className={`mt-4 max-w-xl text-lg leading-8 ${darkMode ? "text-slate-300" : "text-slate-500"}`}
          >
            Connect with local experts for repair and maintenance needs in
            Phagwara, Punjab. Simple search and direct service requests.
          </p>

          <form
            onSubmit={handleSearch}
            className={`mt-6 grid gap-4 rounded-[2rem] border p-4 shadow-[0_30px_70px_rgba(15,23,42,0.14)] transition duration-300 focus-within:ring-4 focus-within:ring-indigo-500/20 sm:grid-cols-[1fr_1fr_auto] ${
              darkMode
                ? "border-white/10 bg-slate-900/90 shadow-indigo-950/30"
                : "border-white bg-white"
            }`}
          >
            <label
              className={`rounded-2xl border px-4 py-4 transition focus-within:border-indigo-200 focus-within:ring-4 focus-within:ring-indigo-50 ${darkMode ? "border-white/10" : "border-slate-100"}`}
            >
              <span
                className={`text-sm font-semibold ${darkMode ? "text-slate-200" : "text-slate-700"}`}
              >
                Your Location
              </span>
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder={SERVICE_AREA_FULL}
                className={`mt-2 w-full bg-transparent text-sm outline-none placeholder:text-slate-400 ${darkMode ? "text-white" : "text-slate-700"}`}
              />
            </label>
            <div>
              <label
                className={`block rounded-2xl border px-4 py-4 transition focus-within:border-indigo-200 focus-within:ring-4 focus-within:ring-indigo-50 ${darkMode ? "border-white/10" : "border-slate-100"}`}
              >
                <span
                  className={`text-sm font-semibold ${darkMode ? "text-slate-200" : "text-slate-700"}`}
                >
                  Select Service
                </span>
                <select
                  value={service}
                  onChange={(event) => setService(event.target.value)}
                  className={`mt-2 w-full bg-transparent text-sm outline-none ${darkMode ? "text-white" : "text-slate-700"}`}
                >
                  <option value="">Choose service</option>
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button
              type="submit"
              className={`${button3d} rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-8 py-4 font-semibold text-white`}
            >
              {isSearching ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Searching
                </span>
              ) : (
                "Search Now"
              )}
            </button>
          </form>

          <div
            className={`mt-5 flex flex-wrap items-center gap-5 text-sm font-semibold ${darkMode ? "text-slate-200" : "text-slate-600"}`}
          >
            {[
              "Verified Professionals",
              "Quick Response",
              "Safe & Reliable",
            ].map((item, index) => (
              <div key={item} className="flex items-center gap-2">
                <span
                  className={`grid h-7 w-7 place-items-center rounded-full ${
                    index === 0
                      ? "bg-indigo-100 text-indigo-600"
                      : index === 1
                        ? "bg-amber-100 text-amber-600"
                        : "bg-emerald-100 text-emerald-600"
                  }`}
                >
                  <Icon name="check" className="h-4 w-4" />
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="relative min-h-[500px] sm:min-h-[560px]">
          <div
            className={`absolute left-1/2 top-1/2 h-[430px] w-[430px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-sm sm:h-[520px] sm:w-[520px] ${darkMode ? "bg-indigo-950" : "bg-indigo-100"}`}
          />
          <div className="absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-indigo-500 via-blue-600 to-violet-700 shadow-[0_35px_100px_rgba(79,70,229,0.42)] sm:h-[440px] sm:w-[440px]" />
          <div className="absolute left-1/2 top-[49%] h-[360px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-[2.25rem] border border-white/20 bg-white/8 shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] backdrop-blur-[1px] sm:h-[420px] sm:w-[360px]" />

          <div className="absolute left-1/2 top-[57%] z-10 -translate-x-1/2 -translate-y-1/2">
            <div className="relative h-[340px] w-[340px] overflow-hidden rounded-[2rem] bg-slate-950/5 shadow-[inset_0_0_70px_rgba(255,255,255,0.14)] sm:h-[420px] sm:w-[420px]">
              <img
                src={heroImg}
                alt="Home services illustration"
                className="absolute inset-0 h-full w-full object-cover opacity-35 mix-blend-screen"
              />

              <div className="absolute inset-0">
                <div className="absolute left-1/2 top-1/2 h-[2px] w-[210px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/22" />
                <div className="absolute left-1/2 top-1/2 h-[2px] w-[210px] -translate-x-1/2 -translate-y-1/2 rotate-[60deg] rounded-full bg-white/16" />
                <div className="absolute left-1/2 top-1/2 h-[2px] w-[210px] -translate-x-1/2 -translate-y-1/2 -rotate-[60deg] rounded-full bg-white/16" />

                <div className={`${orbitRing} absolute left-1/2 top-1/2 h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70 sm:h-[315px] sm:w-[315px]`} />
                <div className="absolute left-1/2 top-1/2 h-[284px] w-[284px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/20 animate-[spin_28s_linear_infinite] sm:h-[342px] sm:w-[342px]" />
                <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 animate-[pulse_5.5s_ease-in-out_infinite] sm:h-[360px] sm:w-[360px]" />

                <div className="absolute left-1/2 top-[47%] h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 animate-[pulse_4.5s_ease-in-out_infinite] rounded-full bg-[linear-gradient(145deg,#6f80ff_0%,#3153e9_46%,#102aa4_100%)] shadow-[0_34px_86px_rgba(15,23,42,0.38),inset_0_16px_28px_rgba(255,255,255,0.3),inset_0_-26px_34px_rgba(0,20,105,0.38)] sm:h-[340px] sm:w-[340px]">
                  <div className="absolute inset-3 rounded-full border border-white/20 bg-[radial-gradient(circle_at_35%_20%,rgba(255,255,255,0.38),transparent_28%),linear-gradient(160deg,rgba(255,255,255,0.1),rgba(255,255,255,0))]" />
                  <div className="absolute -inset-1 rounded-full border border-white/15" />
                  <div className="absolute inset-0 overflow-hidden rounded-full">
                    <div className="absolute -left-20 top-8 h-28 w-14 rotate-[25deg] animate-[pulse_2.8s_ease-in-out_infinite] bg-white/20 blur-lg" />
                  </div>
                  <div className="absolute left-[13%] top-[13%] h-9 w-9 rounded-full bg-white/20 blur-md" />
                  <div className="absolute inset-x-0 top-8 flex flex-col items-center text-center text-white sm:top-10">
                    <div className="relative h-14 w-16 animate-[bounce_5s_ease-in-out_infinite] drop-shadow-[0_8px_12px_rgba(15,23,42,0.25)] sm:h-16 sm:w-18">
                      <div className="absolute left-1/2 top-0 h-9 w-9 -translate-x-1/2 rotate-45 rounded-[5px] border-l-[3px] border-t-[3px] border-white sm:h-10 sm:w-10" />
                      <div className="absolute bottom-0 left-1/2 h-9 w-11 -translate-x-1/2 rounded-t-md border-x-[3px] border-b-[3px] border-white sm:h-10 sm:w-12" />
                      <div className="absolute bottom-1.5 left-1/2 grid -translate-x-1/2 grid-cols-2 gap-0.5 sm:gap-1">
                        <span className="h-3 w-3 rounded-[2px] bg-amber-300 shadow-sm sm:h-3.5 sm:w-3.5" />
                        <span className="h-3 w-3 rounded-[2px] bg-amber-300 shadow-sm sm:h-3.5 sm:w-3.5" />
                        <span className="h-3 w-3 rounded-[2px] bg-amber-300 shadow-sm sm:h-3.5 sm:w-3.5" />
                        <span className="h-3 w-3 rounded-[2px] bg-amber-300 shadow-sm sm:h-3.5 sm:w-3.5" />
                      </div>
                    </div>
                    <p className="mt-4 text-2xl font-black leading-none drop-shadow-[0_6px_10px_rgba(15,23,42,0.24)] sm:mt-5 sm:text-[2.2rem]">
                      LOCAL
                    </p>
                    <p className="mt-1 text-[4.45rem] font-black leading-[0.82] drop-shadow-[0_10px_14px_rgba(15,23,42,0.28)] sm:text-[5.35rem]">
                      FIX<span className="text-amber-300">R</span>
                    </p>
                    <p className="mt-3 text-[0.72rem] font-semibold uppercase text-blue-50 sm:text-[0.88rem]">
                      Local experts. Fast solutions.
                    </p>
                    <div className="mt-4 grid w-[84%] grid-cols-3 gap-1.5 rounded-full bg-blue-950/35 p-1.5 text-[0.62rem] font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22)] backdrop-blur sm:mt-5 sm:text-[0.76rem]">
                      {[
                        ["shield", "Trusted"],
                        ["bolt", "Fast"],
                        ["check", "Reliable"],
                      ].map(([icon, label]) => (
                        <span key={label} className="flex items-center justify-center gap-1 rounded-full bg-white/10 px-1.5 py-1 transition duration-300 hover:bg-white/20">
                          <Icon name={icon} className="h-3 w-3 text-amber-200" />
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="absolute inset-y-6 left-[-35%] w-20 rotate-[24deg] animate-[pulse_3.2s_ease-in-out_infinite] bg-white/16 blur-xl" />
                </div>

                <div className="absolute bottom-14 left-1/2 h-12 w-56 -translate-x-1/2 rounded-full bg-indigo-950/20 blur-2xl sm:bottom-16 sm:w-72" />
              </div>
            </div>
          </div>

          {floatingCards.map((card) => (
            <button
              key={card.title}
              type="button"
              onClick={() => handleQuickService(card.query)}
              style={{ animationDelay: card.delay }}
              className={`${floatingCard} absolute ${card.position} z-20 rounded-[1.6rem] border border-white bg-white px-4 py-3 text-left shadow-[0_22px_50px_rgba(15,23,42,0.16)] transition duration-300 hover:scale-105 hover:shadow-[0_30px_65px_rgba(79,70,229,0.2)] focus:outline-none focus:ring-4 focus:ring-indigo-200 sm:px-5 sm:py-4`}
              aria-label={`Browse ${card.query} services`}
            >
              <div className="flex items-center gap-3">
                <span className={`grid h-11 w-11 place-items-center rounded-full sm:h-12 sm:w-12 ${card.tint}`}>
                  <Icon name={card.icon} className="h-6 w-6" />
                </span>
                <div>
                  <p className="font-bold text-slate-900">{card.title}</p>
                  <div className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                    <span>{card.rating}</span>
                    <Icon name="star" className="h-4 w-4 text-amber-400" />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Hero;

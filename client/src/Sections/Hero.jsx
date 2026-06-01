import { useEffect, useMemo, useRef, useState } from "react";
import { useFormik } from "formik";
import { useNavigate } from "react-router";
import * as Yup from "yup";
import Icon from "../component/Icon";
import { getPublicServices } from "../services/dashboardService";
import { SERVICE_AREA_FULL } from "../utils/serviceArea";
import { button3d } from "../utils/tailwindStyles";
import serviceProviderImg from "../assets/serviceprovider.png";

const serviceShortcutStyles = {
  Plumbing: {
    icon: "wrench",
    tint: "bg-blue-50 text-blue-700",
  },
  Electrical: {
    icon: "bolt",
    tint: "bg-amber-50 text-amber-600",
  },
  "Appliance Repair": {
    title: "AC Repair",
    icon: "snow",
    tint: "bg-cyan-50 text-cyan-700",
  },
  Painting: {
    icon: "paint",
    tint: "bg-indigo-50 text-indigo-700",
  },
  Cleaning: {
    icon: "spark",
    tint: "bg-emerald-50 text-emerald-700",
  },
  Carpentry: {
    icon: "hammer",
    tint: "bg-orange-50 text-orange-700",
  },
};

const getShortcutCard = (category) => {
  const style = serviceShortcutStyles[category] || {
    icon: "wrench",
    tint: "bg-slate-50 text-slate-700",
  };

  return {
    title: style.title || category,
    query: category,
    icon: style.icon,
    tint: style.tint,
  };
};

const heroSearchSchema = Yup.object({
  service: Yup.string().trim().required("Choose a service to search."),
});

function Hero({ darkMode, onToast }) {
  const navigate = useNavigate();
  const [serviceOptions, setServiceOptions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [serviceOpen, setServiceOpen] = useState(false);
  const serviceSelectRef = useRef(null);

  const submitSearch = (selectedService, requireService = true) => {
    const cleanService = selectedService.trim();

    if (requireService && !cleanService) {
      onToast?.("Choose a service to search.");
      return;
    }

    const params = new URLSearchParams();

    params.set("location", SERVICE_AREA_FULL);
    if (cleanService) params.set("category", cleanService);

    setIsSearching(true);
    setTimeout(() => {
      navigate(`/services${params.toString() ? `?${params.toString()}` : ""}`);
    }, 450);
  };

  const searchFormik = useFormik({
    initialValues: { service: "" },
    validationSchema: heroSearchSchema,
    onSubmit: (values) => submitSearch(values.service, true),
  });

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

  const quickServices = useMemo(
    () => categories.slice(0, 4).map((category) => getShortcutCard(category)),
    [categories],
  );

  useEffect(() => {
    const closeServiceDropdown = (event) => {
      if (!serviceSelectRef.current?.contains(event.target)) {
        setServiceOpen(false);
      }
    };

    document.addEventListener("mousedown", closeServiceDropdown);
    return () => document.removeEventListener("mousedown", closeServiceDropdown);
  }, []);

  const handleQuickService = (selectedService) => {
    const params = new URLSearchParams({
      location: SERVICE_AREA_FULL,
      category: selectedService,
    });
    navigate(`/services?${params.toString()}`);
  };

  const serviceError =
    (searchFormik.touched.service || searchFormik.submitCount > 0) && searchFormik.errors.service
      ? searchFormik.errors.service
      : "";

  return (
    <section id="search" className="relative z-10 overflow-visible">
      <div
        className={`absolute inset-0 ${
          darkMode
            ? "bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.18),transparent_30%),radial-gradient(circle_at_85%_20%,rgba(59,130,246,0.16),transparent_25%),linear-gradient(135deg,#020617,#111827,#1e1b4b)]"
            : "bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.12),transparent_30%),radial-gradient(circle_at_85%_20%,rgba(59,130,246,0.12),transparent_25%),linear-gradient(135deg,#eff6ff,#ffffff,#ede9fe)]"
        }`}
      />
      <div className="relative mx-auto grid max-w-[1240px] items-center gap-6 px-4 pb-8 pt-4 sm:px-6 sm:pt-5 lg:grid-cols-[minmax(0,38rem)_minmax(28rem,34rem)] lg:justify-between lg:px-8 lg:pb-10 lg:pt-6 xl:gap-8">
        <div className="w-full max-w-[44rem] self-center">
          <div
            className={`inline-flex items-center gap-3 rounded-full border px-4 py-2 text-sm font-medium shadow-sm ${
              darkMode
                ? "border-white/15 bg-white/8 text-slate-100 shadow-indigo-950/30"
                : "border-emerald-100 bg-white text-slate-600"
            }`}
          >
            <div className="flex -space-x-1">
              <span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-black ${darkMode ? "bg-emerald-400/18 text-emerald-100" : "bg-emerald-100 text-emerald-700"}`}>
                A
              </span>
              <span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-black ${darkMode ? "bg-amber-400/18 text-amber-100" : "bg-orange-100 text-orange-700"}`}>
                R
              </span>
              <span className={`grid h-8 w-8 place-items-center rounded-full text-xs font-black ${darkMode ? "bg-indigo-400/20 text-indigo-100" : "bg-indigo-100 text-indigo-700"}`}>
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
            Connect with local experts for repair and maintenance needs. Enter
            your service need and find providers in Phagwara.
          </p>

          <form
            onSubmit={searchFormik.handleSubmit}
            className={`relative z-30 mt-6 grid w-full max-w-[44rem] gap-2 rounded-[1.6rem] border p-2 shadow-[0_24px_60px_rgba(15,23,42,0.12)] transition duration-300 focus-within:ring-4 focus-within:ring-indigo-500/20 md:grid-cols-[minmax(13.5rem,1fr)_minmax(13.5rem,1fr)_auto] ${
              darkMode
                ? "border-white/10 bg-slate-900/90 shadow-indigo-950/30"
                : "border-white bg-white"
            }`}
          >
            <button
              type="button"
              onClick={() => onToast?.("LocalFixr is available in Phagwara only.")}
              className={`relative flex min-h-18 cursor-pointer items-center gap-3 rounded-[1.25rem] px-4 text-left transition hover:bg-indigo-50/50 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 ${darkMode ? "bg-white/5 hover:bg-white/8" : "bg-white"}`}
              aria-label="LocalFixr is available in Phagwara only"
            >
              <Icon name="location" className="h-5 w-5 shrink-0 text-indigo-600" />
              <span className="min-w-0 flex-1">
                <span
                  className={`flex items-center gap-1 whitespace-nowrap text-xs font-black ${darkMode ? "text-slate-200" : "text-slate-800"}`}
                >
                  Service Area
                </span>
                <span className={`mt-1 block whitespace-normal text-sm font-semibold leading-5 ${darkMode ? "text-white" : "text-slate-700"}`}>
                  Available In Phagwara
                </span>
              </span>
            </button>
            <div className="relative" ref={serviceSelectRef}>
              <div className={`relative flex min-h-18 cursor-pointer items-center gap-3 rounded-[1.25rem] px-4 transition focus-within:bg-indigo-50/50 ${darkMode ? "bg-white/5" : "bg-white"}`}>
                <Icon name="wrench" className="h-5 w-5 shrink-0 text-indigo-600" />
                <span className="min-w-0 flex-1">
                  <span
                    className={`flex items-center gap-1 whitespace-nowrap text-xs font-black ${darkMode ? "text-slate-200" : "text-slate-800"}`}
                  >
                    Select Service <span className="text-rose-500">*</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      searchFormik.setFieldTouched("service", true, false);
                      setServiceOpen((current) => !current);
                    }}
                    className={`mt-1 flex w-full cursor-pointer items-center justify-between gap-3 bg-transparent pr-8 text-left text-sm outline-none ${searchFormik.values.service ? darkMode ? "text-white" : "text-slate-700" : "text-slate-400"}`}
                    aria-haspopup="listbox"
                    aria-expanded={serviceOpen}
                  >
                    <span className="min-w-0 truncate">{searchFormik.values.service || "Choose service"}</span>
                  </button>
                </span>
                <Icon name="chevronDown" className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-600" />
              </div>
              {serviceOpen && (
                <div
                  className={`absolute left-0 right-0 top-full z-[100] mt-2 overflow-y-auto overscroll-contain rounded-2xl border border-indigo-100 bg-white p-2 shadow-[0_22px_55px_rgba(15,23,42,0.16)] ${categories.length ? "h-56" : "h-auto"}`}
                  role="listbox"
                >
                  <button
                    type="button"
                    onClick={() => {
                      searchFormik.setFieldValue("service", "");
                      searchFormik.setFieldTouched("service", true, false);
                      setServiceOpen(false);
                    }}
                    className={`flex w-full cursor-pointer items-center rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition hover:bg-indigo-50 hover:text-indigo-700 ${!searchFormik.values.service ? "bg-indigo-50 text-indigo-700" : "text-slate-600"}`}
                    role="option"
                    aria-selected={!searchFormik.values.service}
                  >
                    Choose service
                  </button>
                  {categories.length > 0 ? (
                    categories.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          searchFormik.setFieldValue("service", item);
                          searchFormik.setFieldTouched("service", true, false);
                          setServiceOpen(false);
                        }}
                        className={`flex w-full cursor-pointer items-center rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition hover:bg-indigo-50 hover:text-indigo-700 ${searchFormik.values.service === item ? "bg-indigo-50 text-indigo-700" : "text-slate-700"}`}
                        role="option"
                        aria-selected={searchFormik.values.service === item}
                      >
                        {item}
                      </button>
                    ))
                  ) : (
                    <div className="rounded-xl px-3 py-3 text-sm font-semibold text-slate-500">
                      No services available
                    </div>
                  )}
                </div>
              )}
              {serviceError && (
                <span className="mt-2 block px-3 text-xs font-semibold text-rose-600">
                  {serviceError}
                </span>
              )}
            </div>
            <button
              type="submit"
              className={`${button3d} inline-flex min-h-11 cursor-pointer items-center justify-center gap-1.5 self-center whitespace-nowrap rounded-[0.9rem] bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-3.5 py-2 text-sm font-semibold text-white sm:min-h-12 sm:px-4`}
            >
              {isSearching ? (
                <span className="inline-flex items-center gap-2 whitespace-nowrap">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Searching
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 whitespace-nowrap">
                  Search Now
                  <Icon name="arrowRight" className="h-4 w-4" />
                </span>
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

        <div className="relative mx-auto min-h-[320px] w-full max-w-[34rem] sm:min-h-[440px] lg:min-h-[480px]">
          <div className={`absolute inset-0 rounded-[2rem] border shadow-[0_35px_90px_rgba(37,99,235,0.22)] ${darkMode ? "border-white/10 bg-slate-900/70" : "border-white bg-white/70"}`} />
          <img
            src={serviceProviderImg}
            alt="LocalFixr service providers"
            className="absolute inset-0 h-full w-full rounded-[2rem] object-cover object-[68%_50%] sm:object-[82%_50%]"
          />
          <div className={`absolute inset-0 rounded-[2rem] ${darkMode ? "bg-gradient-to-r from-slate-950/55 via-slate-950/10 to-transparent" : "bg-gradient-to-r from-white/70 via-white/10 to-transparent"}`} />

          <div className="absolute left-4 top-1/2 z-20 hidden -translate-y-1/2 flex-col gap-3 sm:flex lg:left-6">
            {quickServices.map((card) => (
              <button
                key={card.title}
                type="button"
                onClick={() => handleQuickService(card.query)}
                className={`${button3d} group inline-flex cursor-pointer items-center gap-3 rounded-full focus:outline-none focus:ring-4 focus:ring-indigo-200`}
                aria-label={`Browse ${card.query} services`}
              >
                <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full border border-white bg-white/95 shadow-[0_14px_34px_rgba(37,99,235,0.16)] ring-1 ring-blue-100/80 transition duration-300 group-hover:-translate-y-0.5 group-hover:shadow-[0_22px_48px_rgba(37,99,235,0.22)]">
                  <span className={`grid h-10 w-10 place-items-center rounded-full ${card.tint}`}>
                    <Icon name={card.icon} className="h-5 w-5" />
                  </span>
                </span>
                <span className="rounded-full border border-white bg-white/90 px-2.5 py-1 text-[0.68rem] font-black leading-tight text-slate-900 shadow-sm transition group-hover:bg-white">
                  {card.title}
                </span>
              </button>
            ))}
          </div>

          <div className="absolute inset-x-4 bottom-4 z-20 grid grid-cols-4 gap-2 sm:hidden">
            {quickServices.map((card) => (
              <button
                key={card.title}
                type="button"
                onClick={() => handleQuickService(card.query)}
                className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-full border border-white bg-white/95 p-1.5 text-center shadow-lg"
                aria-label={`Browse ${card.query} services`}
              >
                <span className={`grid h-7 w-7 place-items-center rounded-full ${card.tint}`}>
                  <Icon name={card.icon} className="h-3.5 w-3.5" />
                </span>
                <span className="mt-1 text-[0.56rem] font-black leading-tight text-slate-900">{card.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;

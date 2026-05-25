const iconPaths = {
  logo: (
    <>
      <path
        d="M12 4a8 8 0 0 0-5.66 13.66l1.42-1.42A6 6 0 0 1 12 6V4Z"
        fill="currentColor"
      />
      <path
        d="M12 20a8 8 0 0 0 5.66-13.66l-1.42 1.42A6 6 0 0 1 12 18v2Z"
        fill="currentColor"
      />
      <path
        d="M4 12a8 8 0 0 0 13.66 5.66l-1.42-1.42A6 6 0 0 1 6 12H4Z"
        fill="currentColor"
      />
      <path
        d="M20 12A8 8 0 0 0 6.34 6.34l1.42 1.42A6 6 0 0 1 18 12h2Z"
        fill="currentColor"
      />
      <circle cx="12" cy="12" r="2.2" fill="currentColor" />
    </>
  ),
  menu: (
    <path
      d="M4 7h16M4 12h16M4 17h16"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="2"
    />
  ),
  close: (
    <path
      d="M7 7l10 10M17 7L7 17"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="2"
    />
  ),
  arrowLeft: (
    <path
      d="M14.5 6.5 9 12l5.5 5.5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  ),
  arrowRight: (
    <path
      d="M9.5 6.5 15 12l-5.5 5.5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  ),
  star: (
    <path
      d="m12 3.8 2.5 5 5.5.8-4 3.9.9 5.5L12 16.8 7.1 19l.9-5.5-4-3.9 5.5-.8 2.5-5Z"
      fill="currentColor"
    />
  ),
  search: (
    <>
      <circle
        cx="11"
        cy="11"
        r="5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="m15 15 4 4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </>
  ),
  wrench: (
    <path
      d="M14.8 4.2a4 4 0 0 0-3.7 5.4L5.2 15.5a1.8 1.8 0 1 0 2.5 2.5l5.9-5.9a4 4 0 0 0 5.4-3.7l-2.8 1-2.6-2.6 1.2-2.6Z"
      fill="currentColor"
    />
  ),
  bolt: <path d="M13 2 6 13h5l-1 9 8-12h-5l0-8Z" fill="currentColor" />,
  snow: (
    <path
      d="M12 2v20M5.1 5.1l13.8 13.8M18.9 5.1 5.1 18.9M3 12h18"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="2"
    />
  ),
  droplet: (
    <path
      d="M12 3c3 4.3 5 7.2 5 10a5 5 0 1 1-10 0c0-2.8 2-5.7 5-10Z"
      fill="currentColor"
    />
  ),
  spark: (
    <path
      d="m12 3 1.7 4.8L18.5 9l-4.8 1.2L12 15l-1.7-4.8L5.5 9l4.8-1.2L12 3Z"
      fill="currentColor"
    />
  ),
  hammer: (
    <path
      d="M14.8 4.5a3.5 3.5 0 0 0-5 0L8.6 5.7l2.5 2.5 1.2-1.2a1 1 0 0 1 1.4 1.4l-7.5 7.5a1.2 1.2 0 0 0 1.7 1.7l7.5-7.5a3.5 3.5 0 0 0 0-5Z"
      fill="currentColor"
    />
  ),
  users: (
    <>
      <circle cx="9" cy="9" r="3" fill="currentColor" />
      <circle cx="16" cy="10" r="2.5" fill="currentColor" opacity="0.8" />
      <path
        d="M4.5 18a4.5 4.5 0 0 1 9 0"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d="M13.5 18a3.5 3.5 0 0 1 5.5-2.8"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </>
  ),
  shield: (
    <path
      d="M12 3 5.5 5.5V11c0 4.1 2.6 7.2 6.5 10 3.9-2.8 6.5-5.9 6.5-10V5.5L12 3Zm-1.1 11.8-2.3-2.3 1.4-1.4 0.9 0.9 3.1-3.1 1.4 1.4-4.5 4.5Z"
      fill="currentColor"
    />
  ),
  location: (
    <path
      d="M12 21s6-5.6 6-11a6 6 0 1 0-12 0c0 5.4 6 11 6 11Zm0-8.2a2.8 2.8 0 1 1 0-5.6 2.8 2.8 0 0 1 0 5.6Z"
      fill="currentColor"
    />
  ),
  home: (
    <>
      <path
        d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10.5Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M9 21V13h6v8"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </>
  ),
  dashboard: (
    <>
      <rect
        x="4"
        y="4"
        width="7"
        height="7"
        rx="1.5"
        fill="currentColor"
      />
      <rect
        x="13"
        y="4"
        width="7"
        height="4"
        rx="1.5"
        fill="currentColor"
      />
      <rect
        x="13"
        y="10"
        width="7"
        height="10"
        rx="1.5"
        fill="currentColor"
      />
      <rect
        x="4"
        y="13"
        width="7"
        height="7"
        rx="1.5"
        fill="currentColor"
      />
    </>
  ),
  calendar: (
    <>
      <rect
        x="4"
        y="5"
        width="16"
        height="15"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M8 3v4M16 3v4M4 10h16"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </>
  ),
  bell: (
    <>
      <path
        d="M18 9a6 6 0 0 0-12 0c0 5-2 6-2 6h16s-2-1-2-6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M10 19a2 2 0 0 0 4 0"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="4" fill="currentColor" />
      <path
        d="M5 20a7 7 0 0 1 14 0"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </>
  ),
  logout: (
    <>
      <path
        d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d="M14 8l4 4-4 4M18 12H9"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </>
  ),
  facebook: (
    <>
      <path
        d="M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M15 8h-2a1 1 0 0 0-1 1v2H9v2h3v6h2v-6h2.5l.5-2H14v-1.2c0-.4.1-.8.7-.8H16V8Z"
        fill="currentColor"
      />
    </>
  ),
  instagram: (
    <>
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle
        cx="12"
        cy="12"
        r="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" />
    </>
  ),
  twitter: (
    <path
      d="M22 5.8a8.4 8.4 0 0 1-2.4.7 4.2 4.2 0 0 0 1.8-2.3 8.4 8.4 0 0 1-2.7 1A4.2 4.2 0 0 0 12 8.2a11.9 11.9 0 0 1-8.6-4.4 4.2 4.2 0 0 0 1.3 5.6 4.2 4.2 0 0 1-1.9-.5v.1a4.2 4.2 0 0 0 3.4 4.1 4.2 4.2 0 0 1-1.9.1 4.2 4.2 0 0 0 3.9 2.9 8.4 8.4 0 0 1-5.2 1.8A11.8 11.8 0 0 0 12 21c7.7 0 11.9-6.4 11.9-12v-.6A8.4 8.4 0 0 0 22 5.8Z"
      fill="currentColor"
    />
  ),
  whatsapp: (
    <path
      d="M16.5 13.5c-.2 0-1.1 0-2.3-.9-1.2-.9-2-1.3-2.3-1.3-.3 0-.6 0-.9.1-.2.1-.4.2-.6.4-.2.2-.6.6-.7.9-.1.3-.2.8-.2 1.1 0 .3.1.6.3.9.2.3.4.5.7.7.2.1.5.3.8.3.3 0 .5 0 .7-.1.2-.1.4-.1.7-.2.3-.1.8-.3 1.3-.6.4-.2.8-.4 1.1-.4.3 0 .6.1.8.2.2.1.3.3.4.5.1.2.1.4.1.7 0 .4-.1.8-.2 1.1-.1.4-.4.8-.7 1.1-.3.3-.8.6-1.3.8-.4.2-1 .2-1.6.2-.5 0-1.1 0-1.6-.1-.5-.1-1-.2-1.4-.4-.4-.2-.7-.5-1-.8-.3-.4-.5-.8-.6-1.2-.1-.4-.1-.8-.1-1.2 0-.8.1-1.5.4-2.2.3-.7.7-1.3 1.3-1.9.6-.6 1.2-1 2-1.3.8-.3 1.5-.4 2.3-.4.8 0 1.5.1 2.2.4.7.3 1.3.7 1.8 1.3.5.6.8 1.2 1 1.9.1.7.2 1.3.2 2 0 .5-.1 1.1-.3 1.6-.2.5-.5.9-.9 1.3-.4.4-.8.7-1.3.9"
      fill="currentColor"
    />
  ),
  phone: (
    <path
      d="M7.4 4.8c.4-.4 1-.6 1.5-.4l2.3 1a1.5 1.5 0 0 1 .8 1.9l-.5 1.5a1.5 1.5 0 0 0 .4 1.5l2.2 2.2a1.5 1.5 0 0 0 1.5.4l1.5-.5a1.5 1.5 0 0 1 1.9.8l1 2.3c.2.5 0 1.1-.4 1.5l-1.1 1.1c-.9.9-2.3 1.2-3.5.7-2.4-1-4.6-2.6-6.5-4.5-1.9-1.9-3.4-4.1-4.4-6.5-.5-1.2-.2-2.6.7-3.5l1.1-1.1Z"
      fill="currentColor"
    />
  ),
  currency: (
    <path
      d="M8 5h8M8 9h8M10 5c0 4-1.6 5.8-5 6h0c3.4.2 5 2 5 6"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    />
  ),
  check: (
    <path
      d="M6 12.5 10 16l8-8"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.4"
    />
  ),
  sun: (
    <>
      <circle
        cx="12"
        cy="12"
        r="3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 2.5v2M12 19.5v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2.5 12h2M19.5 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </>
  ),
  moon: (
    <path
      d="M19.2 14.5A7.4 7.4 0 0 1 9.5 4.8 7.9 7.9 0 1 0 19.2 14.5Z"
      fill="currentColor"
    />
  ),
};

function Icon({ name, className = "h-5 w-5" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {iconPaths[name]}
    </svg>
  );
}

export default Icon;

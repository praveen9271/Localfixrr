import { Link, useParams } from 'react-router'
import { ArrowLeft, CheckCircle2, FileText, HelpCircle, Mail, Phone, ShieldCheck } from 'lucide-react'

const pages = {
  'help-center': {
    eyebrow: 'Support',
    title: 'Help Center',
    description: 'Find quick answers about booking services, provider verification, payments, and account support.',
    icon: HelpCircle,
    sections: [
      {
        title: 'Booking Help',
        items: [
          'Search for a service and choose a provider from the available listings.',
          'Open the service details page to review provider information, pricing, and contact options.',
          'Track bookings from your customer dashboard after login.',
        ],
      },
      {
        title: 'Provider Help',
        items: [
          'Register as a service provider and select only one approved LocalFixr work type.',
          'Keep your phone number, service area, and business details updated.',
          'Admin can approve, suspend, or review provider profiles from the admin panel.',
        ],
      },
      {
        title: 'Account Support',
        items: [
          'Use Forgot Password to receive an OTP and reset your password securely.',
          'Contact LocalFixr if your account is blocked, inactive, or showing incorrect details.',
          'For urgent service issues, use the call option on the provider card.',
        ],
      },
    ],
  },
  terms: {
    eyebrow: 'Legal',
    title: 'Terms & Conditions',
    description: 'These terms explain how customers, providers, and administrators should use LocalFixr.',
    icon: FileText,
    sections: [
      {
        title: 'User Responsibilities',
        items: [
          'Users must provide accurate name, phone number, email, and address details.',
          'Users should not misuse booking, review, or provider contact features.',
          'Users are responsible for confirming service details before accepting work.',
        ],
      },
      {
        title: 'Provider Responsibilities',
        items: [
          'Providers must register under the correct approved service category.',
          'Providers should offer fair pricing, honest service descriptions, and professional conduct.',
          'LocalFixr admin may suspend providers for fake details, poor conduct, or repeated complaints.',
        ],
      },
      {
        title: 'Platform Use',
        items: [
          'LocalFixr may update services, categories, dashboard features, and policies when needed.',
          'Unauthorized access to admin or protected dashboard routes is not allowed.',
          'Continued use of LocalFixr means you accept these terms.',
        ],
      },
    ],
  },
  privacy: {
    eyebrow: 'Privacy',
    title: 'Privacy Policy',
    description: 'LocalFixr protects account, booking, and provider data with secure authentication and careful handling.',
    icon: ShieldCheck,
    sections: [
      {
        title: 'Information We Collect',
        items: [
          'Name, email, phone number, address, account role, and service preferences.',
          'Provider business details, category, service area, ratings, and booking history.',
          'Operational data such as notifications, reviews, reports, and admin activity logs.',
        ],
      },
      {
        title: 'How We Use Data',
        items: [
          'To create accounts, verify OTPs, manage bookings, and connect users with providers.',
          'To send password reset, subscription, and important account emails.',
          'To improve service quality, prevent abuse, and maintain platform security.',
        ],
      },
      {
        title: 'Security',
        items: [
          'Passwords are hashed before storage.',
          'Protected routes use JWT authentication and role-based access control.',
          'Sensitive environment values should stay private and must not be shared publicly.',
        ],
      },
    ],
  },
  'refund-policy': {
    eyebrow: 'Payments',
    title: 'Refund Policy',
    description: 'Refund handling depends on booking status, provider work progress, and admin review.',
    icon: CheckCircle2,
    sections: [
      {
        title: 'Eligible Refund Cases',
        items: [
          'Provider did not arrive or did not start the confirmed service.',
          'Booking was cancelled before the provider began work.',
          'Duplicate or incorrect payment was reported with valid proof.',
        ],
      },
      {
        title: 'Non-Refundable Cases',
        items: [
          'Service was completed and accepted by the customer.',
          'Customer provided incorrect address or was unavailable at the scheduled time.',
          'Damage or dispute claims without enough booking or payment proof.',
        ],
      },
      {
        title: 'Review Process',
        items: [
          'Admin reviews refund requests using booking details, payment status, and provider response.',
          'Approved refunds are processed through the original payment method where possible.',
          'Refund timelines may vary depending on bank or payment provider processing.',
        ],
      },
    ],
  },
}

function SupportPage() {
  const { slug = 'help-center' } = useParams()
  const page = pages[slug] || pages['help-center']
  const Icon = page.icon

  return (
    <main className="bg-slate-50">
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-indigo-600">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm font-black uppercase tracking-[0.18em] text-indigo-600">
              <Icon className="h-4 w-4" />
              {page.eyebrow}
            </div>
            <h1 className="mt-5 text-4xl font-black text-slate-950 sm:text-5xl">{page.title}</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">{page.description}</p>

            <div className="mt-8 grid gap-5">
              {page.sections.map((section) => (
                <section key={section.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-black text-slate-950">{section.title}</h2>
                  <div className="mt-4 space-y-3">
                    {section.items.map((item) => (
                      <div key={item} className="flex gap-3 text-sm leading-6 text-slate-600">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                        <p>{item}</p>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>

          <aside className="h-fit rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-lg font-black text-slate-950">Need help?</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Contact LocalFixr support for account, booking, provider, or refund questions.
            </p>
            <div className="mt-5 space-y-3">
              <a href="tel:+916280008301" className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">
                <Phone className="h-4 w-4" />
                +91 62800 08301
              </a>
              <a href="mailto:localfixr@gmail.com" className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700">
                <Mail className="h-4 w-4" />
                localfixr@gmail.com
              </a>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}

export default SupportPage

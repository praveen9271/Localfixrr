import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { getCurrentUser, getUserRole, logout } from '../services/authService'
import Icon from './Icon'
import logo from '../assets/logo.png'

const roleNavItems = {
  admin: [
    { path: '/dashboard/admin', label: 'Dashboard', icon: 'dashboard', exact: true },
    { path: '/dashboard/admin/users', label: 'Users', icon: 'users' },
    { path: '/dashboard/admin/providers', label: 'Providers', icon: 'home' },
    { path: '/dashboard/admin/services', label: 'Services', icon: 'wrench' },
    { path: '/dashboard/admin/categories', label: 'Categories', icon: 'dashboard' },
    { path: '/dashboard/admin/bookings', label: 'Bookings', icon: 'calendar' },
    { path: '/dashboard/admin/reviews', label: 'Reviews', icon: 'star' },
    { path: '/dashboard/admin/reports', label: 'Reports', icon: 'profile' },
    { path: '/dashboard/admin/notifications', label: 'Notifications', icon: 'bell' },
    { path: '/dashboard/admin/settings', label: 'Settings', icon: 'profile' },
  ],
  service_provider: [
    { path: '/dashboard/provider', label: 'Dashboard', icon: 'dashboard', exact: true },
    { path: '/dashboard/provider/bookings', label: 'Bookings', icon: 'calendar' },
    { path: '/dashboard/provider/services', label: 'My Services', icon: 'wrench' },
    { path: '/dashboard/provider/reviews', label: 'Reviews', icon: 'star' },
    { path: '/dashboard/provider/profile', label: 'Profile', icon: 'profile' },
  ],
  user: [
    { path: '/dashboard/user', label: 'Dashboard', icon: 'dashboard', exact: true },
    { path: '/dashboard/user/services', label: 'Browse Services', icon: 'search' },
    { path: '/dashboard/user/bookings', label: 'My Bookings', icon: 'calendar' },
    { path: '/dashboard/user/profile', label: 'Profile', icon: 'profile' },
  ],
}

const toTitleCase = (value) =>
  String(value || '')
    .replace(/_/g, ' ')
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')

const DashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const user = getCurrentUser()
  const role = getUserRole()
  const displayName = toTitleCase(user?.name) || 'User'
  const roleLabel = role === 'service_provider' ? 'Provider' : toTitleCase(role)

  const navItems = [
    { path: '/', label: 'Home', icon: 'home', exact: true },
    ...(roleNavItems[role] || roleNavItems.user),
  ]
  const sidebarNavItems = navItems.filter((item) => item.label !== 'Settings')

  const handleLogout = () => {
    logout()
    setProfileMenuOpen(false)
    navigate('/', { replace: true })
  }

  const handleSettings = () => {
    setProfileMenuOpen(false)
    if (role === 'admin') navigate('/dashboard/admin/settings')
    else if (role === 'service_provider') navigate('/dashboard/provider/profile')
    else navigate('/dashboard/user/profile')
  }

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path
    return location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
  }

  const activeNavItem = navItems
    .filter((item) => item.path !== '/')
    .find((item) => isActive(item))
  const dashboardTitle = activeNavItem?.label || 'Dashboard'

  return (
    <div className="flex h-screen bg-slate-50">
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 transform flex-col overflow-hidden bg-slate-900 text-white transition-transform duration-300 ease-in-out lg:static lg:inset-0 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between bg-slate-800 px-5">
          <Link to="/" className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
            <img src={logo} alt="LocalFixr logo" className="h-10 w-10 rounded-full bg-white object-contain p-1" />
            <span className="text-xl font-black tracking-tight">
              Local<span className="text-indigo-300">Fixr</span>
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="grid h-9 w-9 place-items-center rounded-lg text-gray-300 hover:bg-slate-700 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>

        <div className="shrink-0 border-b border-slate-700 px-6 py-4">
          <p className="text-sm text-gray-400">Welcome,</p>
          <p className="truncate font-semibold">{displayName}</p>
          <span className="mt-1 inline-block rounded-full bg-indigo-600 px-2 py-0.5 text-xs">
            {roleLabel}
          </span>
        </div>

        <nav className="sidebar-scroll min-h-0 flex-1 space-y-1 overflow-y-auto px-4 py-4">
          {sidebarNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              aria-current={isActive(item) ? 'page' : undefined}
              className={`flex items-center rounded-lg px-4 py-3 transition-colors ${
                isActive(item)
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Icon name={item.icon} className="mr-3 h-5 w-5 shrink-0" />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="shrink-0 border-t border-slate-700 px-4 py-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center rounded-lg px-4 py-3 text-left text-gray-300 transition-colors hover:bg-red-600 hover:text-white"
          >
            <Icon name="logout" className="mr-3 h-5 w-5 shrink-0" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white/85 px-4 shadow-sm backdrop-blur-xl sm:px-6">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
            aria-label="Open menu"
          >
            <Icon name="menu" className="h-5 w-5" />
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-3 px-3 lg:px-0">
            <img src={logo} alt="LocalFixr logo" className="hidden h-10 w-10 rounded-full border border-slate-200 bg-white object-contain p-1 sm:block" />
            <div className="min-w-0">
            <p className="truncate text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
              {role === 'service_provider' ? 'LocalFixr Provider' : role === 'admin' ? 'LocalFixr Admin' : 'LocalFixr Customer'}
            </p>
            <h1 className="truncate text-lg font-black text-slate-950">{dashboardTitle}</h1>
            </div>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileMenuOpen((current) => !current)}
              aria-expanded={profileMenuOpen}
              aria-haspopup="menu"
              className="flex items-center gap-3 rounded-xl px-2 py-1.5 text-left transition hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-100"
            >
              <div className="hidden text-right sm:block">
                <p className="max-w-40 truncate text-sm font-bold text-slate-900">{displayName}</p>
                <p className="text-xs text-slate-500">{roleLabel}</p>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-900 text-sm font-black text-white">
                {displayName.slice(0, 1).toUpperCase()}
              </div>
            </button>

            {profileMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-12 z-50 w-64 rounded-xl border border-slate-200 bg-white p-2 shadow-xl"
              >
                <div className="border-b border-slate-100 px-3 py-3">
                  <p className="truncate text-sm font-black text-slate-950">{displayName}</p>
                  <p className="truncate text-xs text-slate-500">{user?.email || 'Email Not Available'}</p>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleSettings}
                  className="mt-2 flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
                >
                  <Icon name="profile" className="mr-3 h-4 w-4 shrink-0" />
                  Settings
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50"
                >
                  <Icon name="logout" className="mr-3 h-4 w-4 shrink-0" />
                  Logout
                </button>
              </div>
            )}
            {profileMenuOpen && (
              <button
                type="button"
                aria-label="Close admin menu"
                className="fixed inset-0 z-40 cursor-default bg-transparent"
                onClick={() => setProfileMenuOpen(false)}
                tabIndex={-1}
              />
            )}
            </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout

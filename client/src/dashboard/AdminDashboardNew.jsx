import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Activity,
  ArrowRight,
  Bell,
  CalendarCheck,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Download,
  Eye,
  FileText,
  LayoutDashboard,
  Moon,
  PackageCheck,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Star,
  Sun,
  Trash2,
  UserCheck,
  Users,
  Wrench,
  XCircle,
} from 'lucide-react'
import {
  createAdminCategory,
  createAdminNotification,
  deleteAdminCategory,
  deleteReview,
  deleteService,
  deleteProvider,
  deleteUser,
  exportAdminUsersCsv,
  generateAdminReport,
  getAdminBookings,
  getAdminCategories,
  getAdminLogs,
  getAdminNotifications,
  getAdminReports,
  getAdminReviews,
  getAdminServices,
  getAdminStats,
  getAllProviders,
  getAllUsers,
  updateAdminBookingStatus,
  updateAdminCategory,
  updateProviderStatus,
  updateUser,
} from '../services/dashboardService'
import Alert from '../components/ui/Alert'
import ConfirmModal from '../components/ui/ConfirmModal'
import DraggableGrid from '../components/ui/DraggableGrid'
import EmptyState from '../components/ui/EmptyState'
import LoadingGrid from '../components/ui/LoadingGrid'
import Toast from '../components/ui/Toast'
import { formatCurrency, formatDate, formatDateTime, formatStatus } from '../utils/formatters'
import useDebounce from '../hooks/useDebounce'

const tabs = [
  { key: 'dashboard', label: 'Dashboard', path: '/dashboard/admin', icon: LayoutDashboard },
  { key: 'users', label: 'Users', path: '/dashboard/admin/users', icon: Users },
  { key: 'providers', label: 'Providers', path: '/dashboard/admin/providers', icon: UserCheck },
  { key: 'services', label: 'Services', path: '/dashboard/admin/services', icon: Wrench },
  { key: 'categories', label: 'Categories', path: '/dashboard/admin/categories', icon: PackageCheck },
  { key: 'bookings', label: 'Bookings', path: '/dashboard/admin/bookings', icon: CalendarCheck },
  { key: 'reviews', label: 'Reviews', path: '/dashboard/admin/reviews', icon: Star },
  { key: 'reports', label: 'Reports', path: '/dashboard/admin/reports', icon: FileText },
  { key: 'notifications', label: 'Notifications', path: '/dashboard/admin/notifications', icon: Bell },
  { key: 'settings', label: 'Settings', path: '/dashboard/admin/settings', icon: Settings },
]

const bookingStatuses = ['pending', 'confirmed', 'accepted', 'in_progress', 'completed', 'cancelled', 'rejected']
const statusTone = {
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  verified: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  paid: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  confirmed: 'bg-blue-50 text-blue-700 ring-blue-200',
  accepted: 'bg-blue-50 text-blue-700 ring-blue-200',
  in_progress: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  inactive: 'bg-slate-100 text-slate-600 ring-slate-200',
  blocked: 'bg-rose-50 text-rose-700 ring-rose-200',
  suspended: 'bg-rose-50 text-rose-700 ring-rose-200',
  rejected: 'bg-rose-50 text-rose-700 ring-rose-200',
  cancelled: 'bg-rose-50 text-rose-700 ring-rose-200',
}

const palette = ['#6d5dfc', '#22c55e', '#0ea5e9', '#f59e0b', '#ef4444', '#14b8a6', '#8b5cf6']

const cx = (...classes) => classes.filter(Boolean).join(' ')

function Badge({ status }) {
  const key = String(status || 'inactive')
  return (
    <span className={cx('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ring-1', statusTone[key] || statusTone.inactive)}>
      {formatStatus(key)}
    </span>
  )
}

function IconButton({ title, children, className, ...props }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      className={cx('grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50', className)}
      {...props}
    >
      {children}
    </button>
  )
}

function PrimaryButton({ children, className, ...props }) {
  return (
    <button
      type="button"
      className={cx('inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50', className)}
      {...props}
    >
      {children}
    </button>
  )
}

function Panel({ children, className }) {
  return (
    <section className={cx('rounded-xl border border-slate-200 bg-white shadow-sm', className)}>
      {children}
    </section>
  )
}

function KpiCard({ icon: Icon, label, value, hint, color, onClick }) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="group rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-indigo-200 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-indigo-100"
    >
      <div className="flex items-center gap-4">
        <span className={cx('grid h-12 w-12 shrink-0 place-items-center rounded-xl text-white transition group-hover:scale-105', color)}>
          <Icon className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
          <p className="mt-1 text-xs font-semibold text-emerald-600">{hint}</p>
        </div>
      </div>
    </motion.button>
  )
}

function DataTable({ columns, rows, emptyTitle, rowKey }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="px-4 py-3 font-black">{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-b border-slate-100 transition hover:bg-slate-50">
              {columns.map((column) => (
                <td key={column.key} className="px-4 py-3 align-middle text-slate-700">
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <EmptyState title={emptyTitle} message="Try adjusting the search or filters." />}
    </div>
  )
}

function AdminDashboardNew({ defaultTab = 'dashboard' }) {
  const navigate = useNavigate()
  const activeTab = defaultTab
  const [statsPayload, setStatsPayload] = useState({})
  const [users, setUsers] = useState([])
  const [providers, setProviders] = useState([])
  const [services, setServices] = useState([])
  const [bookings, setBookings] = useState([])
  const [reviews, setReviews] = useState([])
  const [categories, setCategories] = useState([])
  const [notifications, setNotifications] = useState([])
  const [reports, setReports] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(searchQuery.trim(), 500)
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [darkMode, setDarkMode] = useState(false)
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null, variant: 'danger' })
  const [categoryForm, setCategoryForm] = useState({ name: '', icon: 'Wrench', description: '', isActive: true })
  const [notificationForm, setNotificationForm] = useState({ title: '', message: '', type: 'info' })

  const stats = statsPayload.stats || {}
  const analytics = statsPayload.analytics || {}

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(''), 3200)
  }

  const loadDashboard = async () => {
    setLoading(true)
    setError('')
    try {
      const [
        statsData,
        usersData,
        providersData,
        servicesData,
        bookingsData,
        reviewsData,
        categoriesData,
        notificationsData,
        reportsData,
        logsData,
      ] = await Promise.all([
        getAdminStats(),
        getAllUsers({ limit: 100 }),
        getAllProviders({ limit: 100 }),
        getAdminServices({ limit: 100 }),
        getAdminBookings({ limit: 100 }),
        getAdminReviews({ limit: 100 }),
        getAdminCategories(),
        getAdminNotifications(),
        getAdminReports(),
        getAdminLogs(),
      ])
      setStatsPayload(statsData)
      setUsers(usersData.users || [])
      setProviders(providersData.providers || [])
      setServices(servicesData.services || [])
      setBookings(bookingsData.bookings || [])
      setReviews(reviewsData.reviews || [])
      setCategories(categoriesData.categories || [])
      setNotifications(notificationsData.notifications || [])
      setReports(reportsData.reports || [])
      setLogs(logsData.logs || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load admin dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDashboard()
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  const filtered = useMemo(() => {
    const q = debouncedSearchQuery.toLowerCase()
    const match = (values) => !q || values.some((value) => String(value || '').toLowerCase().includes(q))
    const statusMatch = (value) => statusFilter === 'all' || value === statusFilter
    const roleMatch = (value) => roleFilter === 'all' || value === roleFilter
    return {
      users: users.filter((user) => match([user.name, user.email, user.phone, user.role]) && roleMatch(user.role) && statusMatch(user.isBlocked ? 'blocked' : user.isActive ? 'active' : 'inactive')),
      providers: providers.filter((provider) => match([provider.businessName, provider.user?.name, provider.user?.email, provider.verificationStatus]) && statusMatch(provider.verificationStatus || (provider.isVerified ? 'verified' : 'pending'))),
      services: services.filter((service) => match([service.title, service.category, service.provider?.businessName]) && statusMatch(service.status)),
      bookings: bookings.filter((booking) => match([booking.customer?.name, booking.service?.title, booking.provider?.businessName, booking.status]) && statusMatch(booking.status)),
      reviews: reviews.filter((review) => match([review.user?.name, review.service?.title, review.comment])),
      categories: categories.filter((category) => match([category.name, category.description]) && statusMatch(category.isActive ? 'active' : 'inactive')),
      notifications: notifications.filter((notification) => match([notification.title, notification.message, notification.type])),
    }
  }, [bookings, categories, debouncedSearchQuery, notifications, providers, reviews, roleFilter, services, statusFilter, users])

  const runAction = async (action, successMessage) => {
    setSaving(true)
    try {
      await action()
      showToast(successMessage)
      await loadDashboard()
    } catch (err) {
      showToast(err.response?.data?.message || 'Action failed')
    } finally {
      setSaving(false)
    }
  }

  const confirmAction = (title, message, action, successMessage) => {
    setConfirmModal({
      open: true,
      title,
      message,
      variant: 'danger',
      onConfirm: () => runAction(action, successMessage),
    })
  }

  const exportUsers = async () => {
    try {
      const blob = await exportAdminUsersCsv()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'localfixr-users.csv'
      link.click()
      URL.revokeObjectURL(url)
      showToast('Users exported')
    } catch (err) {
      showToast(err.response?.data?.message || 'Unable to export users')
    }
  }

  const saveCategory = async () => {
    const payload = { ...categoryForm, name: categoryForm.name.trim(), description: categoryForm.description.trim() }
    if (!payload.name) {
      showToast('Category name is required')
      return
    }
    await runAction(() => createAdminCategory(payload), 'Category saved')
    setCategoryForm({ name: '', icon: 'Wrench', description: '', isActive: true })
  }

  const sendNotification = async () => {
    if (!notificationForm.title.trim() || !notificationForm.message.trim()) {
      showToast('Notification title and message are required')
      return
    }
    await runAction(() => createAdminNotification(notificationForm), 'Notification created')
    setNotificationForm({ title: '', message: '', type: 'info' })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-72 animate-pulse rounded bg-slate-200" />
        <LoadingGrid count={8} columns="md:grid-cols-4" />
      </div>
    )
  }

  const shellClass = darkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-950'
  const activeTabConfig = tabs.find((tab) => tab.key === activeTab) || tabs[0]

  const kpis = [
    { label: 'Total Users', value: stats.totalUsers || 0, hint: 'Marketplace Customers', icon: Users, color: 'bg-indigo-600', path: '/dashboard/admin/users', status: 'all', role: 'all' },
    { label: 'Total Providers', value: stats.totalProviders || 0, hint: `${stats.pendingProviderRequests || 0} Pending`, icon: UserCheck, color: 'bg-emerald-600', path: '/dashboard/admin/providers', status: 'all', role: 'all' },
    { label: 'Total Services', value: stats.totalServices || 0, hint: 'Listed Services', icon: Wrench, color: 'bg-sky-600', path: '/dashboard/admin/services', status: 'all', role: 'all' },
    { label: 'Total Bookings', value: stats.totalBookings || 0, hint: `${stats.activeBookings || 0} Active`, icon: CalendarCheck, color: 'bg-violet-600', path: '/dashboard/admin/bookings', status: 'all', role: 'all' },
    { label: 'Completed', value: stats.completedBookings || 0, hint: 'Finished Jobs', icon: CheckCircle2, color: 'bg-teal-600', path: '/dashboard/admin/bookings', status: 'completed', role: 'all' },
    { label: 'Cancelled', value: stats.cancelledBookings || 0, hint: 'Cancelled Jobs', icon: XCircle, color: 'bg-rose-600', path: '/dashboard/admin/bookings', status: 'cancelled', role: 'all' },
    { label: 'Monthly Revenue', value: formatCurrency(stats.totalRevenue), hint: 'Completed Bookings', icon: CircleDollarSign, color: 'bg-amber-600', path: '/dashboard/admin/reports', status: 'all', role: 'all' },
    { label: 'Reviews', value: stats.totalReviews || 0, hint: `${stats.blockedUsers || 0} Blocked Users`, icon: Star, color: 'bg-fuchsia-600', path: '/dashboard/admin/reviews', status: 'all', role: 'all' },
  ]

  return (
    <div className={cx('min-h-full rounded-xl p-0 transition', shellClass)}>
      <div className="space-y-6">
        <header className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-indigo-600">LocalFixr Admin Panel</p>
            <h1 className="mt-1 flex items-center gap-3 text-3xl font-black text-slate-950">
              <activeTabConfig.icon className="h-7 w-7 text-indigo-600" />
              {activeTabConfig.label}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search admin data"
                className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 md:w-72"
              />
            </div>
            <IconButton title={darkMode ? 'Light mode' : 'Dark mode'} onClick={() => setDarkMode((current) => !current)}>
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </IconButton>
            <IconButton title="Notifications" onClick={() => navigate('/dashboard/admin/notifications')}>
              <Bell className="h-4 w-4" />
            </IconButton>
            <PrimaryButton onClick={exportUsers}>
              <Download className="h-4 w-4" />
              Export
            </PrimaryButton>
          </div>
        </header>

        <Alert>{error}</Alert>

        <div className="flex gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => navigate(tab.path)}
                className={cx('inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition', active ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100')}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {activeTab !== 'dashboard' && (
          <Panel className="p-4">
            <div className="grid gap-3 md:grid-cols-[1fr_12rem_12rem]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={`Search ${activeTabConfig.label.toLowerCase()}`}
                  className="h-11 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
                />
              </div>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="blocked">Blocked</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="suspended">Suspended</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none">
                <option value="all">All roles</option>
                <option value="user">Users</option>
                <option value="service_provider">Providers</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          </Panel>
        )}

        {activeTab === 'dashboard' && (
          <>
            <DraggableGrid
              items={kpis}
              storageKey="localfixr-admin-dashboard-card-order"
              className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
              renderItem={(kpi) => (
                <KpiCard
                  key={kpi.label}
                  {...kpi}
                  onClick={() => {
                    setStatusFilter(kpi.status)
                    setRoleFilter(kpi.role)
                    navigate(kpi.path)
                  }}
                />
              )}
            />

            <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
              <Panel className="p-5">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-lg font-black text-slate-950">Monthly Bookings</h2>
                  <Badge status="active" />
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.bookingChart || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="bookings" radius={[8, 8, 0, 0]}>
                        {(analytics.bookingChart || []).map((entry, index) => (
                          <Cell key={entry.month} fill={palette[index % palette.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Panel>

              <Panel className="p-5">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-lg font-black text-slate-950">Recent Activity</h2>
                  <button type="button" onClick={() => navigate('/dashboard/admin/reports')} className="text-sm font-bold text-indigo-600">View all</button>
                </div>
                <div className="space-y-3">
                  {(statsPayload.recentActivities || logs.slice(0, 6)).map((item) => (
                    <div key={item.id || item._id} className="flex items-center gap-3 rounded-lg border border-slate-100 p-3">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-indigo-50 text-indigo-700">
                        <Activity className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-slate-800">{item.action}</p>
                        <p className="text-xs text-slate-500">{item.actor || item.adminId?.name || 'Admin'} - {formatStatus(item.targetCollection)}</p>
                      </div>
                      <span className="text-xs text-slate-400">{formatDate(item.createdAt)}</span>
                    </div>
                  ))}
                  {(statsPayload.recentActivities || []).length === 0 && logs.length === 0 && <EmptyState title="No activity yet" message="Admin actions will appear here." />}
                </div>
              </Panel>
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              <Panel className="p-5">
                <h2 className="mb-5 text-lg font-black text-slate-950">Revenue Trend</h2>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.revenueChart || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Line type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
              <Panel className="p-5">
                <h2 className="mb-5 text-lg font-black text-slate-950">User Growth</h2>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.userGrowth || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="users" stackId="1" stroke="#6d5dfc" fill="#c7d2fe" />
                      <Area type="monotone" dataKey="providers" stackId="1" stroke="#22c55e" fill="#bbf7d0" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
            </div>

            <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
              <Panel>
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <h2 className="text-lg font-black text-slate-950">Latest Bookings</h2>
                  <button type="button" onClick={() => navigate('/dashboard/admin/bookings')} className="inline-flex items-center gap-1 text-sm font-bold text-indigo-600">Open <ArrowRight className="h-4 w-4" /></button>
                </div>
                <DataTable
                  rows={statsPayload.latestBookings || bookings.slice(0, 6)}
                  rowKey={(booking) => booking._id}
                  emptyTitle="No bookings yet"
                  columns={[
                    { key: 'service', label: 'Service', render: (booking) => <span className="font-bold text-slate-950">{booking.service?.title || '-'}</span> },
                    { key: 'customer', label: 'Customer', render: (booking) => booking.customer?.name || '-' },
                    { key: 'amount', label: 'Amount', render: (booking) => formatCurrency(booking.totalAmount) },
                    { key: 'status', label: 'Status', render: (booking) => <Badge status={booking.status} /> },
                  ]}
                />
              </Panel>
              <Panel className="p-5">
                <h2 className="mb-4 text-lg font-black text-slate-950">Top-Rated Providers</h2>
                <div className="space-y-3">
                  {(statsPayload.topProviders || providers.slice(0, 5)).map((provider) => (
                    <div key={provider._id} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                      <div>
                        <p className="font-bold text-slate-950">{provider.businessName || provider.user?.name}</p>
                        <p className="text-xs text-slate-500">{provider.user?.email || 'Provider'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-amber-600">{Number(provider.rating || 0).toFixed(1)}</p>
                        <p className="text-xs text-slate-500">{provider.reviewsCount || 0} Reviews</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          </>
        )}

        {activeTab === 'users' && (
          <Panel>
            <DataTable
              rows={filtered.users}
              rowKey={(user) => user._id}
              emptyTitle="No users found"
              columns={[
                { key: 'name', label: 'Name', render: (user) => <span className="font-bold text-slate-950">{user.name}</span> },
                { key: 'email', label: 'Email' },
                { key: 'phone', label: 'Phone' },
                { key: 'role', label: 'Role', render: (user) => formatStatus(user.role) },
                { key: 'status', label: 'Status', render: (user) => <Badge status={user.isBlocked ? 'blocked' : user.isActive ? 'active' : 'inactive'} /> },
                {
                  key: 'actions',
                  label: 'Actions',
                  render: (user) => (
                    <div className="flex gap-2">
                      <IconButton title="View user"><Eye className="h-4 w-4" /></IconButton>
                      <IconButton title={user.isBlocked ? 'Activate user' : 'Suspend user'} disabled={saving} onClick={() => runAction(() => updateUser(user._id, { isBlocked: !user.isBlocked }), user.isBlocked ? 'User activated' : 'User suspended')}>
                        <ShieldCheck className="h-4 w-4" />
                      </IconButton>
                      {user.role !== 'admin' && (
                        <IconButton title="Delete user" className="text-rose-600 hover:bg-rose-50 hover:text-rose-700" disabled={saving} onClick={() => confirmAction('Delete user', `Delete ${user.name}?`, () => deleteUser(user._id), 'User deleted')}>
                          <Trash2 className="h-4 w-4" />
                        </IconButton>
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </Panel>
        )}

        {activeTab === 'providers' && (
          <Panel>
            <DataTable
              rows={filtered.providers}
              rowKey={(provider) => provider._id}
              emptyTitle="No providers found"
              columns={[
                { key: 'businessName', label: 'Business', render: (provider) => <div><p className="font-bold text-slate-950">{provider.businessName || provider.user?.name}</p><p className="text-xs text-slate-500">{provider.user?.email}</p></div> },
                { key: 'area', label: 'Area', render: (provider) => provider.serviceAreas?.[0] || provider.user?.address || '-' },
                { key: 'status', label: 'Status', render: (provider) => <Badge status={provider.verificationStatus || (provider.isVerified ? 'verified' : 'pending')} /> },
                { key: 'rating', label: 'Rating', render: (provider) => Number(provider.rating || 0).toFixed(1) },
                { key: 'earnings', label: 'Earnings', render: (provider) => formatCurrency(provider.earnings || 0) },
                {
                  key: 'actions',
                  label: 'Actions',
                  render: (provider) => (
                    <div className="flex gap-2">
                      <IconButton title="Approve provider" disabled={saving} onClick={() => runAction(() => updateProviderStatus(provider._id, 'verified'), 'Provider approved')} className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />
                      </IconButton>
                      <IconButton title="Suspend provider" disabled={saving} onClick={() => runAction(() => updateProviderStatus(provider._id, 'suspended'), 'Provider suspended')} className="text-amber-600 hover:bg-amber-50 hover:text-amber-700">
                        <XCircle className="h-4 w-4" />
                      </IconButton>
                      <IconButton title="Delete provider" disabled={saving} onClick={() => confirmAction('Delete provider', `Delete ${provider.businessName || provider.user?.name || 'this provider'} and all related data?`, () => deleteProvider(provider._id), 'Provider deleted')} className="text-rose-600 hover:bg-rose-50 hover:text-rose-700">
                        <Trash2 className="h-4 w-4" />
                      </IconButton>
                    </div>
                  ),
                },
              ]}
            />
          </Panel>
        )}

        {activeTab === 'services' && (
          <Panel>
            <DataTable
              rows={filtered.services}
              rowKey={(service) => service._id}
              emptyTitle="No services found"
              columns={[
                { key: 'title', label: 'Service', render: (service) => <span className="font-bold text-slate-950">{service.title}</span> },
                { key: 'category', label: 'Category' },
                { key: 'provider', label: 'Provider', render: (service) => service.provider?.businessName || service.provider?.user?.name || '-' },
                { key: 'price', label: 'Price', render: (service) => formatCurrency(service.price) },
                { key: 'status', label: 'Status', render: (service) => <Badge status={service.status} /> },
                { key: 'actions', label: 'Actions', render: (service) => <IconButton title="Delete service" className="text-rose-600 hover:bg-rose-50 hover:text-rose-700" disabled={saving} onClick={() => confirmAction('Delete service', `Delete ${service.title}? This will permanently remove the service, its bookings, and its reviews from the database.`, () => deleteService(service._id), 'Service and related records deleted')}><Trash2 className="h-4 w-4" /></IconButton> },
              ]}
            />
          </Panel>
        )}

        {activeTab === 'categories' && (
          <div className="grid gap-5 xl:grid-cols-[24rem_1fr]">
            <Panel className="p-5">
              <h2 className="text-lg font-black text-slate-950">Add Category</h2>
              <div className="mt-4 space-y-3">
                <input value={categoryForm.name} onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))} placeholder="Category name" className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-300" />
                <input value={categoryForm.icon} onChange={(event) => setCategoryForm((current) => ({ ...current, icon: event.target.value }))} placeholder="Icon name" className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-300" />
                <textarea value={categoryForm.description} onChange={(event) => setCategoryForm((current) => ({ ...current, description: event.target.value }))} placeholder="Description" rows="4" className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-indigo-300" />
                <label className="flex items-center gap-2 text-sm font-bold text-slate-600">
                  <input type="checkbox" checked={categoryForm.isActive} onChange={(event) => setCategoryForm((current) => ({ ...current, isActive: event.target.checked }))} />
                  Active
                </label>
                <PrimaryButton onClick={saveCategory} disabled={saving}><Plus className="h-4 w-4" /> Save Category</PrimaryButton>
              </div>
            </Panel>
            <Panel>
              <DataTable
                rows={filtered.categories}
                rowKey={(category) => category._id}
                emptyTitle="No categories found"
                columns={[
                  { key: 'name', label: 'Name', render: (category) => <span className="font-bold text-slate-950">{category.name}</span> },
                  { key: 'description', label: 'Description' },
                  { key: 'status', label: 'Status', render: (category) => <Badge status={category.isActive ? 'active' : 'inactive'} /> },
                  {
                    key: 'actions',
                    label: 'Actions',
                    render: (category) => (
                      <div className="flex gap-2">
                        <IconButton title="Toggle category" disabled={saving} onClick={() => runAction(() => updateAdminCategory(category._id, { isActive: !category.isActive }), 'Category updated')}>
                          <CheckCircle2 className="h-4 w-4" />
                        </IconButton>
                        <IconButton title="Delete category" className="text-rose-600 hover:bg-rose-50 hover:text-rose-700" disabled={saving} onClick={() => confirmAction('Delete category', `Delete ${category.name}?`, () => deleteAdminCategory(category._id), 'Category deleted')}>
                          <Trash2 className="h-4 w-4" />
                        </IconButton>
                      </div>
                    ),
                  },
                ]}
              />
            </Panel>
          </div>
        )}

        {activeTab === 'bookings' && (
          <Panel>
            <DataTable
              rows={filtered.bookings}
              rowKey={(booking) => booking._id}
              emptyTitle="No bookings found"
              columns={[
                { key: 'customer', label: 'Customer', render: (booking) => booking.customer?.name || '-' },
                { key: 'service', label: 'Service', render: (booking) => <span className="font-bold text-slate-950">{booking.service?.title || '-'}</span> },
                { key: 'provider', label: 'Provider', render: (booking) => booking.provider?.businessName || booking.provider?.user?.name || '-' },
                { key: 'date', label: 'Date', render: (booking) => formatDate(booking.date) },
                { key: 'amount', label: 'Amount', render: (booking) => formatCurrency(booking.totalAmount) },
                { key: 'status', label: 'Status', render: (booking) => <Badge status={booking.status} /> },
                {
                  key: 'actions',
                  label: 'Actions',
                  render: (booking) => (
                    <select value={booking.status} disabled={saving} onChange={(event) => runAction(() => updateAdminBookingStatus(booking._id, { status: event.target.value }), 'Booking updated')} className="h-9 rounded-lg border border-slate-200 px-2 text-xs font-bold outline-none">
                      {bookingStatuses.map((status) => <option key={status} value={status}>{formatStatus(status)}</option>)}
                    </select>
                  ),
                },
              ]}
            />
          </Panel>
        )}

        {activeTab === 'reviews' && (
          <Panel>
            <DataTable
              rows={filtered.reviews}
              rowKey={(review) => review._id}
              emptyTitle="No reviews found"
              columns={[
                { key: 'service', label: 'Service', render: (review) => review.service?.title || '-' },
                { key: 'user', label: 'User', render: (review) => review.user?.name || '-' },
                { key: 'provider', label: 'Provider', render: (review) => review.provider?.businessName || '-' },
                { key: 'rating', label: 'Rating', render: (review) => `${review.rating}/5` },
                { key: 'comment', label: 'Comment' },
                { key: 'actions', label: 'Actions', render: (review) => <IconButton title="Delete review" className="text-rose-600 hover:bg-rose-50 hover:text-rose-700" disabled={saving} onClick={() => confirmAction('Delete review', 'Remove this review?', () => deleteReview(review._id), 'Review deleted')}><Trash2 className="h-4 w-4" /></IconButton> },
              ]}
            />
          </Panel>
        )}

        {activeTab === 'reports' && (
          <div className="grid gap-5 xl:grid-cols-[1fr_24rem]">
            <Panel className="p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-black text-slate-950">Reports</h2>
                <PrimaryButton disabled={saving} onClick={() => runAction(() => generateAdminReport('operations'), 'Report generated')}>
                  <FileText className="h-4 w-4" />
                  Generate
                </PrimaryButton>
              </div>
              <div className="mt-5 space-y-3">
                {reports.map((report) => (
                  <div key={report._id} className="rounded-lg border border-slate-100 p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-black text-slate-950">{formatStatus(report.reportType)}</p>
                      <span className="text-xs text-slate-500">{formatDateTime(report.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">Generated by {report.generatedBy?.name || 'Admin'}</p>
                  </div>
                ))}
                {reports.length === 0 && <EmptyState title="No reports yet" message="Generate an operations report when needed." />}
              </div>
            </Panel>
            <Panel className="p-5">
              <h2 className="mb-4 text-lg font-black text-slate-950">Audit Logs</h2>
              <div className="space-y-3">
                {logs.slice(0, 8).map((log) => (
                  <div key={log._id} className="rounded-lg border border-slate-100 p-3">
                    <p className="text-sm font-bold text-slate-800">{log.action}</p>
                    <p className="text-xs text-slate-500">{log.adminId?.name || 'Admin'} - {formatDateTime(log.createdAt)}</p>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="grid gap-5 xl:grid-cols-[24rem_1fr]">
            <Panel className="p-5">
              <h2 className="text-lg font-black text-slate-950">Create Notification</h2>
              <div className="mt-4 space-y-3">
                <input value={notificationForm.title} onChange={(event) => setNotificationForm((current) => ({ ...current, title: event.target.value }))} placeholder="Title" className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-indigo-300" />
                <select value={notificationForm.type} onChange={(event) => setNotificationForm((current) => ({ ...current, type: event.target.value }))} className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none">
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="danger">Danger</option>
                </select>
                <textarea value={notificationForm.message} onChange={(event) => setNotificationForm((current) => ({ ...current, message: event.target.value }))} placeholder="Message" rows="5" className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-indigo-300" />
                <PrimaryButton disabled={saving} onClick={sendNotification}><Bell className="h-4 w-4" /> Send</PrimaryButton>
              </div>
            </Panel>
            <Panel>
              <DataTable
                rows={filtered.notifications}
                rowKey={(notification) => notification._id}
                emptyTitle="No notifications found"
                columns={[
                  { key: 'title', label: 'Title', render: (notification) => <span className="font-bold text-slate-950">{notification.title}</span> },
                  { key: 'message', label: 'Message' },
                  { key: 'type', label: 'Type', render: (notification) => <Badge status={notification.type} /> },
                  { key: 'read', label: 'Read', render: (notification) => notification.isRead ? 'Yes' : 'No' },
                  { key: 'createdAt', label: 'Created', render: (notification) => formatDate(notification.createdAt) },
                ]}
              />
            </Panel>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="grid gap-5 xl:grid-cols-3">
            <button
              type="button"
              onClick={() => runAction(loadDashboard, 'Admin access verified')}
              className="rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-indigo-200 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-indigo-100"
            >
              <ShieldCheck className="h-8 w-8 text-indigo-600" />
              <h2 className="mt-3 text-lg font-black text-slate-950">Access Control</h2>
              <p className="mt-2 text-sm text-slate-500">Admin routes are protected with JWT and role-based middleware.</p>
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard/admin/reports')}
              className="rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-emerald-200 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-emerald-100"
            >
              <ClipboardList className="h-8 w-8 text-emerald-600" />
              <h2 className="mt-3 text-lg font-black text-slate-950">Audit Trail</h2>
              <p className="mt-2 text-sm text-slate-500">{logs.length} recent admin actions are available in reports.</p>
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard/admin/notifications')}
              className="rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-amber-200 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-amber-100"
            >
              <Bell className="h-8 w-8 text-amber-600" />
              <h2 className="mt-3 text-lg font-black text-slate-950">Notifications</h2>
              <p className="mt-2 text-sm text-slate-500">{notifications.filter((item) => !item.isRead).length} unread notifications.</p>
            </button>
          </div>
        )}

        <ConfirmModal
          isOpen={confirmModal.open}
          title={confirmModal.title}
          message={confirmModal.message}
          variant={confirmModal.variant}
          onConfirm={confirmModal.onConfirm || (() => {})}
          onClose={() => setConfirmModal((current) => ({ ...current, open: false }))}
        />

        <Toast message={toast} />
      </div>
    </div>
  )
}

export default AdminDashboardNew

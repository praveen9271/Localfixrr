import { useEffect, useState } from 'react'
import { getProfile } from '../services/authService'
import { updateUserProfile, changeUserPassword } from '../services/dashboardService'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import Toast from '../components/ui/Toast'
import LoadingGrid from '../components/ui/LoadingGrid'

function UserProfile() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('profile')

  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    address: '',
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(''), 3000)
  }

  const loadProfile = async () => {
    setLoading(true)
    try {
      const data = await getProfile()
      const u = data.user || data
      setProfileForm({
        name: u.name || '',
        phone: u.phone || '',
        address: u.address || '',
      })
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProfile()
    }, 0)
    return () => clearTimeout(timer)
  }, [])

  const handleProfileSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await updateUserProfile(profileForm)
      const refreshed = await getProfile()
      const u = refreshed.user || refreshed
      localStorage.setItem('user', JSON.stringify(u))
      showToast('Profile updated successfully')
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()
    setError('')
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match')
      return
    }
    if (passwordForm.newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setSaving(true)
    try {
      await changeUserPassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      })
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      showToast('Password changed successfully')
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to change password')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 animate-pulse rounded bg-slate-200" />
        <LoadingGrid count={3} columns="md:grid-cols-3" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">Account</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">Profile & Settings</h1>
        <p className="mt-1 text-slate-500">Manage your personal information and security preferences.</p>
      </div>

      <Alert tone="error">{error}</Alert>

      <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
        {[
          { key: 'profile', label: 'Edit Profile' },
          { key: 'password', label: 'Change Password' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => { setActiveTab(tab.key); setError(''); }}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab.key ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSubmit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700">
              Full Name
              <input
                type="text"
                required
                value={profileForm.name}
                onChange={(e) => setProfileForm((c) => ({ ...c, name: e.target.value }))}
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-indigo-400 transition"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Phone Number
              <input
                type="tel"
                required
                pattern="[0-9]{10}"
                value={profileForm.phone}
                onChange={(e) => setProfileForm((c) => ({ ...c, phone: e.target.value }))}
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-indigo-400 transition"
              />
            </label>
          </div>
          <label className="block text-sm font-semibold text-slate-700">
            Address
            <textarea
              required
              rows={3}
              value={profileForm.address}
              onChange={(e) => setProfileForm((c) => ({ ...c, address: e.target.value }))}
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-indigo-400 transition resize-none"
            />
          </label>
          <div className="pt-2">
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </form>
      )}

      {activeTab === 'password' && (
        <form onSubmit={handlePasswordSubmit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-5 max-w-lg">
          <label className="block text-sm font-semibold text-slate-700">
            Current Password
            <input
              type="password"
              required
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm((c) => ({ ...c, currentPassword: e.target.value }))}
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-indigo-400 transition"
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            New Password
            <input
              type="password"
              required
              minLength={6}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm((c) => ({ ...c, newPassword: e.target.value }))}
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-indigo-400 transition"
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Confirm New Password
            <input
              type="password"
              required
              minLength={6}
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm((c) => ({ ...c, confirmPassword: e.target.value }))}
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none focus:border-indigo-400 transition"
            />
          </label>
          <div className="pt-2">
            <Button type="submit" disabled={saving}>{saving ? 'Updating...' : 'Update Password'}</Button>
          </div>
        </form>
      )}

      <Toast message={toast} />
    </div>
  )
}

export default UserProfile

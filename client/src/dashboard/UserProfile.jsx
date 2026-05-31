import { useCallback, useEffect, useState } from 'react'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import { getProfile } from '../services/authService'
import { updateUserProfile, changeUserPassword } from '../services/dashboardService'
import DeleteAccountPanel from '../components/account/DeleteAccountPanel'
import Alert from '../components/ui/Alert'
import Button from '../components/ui/Button'
import Toast from '../components/ui/Toast'
import LoadingGrid from '../components/ui/LoadingGrid'

const profileSchema = Yup.object({
  name: Yup.string().trim().min(2, 'Enter your full name.').required('Full name is required.'),
  phone: Yup.string()
    .matches(/^\d{10}$/, 'Enter a valid 10-digit mobile number.')
    .required('Phone number is required.'),
  address: Yup.string().trim().min(5, 'Enter your complete address.').required('Address is required.'),
})

const passwordSchema = Yup.object({
  currentPassword: Yup.string().required('Current password is required.'),
  newPassword: Yup.string()
    .min(8, 'Password must be at least 8 characters.')
    .matches(/[A-Z]/, 'Add at least one uppercase letter.')
    .matches(/[a-z]/, 'Add at least one lowercase letter.')
    .matches(/\d/, 'Add at least one number.')
    .required('New password is required.'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords must match.')
    .required('Confirm password is required.'),
})

function UserProfile() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('profile')
  const [userRole, setUserRole] = useState('')

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(''), 3000)
  }

  const profileFormik = useFormik({
    initialValues: { name: '', phone: '', address: '' },
    validationSchema: profileSchema,
    onSubmit: async (values) => {
      setSaving(true)
      setError('')
      try {
        await updateUserProfile(values)
        const refreshed = await getProfile()
        const u = refreshed.user || refreshed
        localStorage.setItem('user', JSON.stringify(u))
        showToast('Profile updated successfully')
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to update profile')
      } finally {
        setSaving(false)
      }
    },
  })

  const passwordFormik = useFormik({
    initialValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    validationSchema: passwordSchema,
    onSubmit: async (values, { resetForm }) => {
      setError('')
      setSaving(true)
      try {
        await changeUserPassword(values)
        resetForm()
        showToast('Password changed successfully')
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to change password')
      } finally {
        setSaving(false)
      }
    },
  })

  const { setValues: setProfileValues } = profileFormik

  const loadProfile = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getProfile()
      const u = data.user || data
      setProfileValues({
        name: u.name || '',
        phone: u.phone || '',
        address: u.address || '',
      })
      setUserRole(u.role || '')
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load profile')
    } finally {
      setLoading(false)
    }
  }, [setProfileValues])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProfile()
    }, 0)
    return () => clearTimeout(timer)
  }, [loadProfile])

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
          { key: 'delete', label: 'Delete Account' },
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
        <form onSubmit={profileFormik.handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700">
              Full Name <span className="text-rose-500">*</span>
              <input
                name="name"
                type="text"
                value={profileFormik.values.name}
                onChange={profileFormik.handleChange}
                onBlur={profileFormik.handleBlur}
                className={`mt-2 w-full rounded-lg border px-4 py-3 outline-none transition focus:border-indigo-400 ${
                  profileFormik.touched.name && profileFormik.errors.name ? 'border-rose-300 bg-rose-50' : 'border-slate-200'
                }`}
              />
              {profileFormik.touched.name && profileFormik.errors.name && (
                <span className="mt-2 block text-xs font-semibold text-rose-600">{profileFormik.errors.name}</span>
              )}
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Phone Number <span className="text-rose-500">*</span>
              <input
                name="phone"
                type="tel"
                value={profileFormik.values.phone}
                onChange={(event) => profileFormik.setFieldValue('phone', event.target.value.replace(/\D/g, '').slice(0, 10))}
                onBlur={() => profileFormik.setFieldTouched('phone', true)}
                className={`mt-2 w-full rounded-lg border px-4 py-3 outline-none transition focus:border-indigo-400 ${
                  profileFormik.touched.phone && profileFormik.errors.phone ? 'border-rose-300 bg-rose-50' : 'border-slate-200'
                }`}
              />
              {profileFormik.touched.phone && profileFormik.errors.phone && (
                <span className="mt-2 block text-xs font-semibold text-rose-600">{profileFormik.errors.phone}</span>
              )}
            </label>
          </div>
          <label className="block text-sm font-semibold text-slate-700">
            Address <span className="text-rose-500">*</span>
            <textarea
              name="address"
              rows={3}
              value={profileFormik.values.address}
              onChange={profileFormik.handleChange}
              onBlur={profileFormik.handleBlur}
              className={`mt-2 w-full resize-none rounded-lg border px-4 py-3 outline-none transition focus:border-indigo-400 ${
                profileFormik.touched.address && profileFormik.errors.address ? 'border-rose-300 bg-rose-50' : 'border-slate-200'
              }`}
            />
            {profileFormik.touched.address && profileFormik.errors.address && (
              <span className="mt-2 block text-xs font-semibold text-rose-600">{profileFormik.errors.address}</span>
            )}
          </label>
          <div className="pt-2">
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </form>
      )}

      {activeTab === 'password' && (
        <form onSubmit={passwordFormik.handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-5 max-w-lg">
          <label className="block text-sm font-semibold text-slate-700">
            Current Password <span className="text-rose-500">*</span>
            <input
              name="currentPassword"
              type="password"
              value={passwordFormik.values.currentPassword}
              onChange={passwordFormik.handleChange}
              onBlur={passwordFormik.handleBlur}
              className={`mt-2 w-full rounded-lg border px-4 py-3 outline-none transition focus:border-indigo-400 ${
                passwordFormik.touched.currentPassword && passwordFormik.errors.currentPassword ? 'border-rose-300 bg-rose-50' : 'border-slate-200'
              }`}
            />
            {passwordFormik.touched.currentPassword && passwordFormik.errors.currentPassword && (
              <span className="mt-2 block text-xs font-semibold text-rose-600">{passwordFormik.errors.currentPassword}</span>
            )}
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            New Password <span className="text-rose-500">*</span>
            <input
              name="newPassword"
              type="password"
              value={passwordFormik.values.newPassword}
              onChange={passwordFormik.handleChange}
              onBlur={passwordFormik.handleBlur}
              className={`mt-2 w-full rounded-lg border px-4 py-3 outline-none transition focus:border-indigo-400 ${
                passwordFormik.touched.newPassword && passwordFormik.errors.newPassword ? 'border-rose-300 bg-rose-50' : 'border-slate-200'
              }`}
            />
            {passwordFormik.touched.newPassword && passwordFormik.errors.newPassword && (
              <span className="mt-2 block text-xs font-semibold text-rose-600">{passwordFormik.errors.newPassword}</span>
            )}
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Confirm New Password <span className="text-rose-500">*</span>
            <input
              name="confirmPassword"
              type="password"
              value={passwordFormik.values.confirmPassword}
              onChange={passwordFormik.handleChange}
              onBlur={passwordFormik.handleBlur}
              className={`mt-2 w-full rounded-lg border px-4 py-3 outline-none transition focus:border-indigo-400 ${
                passwordFormik.touched.confirmPassword && passwordFormik.errors.confirmPassword ? 'border-rose-300 bg-rose-50' : 'border-slate-200'
              }`}
            />
            {passwordFormik.touched.confirmPassword && passwordFormik.errors.confirmPassword && (
              <span className="mt-2 block text-xs font-semibold text-rose-600">{passwordFormik.errors.confirmPassword}</span>
            )}
          </label>
          <div className="pt-2">
            <Button type="submit" disabled={saving}>{saving ? 'Updating...' : 'Update Password'}</Button>
          </div>
        </form>
      )}

      {activeTab === 'delete' && (
        <DeleteAccountPanel userRole={userRole} onError={setError} />
      )}

      <Toast message={toast} />
    </div>
  )
}

export default UserProfile

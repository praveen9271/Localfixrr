import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { useFormik } from 'formik'
import { AlertTriangle, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import * as Yup from 'yup'
import { logout } from '../../services/authService'
import { deleteAccount } from '../../services/dashboardService'
import Button from '../ui/Button'

const deleteSchema = Yup.object({
  confirmation: Yup.string()
    .oneOf(['DELETE'], 'Type DELETE to confirm.')
    .required('Confirmation is required.'),
})

function DeleteAccountPanel({ userRole, onError }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const formik = useFormik({
    initialValues: { confirmation: '' },
    validationSchema: deleteSchema,
    validateOnMount: true,
    onSubmit: async (values) => {
      setSaving(true)
      onError?.('')
      try {
        await deleteAccount(values.confirmation)
        logout()
        setOpen(false)
        navigate('/', { replace: true })
      } catch (error) {
        onError?.(error.response?.data?.message || 'Unable to delete account')
      } finally {
        setSaving(false)
      }
    },
  })

  const closeDialog = () => {
    if (saving) return
    formik.resetForm()
    setOpen(false)
  }

  return (
    <>
      <section className="rounded-xl border border-rose-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-600">Danger zone</p>
        <h2 className="mt-2 text-2xl font-black text-slate-900">Delete account</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          This permanently removes your profile, bookings, reviews, notifications, and account access.
          Service provider accounts also remove provider profile data and service listings.
        </p>
        {userRole === 'admin' ? (
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            Admin accounts cannot be deleted from self-service settings.
          </div>
        ) : (
          <Button
            type="button"
            variant="danger"
            className="mt-6"
            onClick={() => {
              formik.resetForm()
              setOpen(true)
            }}
          >
            Delete Account
          </Button>
        )}
      </section>

      <Dialog open={open} onClose={closeDialog} className="relative z-[90]">
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 grid place-items-center px-4 py-6">
          <DialogPanel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_28px_90px_rgba(15,23,42,0.35)]">
            <div className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600">
                  <AlertTriangle className="h-6 w-6" />
                </span>
                <div>
                  <DialogTitle className="text-xl font-black text-slate-950">Delete account permanently?</DialogTitle>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    This cannot be undone. Your account and related database records will be deleted.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeDialog}
                className="grid h-9 w-9 cursor-pointer place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                aria-label="Close delete account dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={formik.handleSubmit} className="mt-6">
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-800">
                Type <span className="font-black">DELETE</span> to confirm account deletion.
              </div>
              <label className="mt-5 block text-sm font-semibold text-slate-700">
                Confirmation <span className="text-rose-500">*</span>
                <input
                  name="confirmation"
                  type="text"
                  value={formik.values.confirmation}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`mt-2 w-full rounded-lg border px-4 py-3 outline-none transition focus:border-rose-300 focus:ring-4 focus:ring-rose-50 ${
                    formik.touched.confirmation && formik.errors.confirmation ? 'border-rose-300 bg-rose-50' : 'border-slate-200'
                  }`}
                  placeholder="DELETE"
                  autoComplete="off"
                />
                {formik.touched.confirmation && formik.errors.confirmation && (
                  <span className="mt-2 block text-xs font-semibold text-rose-600">{formik.errors.confirmation}</span>
                )}
              </label>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button type="button" variant="secondary" onClick={closeDialog}>Cancel</Button>
                <Button type="submit" variant="danger" disabled={saving || !formik.isValid}>
                  {saving ? 'Deleting...' : 'Delete permanently'}
                </Button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  )
}

export default DeleteAccountPanel

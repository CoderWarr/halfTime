/**
 * Toast helpers wrapping react-hot-toast with consistent CampusPulse styling.
 * Mount <Toaster /> once at the top of the app tree (see App.jsx).
 */
import { Toaster as HotToaster, toast as hotToast } from 'react-hot-toast'

const BASE_STYLE = {
  borderRadius: '12px',
  padding: '12px 16px',
  fontSize: '14px',
}

export const toast = {
  success: (msg) =>
    hotToast.success(msg, {
      style: { ...BASE_STYLE, background: '#ecfdf5', color: '#065f46' },
      iconTheme: { primary: '#10b981', secondary: '#ecfdf5' },
    }),
  error: (msg) =>
    hotToast.error(msg, {
      style: { ...BASE_STYLE, background: '#fef2f2', color: '#991b1b' },
      iconTheme: { primary: '#ef4444', secondary: '#fef2f2' },
    }),
  info: (msg) =>
    hotToast(msg, {
      style: { ...BASE_STYLE, background: '#eef2ff', color: '#3730a3' },
    }),
}

export function Toaster() {
  return (
    <HotToaster
      position="bottom-center"
      toastOptions={{ duration: 3000 }}
    />
  )
}

export const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim())

export const isValidPhone = (value) => /^[0-9]{10}$/.test(value)

export const required = (value) => String(value || '').trim().length > 0

export const validateRegisterForm = ({ name, email, phone, address, password, confirmPassword }) => {
  if (!required(name) || !required(email) || !required(phone) || !required(address) || !required(password)) {
    return 'Please fill in all required fields'
  }
  if (!isValidEmail(email)) return 'Enter a valid email address'
  if (!isValidPhone(phone)) return 'Enter a valid 10-digit phone number'
  if (password.length < 6) return 'Password must be at least 6 characters'
  if (password !== confirmPassword) return 'Passwords do not match'
  return ''
}

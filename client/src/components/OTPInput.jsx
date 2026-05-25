function OTPInput({ value, onChange, disabled = false }) {
  const digits = String(value || '').padEnd(6, ' ').slice(0, 6).split('')

  const setDigit = (index, nextValue) => {
    const clean = nextValue.replace(/\D/g, '')
    const current = String(value || '').padEnd(6, ' ').slice(0, 6).split('')

    if (clean.length > 1) {
      onChange(clean.slice(0, 6))
      return
    }

    current[index] = clean
    onChange(current.join('').replace(/\s/g, '').slice(0, 6))
  }

  const handleKeyDown = (event, index) => {
    if (event.key === 'Backspace' && !digits[index].trim() && index > 0) {
      event.currentTarget.previousElementSibling?.focus()
    }
  }

  return (
    <div className="grid grid-cols-6 gap-2">
      {digits.map((digit, index) => (
        <input
          key={index}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          disabled={disabled}
          value={digit.trim()}
          onChange={(event) => {
            setDigit(index, event.target.value)
            if (event.target.value && index < 5) {
              event.currentTarget.nextElementSibling?.focus()
            }
          }}
          onKeyDown={(event) => handleKeyDown(event, index)}
          onPaste={(event) => {
            event.preventDefault()
            onChange(event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6))
          }}
          className="h-12 rounded-xl border border-slate-200 bg-white text-center text-xl font-black text-slate-950 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 disabled:opacity-60 sm:h-14"
          aria-label={`OTP digit ${index + 1}`}
        />
      ))}
    </div>
  )
}

export default OTPInput

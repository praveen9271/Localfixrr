export const getHeaderOffset = () => {
  const header = document.querySelector('[data-app-header]')
  return (header?.offsetHeight || 84) + 12
}

export const scrollToSection = (id) => {
  const target = document.getElementById(id)
  if (!target) return

  const top = target.getBoundingClientRect().top + window.scrollY - getHeaderOffset()
  window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' })
}

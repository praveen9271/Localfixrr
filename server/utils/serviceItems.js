const serviceItemTemplates = {
  'Appliance Repair': [
    ['AC General Service', 499, 'Complete cleaning and basic cooling inspection', '60 min'],
    ['AC Deep Cleaning', 899, 'Deep cleaning of indoor and outdoor units', '90 min'],
    ['AC Gas Refilling', 1999, 'Gas top-up with leak and pressure check', '90-120 min'],
    ['AC Installation', 1499, 'Wall-mounted AC installation with basic fitting', '120 min'],
    ['AC Uninstallation', 799, 'Safe removal of indoor and outdoor AC units', '60 min'],
    ['AC PCB Repair', 2499, 'Diagnosis and repair of common PCB faults', '120 min'],
    ['AC Water Leakage Fix', 699, 'Drainage line cleaning and leakage correction', '45-60 min'],
  ],
  Plumbing: [
    ['Tap Repair', 199, 'Repair loose, noisy, or leaking taps', '30 min'],
    ['Pipe Leakage Repair', 299, 'Leak inspection and minor pipe repair', '45 min'],
    ['Wash Basin Installation', 599, 'Install wash basin with basic fittings', '60 min'],
    ['Toilet Seat Replacement', 499, 'Replace toilet seat and align fittings', '45 min'],
    ['Water Tank Cleaning', 1499, 'Deep cleaning and sanitization of water tank', '120 min'],
    ['Motor Installation', 999, 'Install household water motor with basic setup', '90 min'],
  ],
  Electrical: [
    ['Switch Board Repair', 199, 'Inspect and repair common switch board faults', '30 min'],
    ['Fan Installation', 299, 'Install ceiling or wall fan', '45 min'],
    ['Light Installation', 149, 'Install light fixture or holder', '30 min'],
    ['Wiring Repair', 499, 'Fault tracing and minor wiring repair', '60 min'],
    ['MCB Replacement', 399, 'Replace faulty MCB with safety check', '45 min'],
  ],
  Carpentry: [
    ['Door Repair', 399, 'Fix hinges, alignment, and minor door issues', '60 min'],
    ['Furniture Assembly', 699, 'Assemble household furniture items', '90 min'],
    ['Bed Repair', 799, 'Repair bed frame, joints, or support issues', '90 min'],
    ['Wardrobe Repair', 999, 'Repair wardrobe shutters, hinges, or channels', '120 min'],
  ],
  Painting: [
    ['Wall Painting', 299, 'Interior and exterior wall painting', 'Depends on area'],
    ['Texture Painting', 499, 'Designer texture finish for feature walls', 'Depends on area'],
    ['Putty Work', 249, 'Wall putty application and surface leveling', 'Depends on area'],
    ['Waterproof Coating', 699, 'Waterproof coating for damp walls', 'Depends on area'],
    ['Ceiling Painting', 349, 'Ceiling surface preparation and painting', 'Depends on area'],
  ],
  Cleaning: [
    ['Bathroom Deep Cleaning', 499, 'Tiles, fittings, floor, and stain cleaning', '60 min'],
    ['Kitchen Deep Cleaning', 899, 'Counter, sink, chimney exterior, and cabinet exterior cleaning', '90 min'],
    ['Sofa Cleaning', 799, 'Fabric sofa vacuuming and shampoo cleaning', '60-90 min'],
    ['Home Deep Cleaning', 2499, 'Full home deep cleaning for occupied homes', '4-6 hours'],
    ['Move-in Cleaning', 2999, 'Empty home cleaning before shifting', '5-7 hours'],
  ],
  'Home Maintenance': [
    ['General Inspection', 299, 'Basic home issue inspection and estimate', '45 min'],
    ['Minor Repair Visit', 499, 'Small household repairs in one visit', '60 min'],
    ['Door and Window Fix', 399, 'Minor alignment, hinge, or latch repair', '60 min'],
    ['Bathroom Fitting Fix', 349, 'Minor fitting tightening and replacement support', '45 min'],
    ['Quarterly Maintenance', 1499, 'Preventive checkup for common home issues', '2-3 hours'],
  ],
}

const normalizeServiceItem = (item) => ({
  ...(item?._id ? { _id: item._id } : {}),
  name: String(item?.name || '').trim(),
  price: Number(item?.price),
  description: String(item?.description || '').trim(),
  duration: String(item?.duration || '').trim(),
})

const buildServiceItemsFromTemplate = (category, fallbackPrice = 0, fallbackTitle = 'General Service') => {
  const template = serviceItemTemplates[category]

  if (template?.length) {
    return template.map(([name, price, description, duration]) => ({
      name,
      price,
      description,
      duration,
    }))
  }

  return [{
    name: fallbackTitle,
    price: Number(fallbackPrice) || 0,
    description: 'Standard visit, inspection, and basic service support',
    duration: '60 min',
  }]
}

const sanitizeServiceItems = (items, fallback = {}) => {
  const sanitized = Array.isArray(items)
    ? items
      .map(normalizeServiceItem)
      .filter((item) => item.name && Number.isFinite(item.price) && item.price >= 0)
    : []

  if (sanitized.length) return sanitized

  return buildServiceItemsFromTemplate(fallback.category, fallback.price, fallback.title)
}

const getStartingPrice = (items, fallbackPrice = 0) => {
  const prices = (Array.isArray(items) ? items : [])
    .map((item) => Number(item?.price))
    .filter((price) => Number.isFinite(price) && price >= 0)

  if (!prices.length) return Number(fallbackPrice) || 0
  return Math.min(...prices)
}

export {
  buildServiceItemsFromTemplate,
  getStartingPrice,
  sanitizeServiceItems,
}

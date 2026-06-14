export const SERVICE_ITEM_TEMPLATES = {
  'Appliance Repair': [
    { name: 'AC General Service', price: 499, description: 'Complete cleaning and basic cooling inspection', duration: '60 min' },
    { name: 'AC Deep Cleaning', price: 899, description: 'Deep cleaning of indoor and outdoor units', duration: '90 min' },
    { name: 'AC Gas Refilling', price: 1999, description: 'Gas top-up with leak and pressure check', duration: '90-120 min' },
    { name: 'AC Installation', price: 1499, description: 'Wall-mounted AC installation with basic fitting', duration: '120 min' },
    { name: 'AC Uninstallation', price: 799, description: 'Safe removal of indoor and outdoor AC units', duration: '60 min' },
    { name: 'AC PCB Repair', price: 2499, description: 'Diagnosis and repair of common PCB faults', duration: '120 min' },
    { name: 'AC Water Leakage Fix', price: 699, description: 'Drainage line cleaning and leakage correction', duration: '45-60 min' },
  ],
  Plumbing: [
    { name: 'Tap Repair', price: 199, description: 'Repair loose, noisy, or leaking taps', duration: '30 min' },
    { name: 'Pipe Leakage Repair', price: 299, description: 'Leak inspection and minor pipe repair', duration: '45 min' },
    { name: 'Wash Basin Installation', price: 599, description: 'Install wash basin with basic fittings', duration: '60 min' },
    { name: 'Toilet Seat Replacement', price: 499, description: 'Replace toilet seat and align fittings', duration: '45 min' },
    { name: 'Water Tank Cleaning', price: 1499, description: 'Deep cleaning and sanitization of water tank', duration: '120 min' },
    { name: 'Motor Installation', price: 999, description: 'Install household water motor with basic setup', duration: '90 min' },
  ],
  Electrical: [
    { name: 'Switch Board Repair', price: 199, description: 'Inspect and repair common switch board faults', duration: '30 min' },
    { name: 'Fan Installation', price: 299, description: 'Install ceiling or wall fan', duration: '45 min' },
    { name: 'Light Installation', price: 149, description: 'Install light fixture or holder', duration: '30 min' },
    { name: 'Wiring Repair', price: 499, description: 'Fault tracing and minor wiring repair', duration: '60 min' },
    { name: 'MCB Replacement', price: 399, description: 'Replace faulty MCB with safety check', duration: '45 min' },
  ],
  Carpentry: [
    { name: 'Door Repair', price: 399, description: 'Fix hinges, alignment, and minor door issues', duration: '60 min' },
    { name: 'Furniture Assembly', price: 699, description: 'Assemble household furniture items', duration: '90 min' },
    { name: 'Bed Repair', price: 799, description: 'Repair bed frame, joints, or support issues', duration: '90 min' },
    { name: 'Wardrobe Repair', price: 999, description: 'Repair wardrobe shutters, hinges, or channels', duration: '120 min' },
  ],
  Painting: [
    { name: 'Wall Painting', price: 299, description: 'Interior and exterior wall painting', duration: 'Depends on area' },
    { name: 'Texture Painting', price: 499, description: 'Designer texture finish for feature walls', duration: 'Depends on area' },
    { name: 'Putty Work', price: 249, description: 'Wall putty application and surface leveling', duration: 'Depends on area' },
    { name: 'Waterproof Coating', price: 699, description: 'Waterproof coating for damp walls', duration: 'Depends on area' },
    { name: 'Ceiling Painting', price: 349, description: 'Ceiling surface preparation and painting', duration: 'Depends on area' },
  ],
  Cleaning: [
    { name: 'Bathroom Deep Cleaning', price: 499, description: 'Tiles, fittings, floor, and stain cleaning', duration: '60 min' },
    { name: 'Kitchen Deep Cleaning', price: 899, description: 'Counter, sink, chimney exterior, and cabinet exterior cleaning', duration: '90 min' },
    { name: 'Sofa Cleaning', price: 799, description: 'Fabric sofa vacuuming and shampoo cleaning', duration: '60-90 min' },
    { name: 'Home Deep Cleaning', price: 2499, description: 'Full home deep cleaning for occupied homes', duration: '4-6 hours' },
    { name: 'Move-in Cleaning', price: 2999, description: 'Empty home cleaning before shifting', duration: '5-7 hours' },
  ],
  'Home Maintenance': [
    { name: 'General Inspection', price: 299, description: 'Basic home issue inspection and estimate', duration: '45 min' },
    { name: 'Minor Repair Visit', price: 499, description: 'Small household repairs in one visit', duration: '60 min' },
    { name: 'Door and Window Fix', price: 399, description: 'Minor alignment, hinge, or latch repair', duration: '60 min' },
    { name: 'Bathroom Fitting Fix', price: 349, description: 'Minor fitting tightening and replacement support', duration: '45 min' },
    { name: 'Quarterly Maintenance', price: 1499, description: 'Preventive checkup for common home issues', duration: '2-3 hours' },
  ],
}

const toText = (value, fallback = '') => {
  if (value === null || value === undefined) return fallback
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return fallback
}

const normalizeServiceItem = (item) => ({
  ...(item?._id ? { _id: item._id } : {}),
  name: toText(item?.name).trim(),
  price: Number(item?.price),
  description: toText(item?.description).trim(),
  duration: toText(item?.duration).trim(),
})

export const getServiceItems = (service) => {
  const explicitItems = Array.isArray(service?.serviceItems)
    ? service.serviceItems
      .map(normalizeServiceItem)
      .filter((item) => item.name && Number.isFinite(item.price) && item.price >= 0)
    : []

  if (explicitItems.length) return explicitItems

  return SERVICE_ITEM_TEMPLATES[service?.category] || [{
    name: toText(service?.title, 'General Service'),
    price: Number(service?.price) || 0,
    description: toText(service?.description, 'Standard visit, inspection, and basic service support'),
    duration: service?.duration ? `${toText(service.duration)} min` : '60 min',
  }]
}

export const getStartingPrice = (service) =>
  Math.min(...getServiceItems(service).map((item) => Number(item.price) || 0))

export const makeBlankServiceItem = () => ({
  name: '',
  price: '',
  description: '',
  duration: '',
})

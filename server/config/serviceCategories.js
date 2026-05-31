const SERVICE_CATEGORIES = [
  'Plumbing',
  'Electrical',
  'Cleaning',
  'Carpentry',
  'Painting',
  'Appliance Repair',
  'Home Maintenance',
];

const SERVICE_CATEGORY_ALIASES = {
  plumber: 'Plumbing',
  plumbing: 'Plumbing',
  electrician: 'Electrical',
  electrical: 'Electrical',
  carpenter: 'Carpentry',
  carpentry: 'Carpentry',
  painter: 'Painting',
  painting: 'Painting',
  appliance: 'Appliance Repair',
  'appliance repair': 'Appliance Repair',
  ac: 'Appliance Repair',
  'ac repair': 'Appliance Repair',
  hvac: 'Appliance Repair',
  cleaner: 'Cleaning',
  cleaning: 'Cleaning',
  maintenance: 'Home Maintenance',
  'home maintenance': 'Home Maintenance',
};

const normalizeServiceCategory = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (SERVICE_CATEGORY_ALIASES[normalized]) return SERVICE_CATEGORY_ALIASES[normalized];
  return SERVICE_CATEGORIES.find((category) => category.toLowerCase() === normalized) || '';
};

export {
  SERVICE_CATEGORY_ALIASES,
  SERVICE_CATEGORIES,
  normalizeServiceCategory,
};

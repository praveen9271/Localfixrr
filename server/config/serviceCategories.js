const SERVICE_CATEGORIES = [
  'Plumbing',
  'Electrical',
  'Cleaning',
  'Carpentry',
  'Painting',
  'Appliance Repair',
  'Home Maintenance',
];

const normalizeServiceCategory = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  return SERVICE_CATEGORIES.find((category) => category.toLowerCase() === normalized) || '';
};

module.exports = {
  SERVICE_CATEGORIES,
  normalizeServiceCategory,
};

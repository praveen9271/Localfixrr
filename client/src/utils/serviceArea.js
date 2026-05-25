export const SERVICE_AREA = 'Phagwara, Punjab';
export const SERVICE_AREA_FULL = 'Phagwara, Punjab, India';

export const isSupportedLocation = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return true;
  return normalized.includes('phagwara');
};

export const unsupportedLocationMessage = `LocalFixr is currently available only in ${SERVICE_AREA}.`;

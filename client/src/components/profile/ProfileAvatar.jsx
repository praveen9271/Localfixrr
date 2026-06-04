import { useState } from 'react';

const sizeClasses = {
  xs: 'h-7 w-7 text-xs',
  sm: 'h-10 w-10 text-sm',
  md: 'h-14 w-14 text-lg',
  lg: 'h-20 w-20 text-2xl',
  xl: 'h-28 w-28 text-4xl',
};

const getProfileInitial = (name, email) => {
  const source = String(name || email || 'U').trim();
  return (source.match(/[a-z0-9]/i)?.[0] || 'U').toUpperCase();
};

function ProfileAvatar({ src, name, email, size = 'md', className = '' }) {
  const [failedSrc, setFailedSrc] = useState('');
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const label = name || email || 'User';

  if (src && failedSrc !== src) {
    return (
      <img
        src={src}
        alt=""
        aria-label={label}
        onError={() => setFailedSrc(src)}
        className={`${sizeClass} rounded-full bg-slate-100 object-cover ring-1 ring-slate-200 ${className}`}
      />
    );
  }

  return (
    <div
      aria-label={label}
      className={`${sizeClass} grid place-items-center rounded-full bg-slate-900 font-black text-white ring-1 ring-slate-200 ${className}`}
    >
      {getProfileInitial(name, email)}
    </div>
  );
}

export default ProfileAvatar;

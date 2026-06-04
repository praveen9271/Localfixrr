import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, ImagePlus, Loader2, Trash2, X } from 'lucide-react';
import ProfileAvatar from './ProfileAvatar';

function ProfilePhotoPanel({
  user,
  onSavePhoto,
  onRemovePhoto,
  disabled = false,
  className = '',
  compact = false,
}) {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const previewUrl = useMemo(
    () => (selectedFile ? URL.createObjectURL(selectedFile) : ''),
    [selectedFile],
  );

  useEffect(() => {
    if (!previewUrl) return undefined;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const busy = disabled || saving || removing;
  const hasPhoto = Boolean(user?.avatar);
  const displaySrc = previewUrl || user?.avatar || '';
  const avatarSize = compact ? 'h-16 w-16' : 'h-20 w-20';
  const avatarPreset = compact ? 'md' : 'lg';

  const openPicker = () => {
    if (!busy) fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    setSelectedFile(file);
  };

  const cancelPreview = () => {
    setSelectedFile(null);
  };

  const savePhoto = async () => {
    if (!selectedFile || !onSavePhoto) return;
    setSaving(true);
    try {
      const result = await onSavePhoto(selectedFile);
      if (result !== null) setSelectedFile(null);
    } catch {
      // Error display is handled by the caller hook/toast.
    } finally {
      setSaving(false);
    }
  };

  const removePhoto = async () => {
    if (!hasPhoto || !onRemovePhoto) return;
    setRemoving(true);
    try {
      const result = await onRemovePhoto();
      if (result !== null) setSelectedFile(null);
    } catch {
      // Error display is handled by the caller hook/toast.
    } finally {
      setRemoving(false);
    }
  };

  if (compact) {
    return (
      <section className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={openPicker}
            disabled={busy}
            className={`group relative ${avatarSize} shrink-0 rounded-full focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed`}
            aria-label={hasPhoto ? 'Change profile photo' : 'Add profile photo'}
          >
            <ProfileAvatar
              src={displaySrc}
              name={user?.name}
              email={user?.email}
              size={avatarPreset}
              className={`${avatarSize} border-4 border-white shadow-md`}
            />
            <span className="absolute inset-0 grid place-items-center rounded-full bg-slate-950/0 text-white opacity-0 transition group-hover:bg-slate-950/45 group-hover:opacity-100">
              <Camera className="h-5 w-5" />
            </span>
          </button>

          <div className="flex flex-wrap justify-center gap-2 sm:justify-end">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
            {selectedFile ? (
              <>
                <button
                  type="button"
                  onClick={savePhoto}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                  Save
                </button>
                <button
                  type="button"
                  onClick={cancelPreview}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={openPicker}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Camera className="h-4 w-4" />
                {hasPhoto ? 'Change Photo' : 'Add Photo'}
              </button>
            )}
            {hasPhoto && (
              <button
                type="button"
                onClick={removePhoto}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-bold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Remove
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={openPicker}
          disabled={busy}
          className={`group relative ${avatarSize} shrink-0 rounded-full focus:outline-none focus:ring-4 focus:ring-indigo-100 disabled:cursor-not-allowed`}
          aria-label={hasPhoto ? 'Change profile photo' : 'Add profile photo'}
        >
          <ProfileAvatar
            src={displaySrc}
            name={user?.name}
            email={user?.email}
            size={avatarPreset}
            className={`${avatarSize} border-4 border-white shadow-md`}
          />
          <span className="absolute inset-0 grid place-items-center rounded-full bg-slate-950/0 text-white opacity-0 transition group-hover:bg-slate-950/45 group-hover:opacity-100">
            <Camera className="h-5 w-5" />
          </span>
        </button>

        <div className="flex flex-wrap justify-center gap-2 sm:justify-end">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
          {selectedFile ? (
            <>
              <button
                type="button"
                onClick={savePhoto}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                Save
              </button>
              <button
                type="button"
                onClick={cancelPreview}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={openPicker}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Camera className="h-4 w-4" />
              {hasPhoto ? 'Change Photo' : 'Add Photo'}
            </button>
          )}
          {hasPhoto && (
            <button
              type="button"
              onClick={removePhoto}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-bold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Remove
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

export default ProfilePhotoPanel;

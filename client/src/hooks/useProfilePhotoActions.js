import { useCallback, useEffect, useState } from 'react';
import { getCurrentUser, removeProfilePhoto, syncCurrentUser, updateProfilePhoto } from '../services/authService';

function useProfilePhotoActions({ onSuccess, onError } = {}) {
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());

  useEffect(() => {
    const refreshUser = () => setCurrentUser(getCurrentUser());
    window.addEventListener('storage', refreshUser);
    window.addEventListener('localfixr:user-updated', refreshUser);
    return () => {
      window.removeEventListener('storage', refreshUser);
      window.removeEventListener('localfixr:user-updated', refreshUser);
    };
  }, []);

  const applyUser = useCallback((user, message) => {
    if (!user) return;
    syncCurrentUser(user);
    setCurrentUser(user);
    onSuccess?.(message, user);
  }, [onSuccess]);

  const saveProfilePhoto = useCallback(async (file) => {
    try {
      const response = await updateProfilePhoto(file);
      applyUser(response.user, response.message || 'Profile photo updated');
      return response;
    } catch (error) {
      const message = error.response?.status === 404
        ? 'Profile photo API is not available on this server. Deploy the latest backend or use your local API URL.'
        : error.response?.data?.message || error.userMessage || 'Unable to update profile photo';
      onError?.(message);
      return null;
    }
  }, [applyUser, onError]);

  const removeCurrentProfilePhoto = useCallback(async () => {
    try {
      const response = await removeProfilePhoto();
      applyUser(response.user, response.message || 'Profile photo removed');
      return response;
    } catch (error) {
      const message = error.response?.status === 404
        ? 'Profile photo API is not available on this server. Deploy the latest backend or use your local API URL.'
        : error.response?.data?.message || error.userMessage || 'Unable to remove profile photo';
      onError?.(message);
      return null;
    }
  }, [applyUser, onError]);

  return {
    currentUser,
    setCurrentUser,
    saveProfilePhoto,
    removeCurrentProfilePhoto,
  };
}

export default useProfilePhotoActions;

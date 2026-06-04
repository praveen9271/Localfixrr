import { ensureCloudinaryConfigured } from '../config/cloudinary.js';

const getUploadFolder = (folder) => {
  const key = String(folder || 'services').trim().toLowerCase();
  if (key === 'avatars') return 'localfixr/avatars';
  if (key === 'profiles') return 'localfixr/profiles';
  return 'localfixr/services';
};

const uploadBufferToCloudinary = (file, folder) => new Promise((resolve, reject) => {
  const cloudinary = ensureCloudinaryConfigured();
  const stream = cloudinary.uploader.upload_stream(
    {
      folder,
      resource_type: 'image',
      use_filename: true,
      unique_filename: true,
      overwrite: false,
    },
    (error, result) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(result);
    },
  );

  stream.end(file.buffer);
});

const uploadImageFile = async (file, folderKey = 'services') => {
  const cloudinary = ensureCloudinaryConfigured();
  const result = await uploadBufferToCloudinary(file, getUploadFolder(folderKey));
  const optimizedUrl = cloudinary.url(result.public_id, {
    secure: true,
    fetch_format: 'auto',
    quality: 'auto',
  });

  return {
    url: result.secure_url,
    optimizedUrl,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes,
  };
};

export { getUploadFolder, uploadBufferToCloudinary, uploadImageFile };

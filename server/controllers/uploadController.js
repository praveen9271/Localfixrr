import { ensureCloudinaryConfigured } from '../config/cloudinary.js';

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

const getUploadFolder = (folder) => {
  const key = String(folder || 'services').trim().toLowerCase();
  if (key === 'avatars') return 'localfixr/avatars';
  if (key === 'profiles') return 'localfixr/profiles';
  return 'localfixr/services';
};

const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image file' });
    }

    const cloudinary = ensureCloudinaryConfigured();
    const result = await uploadBufferToCloudinary(req.file, getUploadFolder(req.body.folder));
    const optimizedUrl = cloudinary.url(result.public_id, {
      secure: true,
      fetch_format: 'auto',
      quality: 'auto',
    });

    return res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      image: {
        url: result.secure_url,
        optimizedUrl,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      },
      url: optimizedUrl,
    });
  } catch (error) {
    return next(error);
  }
};

export { uploadImage };

import { uploadImageFile } from '../services/imageUploadService.js';

const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image file' });
    }

    const image = await uploadImageFile(req.file, req.body.folder);

    return res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      image,
      url: image.optimizedUrl,
    });
  } catch (error) {
    return next(error);
  }
};

export { uploadImage };

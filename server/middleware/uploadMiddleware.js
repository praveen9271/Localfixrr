import multer from 'multer';

const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: Number(process.env.MAX_IMAGE_UPLOAD_MB || 5) * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    if (allowedImageTypes.has(file.mimetype)) {
      callback(null, true);
      return;
    }

    const error = new Error('Only JPG, JPEG, PNG, and WEBP images are allowed');
    error.statusCode = 400;
    callback(error);
  },
});

const parseSingleImage = (req, res, next) => {
  imageUpload.single('image')(req, res, (error) => {
    if (!error) return next();

    if (error instanceof multer.MulterError) {
      const message = error.code === 'LIMIT_FILE_SIZE'
        ? `Image must be ${process.env.MAX_IMAGE_UPLOAD_MB || 5}MB or smaller`
        : error.message;
      return res.status(400).json({ success: false, message });
    }

    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || 'Invalid image upload',
    });
  });
};

export { parseSingleImage };

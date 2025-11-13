import multer from 'multer';
import path from 'path';

// Configure multer to store files in memory (as Buffer)
// This allows us to save files directly to MongoDB
const storage = multer.memoryStorage();

// File filter to accept only specific file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx|xls|xlsx|txt|jpg|jpeg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, PNG, GIF allowed.'), false);
  }
};

// Create multer upload instance
import multer from 'multer';
//reate multer upload instance with simple config
const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB limit per file
  }
});

export default upload;
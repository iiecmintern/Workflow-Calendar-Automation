const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/";
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    "text/csv",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only images, PDFs, documents, and text files are allowed."
      ),
      false
    );
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5, // Maximum 5 files per request
  },
});

// Validate file upload based on form field configuration
const validateFileUpload = (file, fieldConfig) => {
  const errors = [];

  // Check file size
  if (fieldConfig.validation?.maxFileSize) {
    const maxSizeMB = fieldConfig.validation.maxFileSize;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      errors.push(`File size exceeds maximum allowed size of ${maxSizeMB}MB`);
    }
  }

  // Check file type
  if (
    fieldConfig.validation?.fileTypes &&
    fieldConfig.validation.fileTypes.length > 0
  ) {
    const allowedTypes = fieldConfig.validation.fileTypes;
    const fileExtension = path
      .extname(file.originalname)
      .toLowerCase()
      .substring(1);
    if (!allowedTypes.includes(fileExtension)) {
      errors.push(
        `File type not allowed. Allowed types: ${allowedTypes.join(", ")}`
      );
    }
  }

  return errors;
};

// Delete file from storage
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error deleting file:", error);
    return false;
  }
};

// Get file info
const getFileInfo = (file) => {
  return {
    filename: file.filename,
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    path: file.path,
  };
};

module.exports = {
  upload,
  validateFileUpload,
  deleteFile,
  getFileInfo,
};

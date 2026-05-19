export const FILE_REPOSITORY = Symbol('FILE_REPOSITORY');
export const FILE_STORAGE = Symbol('FILE_STORAGE');

export const FILE_UPLOAD_LIMITS = {
  // Hard upper bound — controller-level multer caps the request body separately.
  MAX_BYTES: 25 * 1024 * 1024, // 25 MB
} as const;

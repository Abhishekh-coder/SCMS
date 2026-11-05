const path = require('path');
const fs = require('fs');
const { logger } = require('../../config/logger');

class LocalStorageProvider {
  async uploadFile({ filename, buffer, targetSubdir = 'complaints' }) {
    // Sanitize targetSubdir to alphanumeric and hyphen/underscore only
    const cleanSubdir = String(targetSubdir).replace(/[^a-zA-Z0-9_-]/g, '') || 'complaints';
    const baseDir = path.resolve(__dirname, '../../../../storage/local');
    const destDir = path.resolve(baseDir, cleanSubdir);

    // Prevent path traversal outside baseDir
    if (!destDir.startsWith(baseDir)) {
      throw new Error('Security Error: Invalid storage directory path.');
    }

    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    // Sanitize filename to prevent directory traversal
    const safeBaseName = path.basename(filename).replace(/[^a-zA-Z0-9_.-]/g, '_');
    const filePath = path.resolve(destDir, safeBaseName);

    if (!filePath.startsWith(destDir)) {
      throw new Error('Security Error: Path traversal detected in upload filename.');
    }

    if (buffer) {
      fs.writeFileSync(filePath, buffer);
    }
    logger.info(`💾 [LocalStorageProvider] Saved file to ${filePath}`);
    return { url: `/storage/local/${cleanSubdir}/${safeBaseName}`, path: filePath };
  }
}

class S3StorageProvider {
  async uploadFile({ filename, buffer }) {
    logger.info(`☁️ [S3StorageProvider] Simulated AWS S3 Upload for ${filename}`);
    return { url: `https://s3.amazonaws.com/ccms-bucket/${filename}` };
  }
}

class StorageService {
  constructor() {
    this.providerType = process.env.STORAGE_PROVIDER || 'local';
    this.providers = {
      local: new LocalStorageProvider(),
      s3: new S3StorageProvider()
    };
  }

  async storeAttachment(fileData) {
    const provider = this.providers[this.providerType] || this.providers.local;
    return await provider.uploadFile(fileData);
  }
}

module.exports = new StorageService();

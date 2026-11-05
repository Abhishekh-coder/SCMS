const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const corsConfig = require('../config/cors');

function initializeMiddleware(app) {
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  }));
  app.use(cors(corsConfig));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Security Hardening: Only serve storage/local subdirectories (evidence, complaints)
  // Internal directories (archive, failed, processed) are completely unexposed
  const safeStorageDir = path.resolve(__dirname, '../../../storage/local');
  app.use('/storage/local', express.static(safeStorageDir, { dotfiles: 'ignore', index: false }));
  app.use('/storage', express.static(safeStorageDir, { dotfiles: 'ignore', index: false }));
}

module.exports = { initializeMiddleware };

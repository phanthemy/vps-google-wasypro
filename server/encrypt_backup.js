const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const vaultDir = path.join('C:\\Users\\phant\\.gemini\\antigravity\\brain\\8fad938c-8383-4465-8ee9-8e7d12945a7c\\scratch\\backups_vault');
if (!fs.existsSync(vaultDir)) {
  fs.mkdirSync(vaultDir, { recursive: true });
}

// AES-256-GCM (Galois/Counter Mode) authenticated encryption
const ALGORITHM = 'aes-256-gcm';

// Master Key is isolated, strictly dedicated, and derived from BACKUP_ENCRYPTION_KEY
require('dotenv').config();
const rawKey = process.env.BACKUP_ENCRYPTION_KEY;
if (!rawKey) {
  console.error('FATAL ERROR: BACKUP_ENCRYPTION_KEY is required and must not be empty!');
  process.exit(1);
}
if (rawKey === process.env.JWT_SECRET) {
  console.error('FATAL ERROR: BACKUP_ENCRYPTION_KEY must NOT be identical to JWT_SECRET!');
  process.exit(1);
}
const ENCRYPTION_KEY = crypto.createHash('sha256').update(rawKey).digest();

function encryptFileGCM(srcPath, destPath) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  const input = fs.readFileSync(srcPath);
  const encrypted = Buffer.concat([cipher.update(input), cipher.final()]);
  const authTag = cipher.getAuthTag(); // 16-byte GCM authentication tag

  // Store format: [16 bytes IV] + [16 bytes AuthTag] + [Encrypted Data]
  const combined = Buffer.concat([iv, authTag, encrypted]);
  fs.writeFileSync(destPath, combined);
}

function verifyAndDecryptGCM(encryptedPath) {
  const data = fs.readFileSync(encryptedPath);
  if (data.length < 32) throw new Error('Invalid encrypted file length');

  const iv = data.subarray(0, 16);
  const authTag = data.subarray(16, 32);
  const ciphertext = data.subarray(32);

  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted;
}

function testTamperDetection(encryptedPath) {
  const data = Buffer.from(fs.readFileSync(encryptedPath));
  // Flip one byte in the ciphertext payload
  data[data.length - 1] ^= 0xFF;

  const iv = data.subarray(0, 16);
  const authTag = data.subarray(16, 32);
  const ciphertext = data.subarray(32);

  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return false; // Should not reach here
  } catch (err) {
    return true; // Correctly caught tampering!
  }
}

// Perform test on current database
const currentDbPath = path.join(__dirname, 'dev.db');
const targetVaultDb = path.join(vaultDir, 'dev.db.vault.aes256gcm.enc');

console.log('--- EXECUTING AES-256-GCM AUTHENTICATED BACKUP ENCRYPTION ---');
if (fs.existsSync(currentDbPath)) {
  encryptFileGCM(currentDbPath, targetVaultDb);
  console.log(`✅ Database encrypted using AES-256-GCM to: ${targetVaultDb}`);

  const decrypted = verifyAndDecryptGCM(targetVaultDb);
  console.log(`✅ Cryptographic decryption & integrity verified (${decrypted.length} bytes decrypted).`);

  const tamperDetected = testTamperDetection(targetVaultDb);
  if (tamperDetected) {
    console.log('🛡️ Tamper-detection test PASSED: Any modified byte in backup file is immediately detected and rejected by GCM tag verification.');
  } else {
    console.error('❌ Tamper detection test failed!');
    process.exit(1);
  }
}

module.exports = {
  encryptFileGCM,
  verifyAndDecryptGCM,
  testTamperDetection
};

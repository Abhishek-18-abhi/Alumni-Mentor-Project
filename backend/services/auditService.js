import crypto from 'crypto';
import AuditLog from '../models/AuditLog.js';

const GENESIS_HASH = '0'.repeat(64);

/**
 * Calculates SHA-256 hash for an audit log entry.
 */
export function computeAuditHash({ prevHash, timestamp, userId, action, resource, status, ip, details }) {
  const payload = [
    prevHash || GENESIS_HASH,
    timestamp instanceof Date ? timestamp.toISOString() : new Date(timestamp).toISOString(),
    String(userId || ''),
    String(action || ''),
    String(resource || ''),
    String(status || 'Success'),
    String(ip || ''),
    JSON.stringify(details || {}),
  ].join('|');

  return crypto.createHash('sha256').update(payload).digest('hex');
}

/**
 * Records a tamper-evident audit log entry in MongoDB.
 * Appends to the cryptographically linked hash chain.
 */
export async function recordAudit({ req, userId, action, resource = '', status = 'Success', details = null }) {
  try {
    const effectiveUserId = userId || req?.user?._id;
    const ip = req?.ip || req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || '';
    const timestamp = new Date();

    // Fetch the most recent log to chain hashes
    const lastLog = await AuditLog.findOne().sort({ createdAt: -1 });
    const prevHash = lastLog?.hash || GENESIS_HASH;

    const hash = computeAuditHash({
      prevHash,
      timestamp,
      userId: effectiveUserId,
      action,
      resource,
      status,
      ip,
      details,
    });

    const entry = await AuditLog.create({
      userId: effectiveUserId,
      action,
      resource,
      status,
      ip,
      details,
      prevHash,
      hash,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return entry;
  } catch (error) {
    console.error('Failed to record audit log:', error.message);
    return null;
  }
}

/**
 * Verifies the integrity of the audit log hash chain.
 * @returns {Promise<{ valid: boolean, totalChecked: number, brokenAt?: string, reason?: string }>}
 */
export async function verifyAuditChain() {
  const logs = await AuditLog.find().sort({ createdAt: 1 });
  if (logs.length === 0) {
    return { valid: true, totalChecked: 0, message: 'No audit records to verify.' };
  }

  let expectedPrevHash = GENESIS_HASH;
  for (let i = 0; i < logs.length; i++) {
    const entry = logs[i];

    // Check link to previous
    if (i > 0 && entry.prevHash && entry.prevHash !== expectedPrevHash) {
      return {
        valid: false,
        totalChecked: i,
        brokenAt: entry._id.toString(),
        reason: `Broken chain link at index ${i}: prevHash mismatch. Expected ${expectedPrevHash}, got ${entry.prevHash}`,
      };
    }

    // Verify self hash if present
    if (entry.hash) {
      const calculated = computeAuditHash({
        prevHash: entry.prevHash || (i === 0 ? GENESIS_HASH : expectedPrevHash),
        timestamp: entry.createdAt,
        userId: entry.userId,
        action: entry.action,
        resource: entry.resource,
        status: entry.status,
        ip: entry.ip || '',
        details: entry.details,
      });

      if (calculated !== entry.hash) {
        return {
          valid: false,
          totalChecked: i,
          brokenAt: entry._id.toString(),
          reason: `Tampered content at entry ${entry._id}: hash mismatch.`,
        };
      }
      expectedPrevHash = entry.hash;
    } else {
      // Legacy entry without hash
      expectedPrevHash = entry.prevHash || GENESIS_HASH;
    }
  }

  return {
    valid: true,
    totalChecked: logs.length,
    message: `All ${logs.length} audit chain entries verified successfully. No tampering detected.`,
  };
}

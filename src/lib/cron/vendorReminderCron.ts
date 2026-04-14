import { getFirebaseAdmin } from '@/lib/firebase-admin';
import { NotificationService } from '@/services/notification.service';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
const WINDOW_MS = 48 * 60 * 60 * 1000;

interface CronRunResult {
  pendingCount: number;
  remindedCount: number;
  recipients: string[];
}

/**
 * Runs the 48-hour vendor review reminder cycle.
 *
 * Deploy as a scheduled job that calls `/api/vendors/reminders` every 48h.
 */
export async function runVendorReminderCron(now = new Date()): Promise<CronRunResult> {
  const { adminFirestore } = getFirebaseAdmin();

  if (!adminFirestore) {
    throw new Error('Firebase Admin Firestore unavailable');
  }

  const thresholdIso = new Date(now.getTime() - WINDOW_MS).toISOString();

  const pendingSnapshot = await adminFirestore
    .collection('vendorApplications')
    .where('status', '==', 'pending')
    .get();

  const pendingDocs = pendingSnapshot.docs.filter((doc) => {
    const data = doc.data();
    const lastReminderAt = typeof data.lastReminderAt === 'string' ? data.lastReminderAt : null;
    return !lastReminderAt || lastReminderAt < thresholdIso;
  });

  if (pendingDocs.length === 0) {
    return { pendingCount: 0, remindedCount: 0, recipients: [] };
  }

  const adminUsersSnap = await adminFirestore.collection('users').where('role', '==', 'admin').get();
  const recipients = adminUsersSnap.docs
    .map((doc) => String(doc.data().email || '').trim().toLowerCase())
    .filter((email) => email.length > 0);

  if (recipients.length > 0) {
    NotificationService.sendAsync({
      type: 'admin_vendor_pending_reminder',
      recipients,
      pendingCount: pendingDocs.length,
      reviewUrl: `${APP_URL}/admin/vendors`,
      vendors: pendingDocs.map((doc) => {
        const data = doc.data();
        return {
          ownerName: String(data.ownerName || '-'),
          companyName: String(data.companyName || '-'),
          submittedAt: String(data.submittedAt || now.toISOString()),
        };
      }),
    });
  }

  const batch = adminFirestore.batch();
  for (const doc of pendingDocs) {
    const data = doc.data();
    const remindersSent = Number(data.remindersSent || 0);
    batch.update(doc.ref, {
      remindersSent: remindersSent + 1,
      lastReminderAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  }
  await batch.commit();

  return {
    pendingCount: pendingSnapshot.docs.length,
    remindedCount: pendingDocs.length,
    recipients,
  };
}

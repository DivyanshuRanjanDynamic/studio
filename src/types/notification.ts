// ═══════════════════════════════════════════════════
// Notification Domain Types
// ═══════════════════════════════════════════════════

/** Recipient for email delivery */
export interface NotificationRecipient {
  readonly email: string;
  readonly name: string;
}

/** Composed email ready to send */
export interface EmailPayload {
  readonly to: string | string[];
  readonly subject: string;
  readonly html: string;
  readonly text?: string;
}

// ─── Auth Events ─────────────────────────────────────────────

export interface VerificationEvent {
  readonly type: 'verification';
  readonly customer: NotificationRecipient;
  readonly verificationUrl: string;
}

export interface PasswordResetEvent {
  readonly type: 'password_reset';
  readonly customer: NotificationRecipient;
  readonly resetUrl: string;
}

// ─── Customer-Facing Events ──────────────────────────────────

export interface WelcomeEvent {
  readonly type: 'welcome';
  readonly customer: NotificationRecipient;
}

export interface RfqSubmittedCustomerEvent {
  readonly type: 'rfq_submitted_customer';
  readonly customer: NotificationRecipient;
  readonly projectName: string;
  readonly projectId: string;
  readonly partCount: number;
}

export interface QuotationReceivedEvent {
  readonly type: 'quotation_received';
  readonly customer: NotificationRecipient;
  readonly projectName: string;
  readonly projectId: string;
  readonly quotedPrice: number;
  readonly leadTimeDays: number;
}

export interface NegotiationAdminReplyEvent {
  readonly type: 'negotiation_admin_reply';
  readonly customer: NotificationRecipient;
  readonly projectName: string;
  readonly projectId: string;
  readonly adminMessage: string;
  readonly proposedPrice?: number;
}

export interface QuoteAcceptedEvent {
  readonly type: 'quote_accepted';
  readonly customer: NotificationRecipient;
  readonly projectName: string;
  readonly projectId: string;
  readonly finalPrice: number;
}

export interface PaymentAdvanceConfirmedEvent {
  readonly type: 'payment_advance_confirmed';
  readonly customer: NotificationRecipient;
  readonly projectName: string;
  readonly projectId: string;
  readonly amountPaid: number;
  readonly balanceDue: number;
}

export interface StatusInProductionEvent {
  readonly type: 'status_in_production';
  readonly customer: NotificationRecipient;
  readonly projectName: string;
  readonly projectId: string;
}

export interface StatusShippedEvent {
  readonly type: 'status_shipped';
  readonly customer: NotificationRecipient;
  readonly projectName: string;
  readonly projectId: string;
  readonly balanceDue: number;
}

export interface PaymentBalanceConfirmedEvent {
  readonly type: 'payment_balance_confirmed';
  readonly customer: NotificationRecipient;
  readonly projectName: string;
  readonly projectId: string;
  readonly amountPaid: number;
  readonly totalPaid: number;
}

export interface StatusDeliveredEvent {
  readonly type: 'status_delivered';
  readonly customer: NotificationRecipient;
  readonly projectName: string;
  readonly projectId: string;
}

// ─── Admin-Facing Events ─────────────────────────────────────

export interface AdminNewUserEvent {
  readonly type: 'admin_new_user';
  readonly userName: string;
  readonly userEmail: string;
}

export interface AdminNewRfqEvent {
  readonly type: 'admin_new_rfq';
  readonly customerName: string;
  readonly customerEmail: string;
  readonly projectName: string;
  readonly projectId: string;
  readonly partCount: number;
}

export interface AdminNegotiationCustomerReplyEvent {
  readonly type: 'admin_negotiation_customer_reply';
  readonly customerName: string;
  readonly customerEmail: string;
  readonly projectName: string;
  readonly projectId: string;
  readonly customerMessage: string;
  readonly proposedPrice?: number;
}

export interface AdminContactQueryEvent {
  readonly type: 'admin_contact_query';
  readonly fullName: string;
  readonly email: string;
  readonly phone?: string;
  readonly company?: string;
  readonly message: string;
}

export interface AdminConsultationBookedEvent {
  readonly type: 'admin_consultation_booked';
  readonly customerName: string;
  readonly customerEmail: string;
  readonly customerPhone: string;
  readonly message: string;
  readonly quoteRef?: string;
}

export interface AdminPaymentReceivedEvent {
  readonly type: 'admin_payment_received';
  readonly customerName: string;
  readonly customerEmail: string;
  readonly customerPhone?: string;
  readonly projectName: string;
  readonly projectId: string;
  readonly paymentType: 'advance' | 'completion';
  readonly amount: number;
}

export interface AdminQuoteAcceptedEvent {
  readonly type: 'admin_quote_accepted';
  readonly customerName: string;
  readonly customerEmail: string;
  readonly projectName: string;
  readonly projectId: string;
  readonly acceptedPrice: number;
}

export interface VendorApprovedEvent {
  readonly type: 'vendor_approved';
  readonly vendorName: string;
  readonly vendorEmail: string;
  readonly loginUrl: string;
}

export interface VendorRejectedEvent {
  readonly type: 'vendor_rejected';
  readonly vendorName: string;
  readonly vendorEmail: string;
  readonly reapplyUrl: string;
}

export interface AdminVendorReminderEvent {
  readonly type: 'admin_vendor_pending_reminder';
  readonly recipients: string[];
  readonly pendingCount: number;
  readonly vendors: Array<{
    companyName: string;
    ownerName: string;
    submittedAt: string;
  }>;
  readonly reviewUrl: string;
}

// ─── Union Type ──────────────────────────────────────────────

export type NotificationEvent =
  | VerificationEvent
  | PasswordResetEvent
  | WelcomeEvent
  | RfqSubmittedCustomerEvent
  | QuotationReceivedEvent
  | NegotiationAdminReplyEvent
  | QuoteAcceptedEvent
  | PaymentAdvanceConfirmedEvent
  | StatusInProductionEvent
  | StatusShippedEvent
  | PaymentBalanceConfirmedEvent
  | StatusDeliveredEvent
  | AdminNewUserEvent
  | AdminNewRfqEvent
  | AdminNegotiationCustomerReplyEvent
  | AdminContactQueryEvent
  | AdminConsultationBookedEvent
  | AdminPaymentReceivedEvent
  | AdminQuoteAcceptedEvent
  | VendorApprovedEvent
  | VendorRejectedEvent
  | AdminVendorReminderEvent;

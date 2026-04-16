import { HoleFeature, BendFeature, BoundingBox, FlatPattern } from '@/types/viewer';

/** Main manufacturing service types */
export type ManufacturingService =
  | 'cnc_machining'
  | 'sheet_metal_cutting'
  | '3d_printing'
  | 'wire_edm'
  | 'cnc_turning';

/** Display names for manufacturing services */
export const SERVICE_DISPLAY_NAMES: Record<ManufacturingService, string> = {
  cnc_machining: 'CNC Milling/Turning',
  sheet_metal_cutting: 'Sheet Metal Cutting',
  '3d_printing': '3D Printing',
  wire_edm: 'Wire EDM',
  cnc_turning: 'CNC Turning',
};

/** Secondary manufacturing processes */
export type SecondaryProcess =
  | 'powder_coating'
  | 'bending'
  | 'anodizing'
  | 'zinc_plating'
  | 'chrome_plating'
  | 'sand_blasting'
  | 'heat_treatment'
  | 'nickel_plating'
  | 'tapping';

/** Coating/Anodizing color options */
export type ColorOption =
  | 'black'
  | 'white'
  | 'red'
  | 'blue'
  | 'green'
  | 'yellow'
  | 'grey'
  | 'custom'
  | 'clear'
  | 'gold';

/** Part status in the workflow */
export type PartStatus = 'draft' | 'ready_for_quote';

/** Project RFQ status */
export type ProjectRFQStatus =
  | 'draft'
  | 'submitted' // Added for consistency with project.service.ts
  | 'quote_requested'
  | 'under_review'
  | 'quotation_sent'
  | 'negotiation'
  | 'deposit_pending'
  | 'assigned'
  | 'accepted'
  | 'in_production'
  | 'completed'
  | 'shipped'
  | 'delivered'
  | 'shipping';

/** Project Timeline Event */
export interface TimelineEvent {
  readonly id: string;
  readonly type: string;
  readonly projectId: string;
  readonly actorType: 'admin' | 'vendor' | 'customer' | 'system';
  readonly actorId: string;
  readonly content: string;
  readonly mediaUrl?: string;
  readonly channel: 'internal' | 'email' | 'whatsapp';
  readonly timestamp: string;
}

/** Valid status transitions mapping */
export const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['submitted'],
  submitted: ['quote_requested', 'under_review', 'assigned'],
  under_review: ['quote_requested', 'submitted'],
  quote_requested: ['assigned', 'accepted'],
  assigned: ['quotation_sent', 'accepted', 'in_production'],
  accepted: ['quotation_sent', 'in_production'],
  quotation_sent: ['negotiation', 'deposit_pending', 'accepted'],
  negotiation: ['quotation_sent', 'deposit_pending', 'accepted'],
  deposit_pending: ['in_production'],
  in_production: ['shipping', 'shipped', 'completed'],
  shipping: ['shipped', 'delivered'],
  shipped: ['delivered', 'completed'],
  completed: ['delivered'],
  delivered: [],
};

export interface TapSelection {
  readonly holeIndex: number;
  readonly tapType: string;
}

/** Mechanical part in a project */
export interface MechanicalPart {
  readonly id: string;
  readonly projectId: string;
  readonly userId: string;
  readonly partName?: string;
  readonly service: ManufacturingService;
  readonly cadFile: {
    readonly fileName: string;
    readonly fileUrl: string;
    readonly fileSize: number;
    readonly uploadedAt: string;
  };
  readonly material: {
    readonly id: string;
    readonly name: string;
    readonly grade?: string;
    readonly thickness?: number;
  };
  readonly secondaryProcesses: SecondaryProcess[];
  readonly coatingColor?: ColorOption;
  readonly taps?: TapSelection[];
  readonly tappingNotes?: string;
  readonly dimensions?: {
    readonly x: number;
    readonly y: number;
    readonly z: number;
  };
  readonly quantity: number;
  readonly unitCost?: number;
  readonly discountTier?: string;
  readonly status: PartStatus;
  readonly analysis?: {
    readonly holes?: HoleFeature[];
    readonly bends?: BendFeature[];
    readonly triangleCount?: number;
    readonly boundingBox?: BoundingBox;
    readonly detectedThickness?: number;
    readonly flatPattern?: FlatPattern;
  };
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Negotiation message entry */
export interface NegotiationMessage {
  readonly role: 'user' | 'admin';
  readonly message: string;
  readonly timestamp: string;
  readonly proposedPrice?: number;
}

/** Project RFQ containing multiple parts */
export interface ProjectRFQ {
  readonly id: string;
  readonly userId: string;
  readonly userName: string;
  readonly userEmail: string;
  readonly projectName: string;
  readonly parts: MechanicalPart[];
  readonly status: ProjectRFQStatus;
  readonly workflowStatus?: string;
  readonly deliveryLocation?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly quotedPrice?: number;
  readonly leadTimeDays?: number;
  readonly assignedVendorId?: string;
  readonly invitedVendorIds?: string[];
  readonly shortlistedVendorIds?: string[];
  readonly timelineEvents?: TimelineEvent[];
  readonly negotiationHistory?: NegotiationMessage[];
  readonly paymentStatus?: {
    readonly advance?: {
      readonly paid: boolean;
      readonly paidAt?: string;
      readonly amount?: number;
    };
    readonly completion?: {
      readonly paid: boolean;
      readonly paidAt?: string;
      readonly amount?: number;
    };
  };
  readonly finalPrice?: number;
  readonly artifacts?: ProjectArtifact[];
}

/** Production proof artifact */
export interface ProjectArtifact {
  readonly id: string;
  readonly projectId: string;
  readonly type: 'production_photo' | 'qc_report' | 'shipping_doc' | 'final_photo';
  readonly fileKey: string;
  readonly fileName: string;
  readonly uploadedBy: string;
  readonly uploadedAt: string;
  readonly notes?: string;
}

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
  readonly deliveryLocation?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly quotedPrice?: number;
  readonly leadTimeDays?: number;
  readonly assignedVendorId?: string;
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
}

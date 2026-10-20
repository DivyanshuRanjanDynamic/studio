import { ManufacturingService } from '@/models/project.model';
import { getActiveMaterials } from '@/lib/quoting/materials';
import { getCncMaterialData } from '@/lib/quoting/cnc-materials';

export interface MaterialOption {
  id: string;
  name: string;
  grade: string;
  category: string;
  thicknesses?: number[];
  canBend?: boolean;
  canPowderCoat?: boolean;
  canAnodize?: boolean;
  maxThicknessForBending?: number;
  notes?: string;
}

/** CNC materials grouped like the rest of the catalogue, from the pricing engine's data */
function cncCategories(): { name: string; materials: MaterialOption[] }[] {
  const groups: Array<[string, (group: string) => boolean]> = [
    ['Aluminium', (g) => g === 'aluminium'],
    ['Steel', (g) => g === 'mild_steel' || g === 'alloy_steel'],
    ['Stainless Steel', (g) => g === 'stainless'],
    ['Copper Alloys', (g) => g === 'brass' || g === 'copper'],
  ];
  const cnc = getActiveMaterials().flatMap((m) => {
    const data = getCncMaterialData(m.id);
    return data ? [{ material: m, group: data.machinabilityGroup }] : [];
  });
  return groups
    .map(([name, inGroup]) => ({
      name,
      materials: cnc
        .filter((c) => inGroup(c.group))
        .map(({ material }) => ({
          id: material.id,
          name: material.name,
          grade: material.alloy,
          category: 'CNC Milling/Turning',
          canAnodize: material.availableFinishes.some((f) => f.startsWith('anodize')),
          canPowderCoat: material.availableFinishes.includes('powder_coat'),
        })),
    }))
    .filter((category) => category.materials.length > 0);
}

export const MATERIAL_CATALOG: Record<
  ManufacturingService,
  { categories: { name: string; materials: MaterialOption[] }[] }
> = {
  sheet_metal_cutting: {
    categories: [
      {
        name: 'Metals',
        materials: [
          {
            id: 'al-5052',
            name: 'Aluminium 5052',
            grade: '5052',
            category: 'Metals',
            thicknesses: [1, 1.6, 2, 2.3, 2.5, 3.2, 4.7, 6.3, 8, 9.5],
            canPowderCoat: true,
            canBend: true,
            maxThicknessForBending: 5,
            notes: '>5mm not for bending, powder coating available',
          },
          {
            id: 'al-6061',
            name: 'Aluminium 6061',
            grade: '6061',
            category: 'Metals',
            thicknesses: [1, 1.6, 2, 2.5, 3.2, 4.7, 6.3, 8, 9.5],
            canPowderCoat: true,
            canBend: false,
            notes: 'not for bending, powder coating available',
          },
          {
            id: 'ms-crca',
            name: 'CRCA Mild Steel',
            grade: 'Standard',
            category: 'Metals',
            thicknesses: [0.8, 1.2, 1.5, 1.9, 2.6, 3, 3.4, 4.8, 6.3, 8, 9.5],
            canPowderCoat: true,
            canBend: true,
            maxThicknessForBending: 5,
            notes: '>5mm not for bending, powder coating available',
          },
          {
            id: 'ss-304',
            name: 'Stainless Steel 304',
            grade: '304',
            category: 'Metals',
            thicknesses: [0.8, 1.2, 1.5, 1.9, 2.5, 3.2, 4.7, 6.3, 9.5],
            canPowderCoat: true,
            canBend: true,
            maxThicknessForBending: 5,
            notes: '>5mm not for bending, powder coating available',
          },
        ],
      },
      {
        name: 'Plastics & Composites',
        materials: [
          {
            id: 'cf-plate',
            name: 'Carbon Fiber Plate',
            grade: '3K Twill',
            category: 'Composites',
            thicknesses: [1, 1.6, 2, 3, 4, 5],
            canBend: false,
            canPowderCoat: false,
            notes: 'not for bending, not for powder coating',
          },
          {
            id: 'acrylic',
            name: 'Acrylic',
            grade: 'Cast/Extruded',
            category: 'Plastics',
            thicknesses: [1.6, 3, 4.5, 5.4, 9.5, 12.7],
            canBend: false,
            canPowderCoat: false,
            notes: 'not for bending, not for powder coating',
          },
        ],
      },
      {
        name: 'Wood',
        materials: [
          {
            id: 'mdf',
            name: 'MDF',
            grade: 'Standard',
            category: 'Woods',
            thicknesses: [3.2, 6.3, 9.5, 12.7],
            canBend: false,
            canPowderCoat: false,
            notes: 'not for bending, not for powder coating',
          },
          {
            id: 'plywood',
            name: 'Plywood',
            grade: 'Standard',
            category: 'Woods',
            thicknesses: [3.2, 6.3, 9, 12],
            canBend: false,
            canPowderCoat: false,
            notes: 'not for bending, not for powder coating',
          },
          {
            id: 'balsa',
            name: 'Balsa Wood',
            grade: 'Standard',
            category: 'Woods',
            thicknesses: [1, 3, 5],
            canBend: false,
            canPowderCoat: false,
            notes: 'Not for bending, not for powder coating',
          },
        ],
      },
    ],
  },
  '3d_printing': {
    categories: [
      {
        name: 'Filaments (FDM)',
        materials: [
          {
            id: 'pla',
            name: 'PLA',
            grade: 'Standard',
            category: '3D Printing',
            notes: 'Rapid prototyping, multiple colors available',
          },
          {
            id: 'tpu',
            name: 'TPU',
            grade: 'Flexible',
            category: '3D Printing',
            notes: 'Functional parts, flexible',
          },
          {
            id: 'abs',
            name: 'ABS',
            grade: 'Engineering',
            category: '3D Printing',
            notes: 'Functional parts, rigid',
          },
          {
            id: 'petg',
            name: 'PETG',
            grade: 'Standard',
            category: '3D Printing',
            notes: 'Chemical resistant',
          },
          {
            id: 'asa',
            name: 'ASA',
            grade: 'Weather Resistant',
            category: '3D Printing',
            notes: 'UV resistant',
          },
        ],
      },
    ],
  },
  // Generated from the pricing catalogue, so every CNC material offered here
  // can be priced instantly (ids are the pricing ids, e.g. 'al_6061').
  cnc_machining: { categories: cncCategories() },
  cnc_turning: { categories: [] },
  wire_edm: { categories: [] },
};

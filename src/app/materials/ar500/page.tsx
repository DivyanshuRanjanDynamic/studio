import { ArSteelPage } from '@/components/materials/ArSteelPage';

export default function Ar500Page() {
  return (
    <ArSteelPage
      grade="AR500"
      hardness="About 500 HBW"
      image="/ar500_hero_part_black.png"
      intro="A very hard, abrasion-resistant steel for parts in severe wear. Send us your design and an engineer will confirm the plate, price and lead time."
      uses={['Heavy Wear Plates', 'Cutting Edges', 'Screens', 'Chute Liners']}
      choose="Choose AR500 when abrasion is the main failure and wear life matters more than ease of forming."
      compare={{ grade: 'AR400', href: '/materials/ar400', note: 'Slightly softer, and tougher under impact.' }}
    />
  );
}

import { ArSteelPage } from '@/components/materials/ArSteelPage';

export default function Ar400Page() {
  return (
    <ArSteelPage
      grade="AR400"
      hardness="About 400 HBW"
      image="/ar400_user_part.png"
      intro="A hardened, abrasion-resistant steel for parts that take constant wear. Send us your design and an engineer will confirm the plate, price and lead time."
      uses={['Wear Plates', 'Chute Liners', 'Hoppers', 'Bucket Liners', 'Guards']}
      choose="Choose AR400 when a part faces sliding wear and impact, and you want a balance of hardness and toughness."
      compare={{ grade: 'AR500', href: '/materials/ar500', note: 'Harder, for more severe abrasion.' }}
    />
  );
}

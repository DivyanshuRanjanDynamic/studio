'use client';

import { useEffect, useRef } from 'react';
import { Play, Settings, Upload, Zap, Package } from 'lucide-react';
import { staggerDelay } from '@/lib/animations';

const steps = [
  {
    icon: Settings,
    title: 'Choose Options',
    description:
      'Select your manufacturing process, material, thickness, and finishing options like anodizing or powder coating.',
  },
  {
    icon: Upload,
    title: 'Upload Your Design',
    description:
      'Upload your STEP, DXF, or DWG file through our secure, NDA-protected portal.',
  },
  {
    icon: Zap,
    title: 'Get Your Quote',
    description:
      'Receive an instant or rapid quote with full cost breakdown — no hidden fees, ever.',
  },
  {
    icon: Package,
    title: 'Receive Your Parts',
    description:
      'We manufacture at our vetted facility and deliver directly to your door, with real-time tracking.',
  },
];

// S3 demo video (existing from original HowItWorks)
const VIDEO_URL =
  'https://marketing-video-mechhub.s3.eu-north-1.amazonaws.com/Screen%20Recording%202026-04-25%20041930111.mp4';

export function HowItWorks() {
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const headerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('mh-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '-30px' }
    );

    [headerRef.current, videoRef.current, ...stepRefs.current].forEach(
      (el) => el && observer.observe(el)
    );
    return () => observer.disconnect();
  }, []);

  return (
    <section id="how-it-works" className="py-24 md:py-32 bg-[#f7f9fc] border-b border-[#e4e8f0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div
          ref={headerRef}
          className="text-center mh-reveal"
        >
          <span className="mh-pill mb-4 inline-flex">THE PROCESS</span>
          <h2 className="mh-h2 text-[#14213d] mt-4 font-['Lora',serif]">
            See How It <span className="text-[#2e5596]">Works</span>
          </h2>
          <p className="text-[#64748b] text-lg max-w-xl mx-auto mt-4 font-medium">
            From design file to delivered part — in days, not weeks.
          </p>
        </div>

        {/* Video block */}
        <div
          ref={videoRef}
          className="relative mx-auto mt-14 max-w-3xl rounded-[20px] overflow-hidden border border-[#e4e8f0] shadow-xl bg-white p-2.5 mh-reveal"
          style={{ transitionDelay: '0.15s' }}
        >
          <div className="aspect-video bg-[#101d33] rounded-[14px] relative overflow-hidden">
            <video
              src={VIDEO_URL}
              controls
              className="absolute inset-0 w-full h-full object-contain"
              preload="metadata"
            />
          </div>
        </div>
        <p className="text-center text-[#64748b] text-sm mt-4 font-medium">
          Watch how a student team got their drone frame manufactured and delivered in 72 hours.
        </p>

        {/* Steps stepper */}
        <div className="relative mt-20">
          {/* Desktop connecting line */}
          <div className="hidden md:block absolute top-6 left-[12.5%] right-[12.5%] h-0.5 bg-[#d6e4f9] z-0" />

          <div className="flex flex-col md:grid md:grid-cols-4 gap-10 md:gap-0 relative z-10">
            {steps.map((step, i) => (
              <div
                key={step.title}
                ref={(el) => { stepRefs.current[i] = el; }}
                className="relative flex flex-col items-center text-center px-4 mh-reveal"
                style={{ transitionDelay: staggerDelay(i, 0.12) }}
              >
                {/* Step badge */}
                <div className="w-12 h-12 rounded-full border-2 border-white bg-[#2e5596] shadow-md flex items-center justify-center mb-4 relative z-10">
                  <span className="text-white font-bold text-sm tabular-nums">
                    0{i + 1}
                  </span>
                </div>

                {/* Icon */}
                <div className="mb-3 text-[#2e5596]">
                  <step.icon size={22} />
                </div>

                <h4 className="text-[#14213d] font-['Lora',serif] font-bold text-base mb-2">{step.title}</h4>
                <p className="text-[#64748b] text-sm leading-relaxed font-normal">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ScrollReveal, TextReveal } from '@/components/ScrollReveal';

const BUILDER_CATEGORIES = [
  {
    title: 'Robotics',
    description:
      'Chassis frames, motor mounts, custom brackets — precision-cut and ready to assemble. From competition bots to industrial arms.',
    cta: 'Explore Parts',
    href: '/services',
    icon: (
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-10 h-10 md:w-12 md:h-12"
      >
        {/* Robot head */}
        <rect
          x="16"
          y="14"
          width="32"
          height="24"
          rx="4"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="none"
        />
        {/* Eyes */}
        <circle cx="26" cy="26" r="3" fill="currentColor" />
        <circle cx="38" cy="26" r="3" fill="currentColor" />
        {/* Antenna */}
        <line
          x1="32"
          y1="14"
          x2="32"
          y2="6"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="32" cy="5" r="2.5" fill="currentColor" />
        {/* Body */}
        <rect
          x="20"
          y="40"
          width="24"
          height="14"
          rx="3"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="none"
        />
        {/* Arms */}
        <line
          x1="16"
          y1="44"
          x2="8"
          y2="48"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1="48"
          y1="44"
          x2="56"
          y2="48"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Connection */}
        <line
          x1="32"
          y1="38"
          x2="32"
          y2="40"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    gradient: 'from-blue-500/10 to-cyan-500/10',
    borderHover: 'hover:border-blue-300/60',
    glowColor: 'group-hover:shadow-blue-500/10',
  },
  {
    title: 'Drones',
    description:
      'Lightweight airframes, carbon-fibre mounts, landing gear, and camera gimbals — engineered for flight-grade precision.',
    cta: 'Explore Parts',
    href: '/services',
    icon: (
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-10 h-10 md:w-12 md:h-12"
      >
        {/* Center body */}
        <rect
          x="24"
          y="26"
          width="16"
          height="12"
          rx="3"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="none"
        />
        {/* Arms */}
        <line
          x1="24"
          y1="30"
          x2="10"
          y2="18"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1="40"
          y1="30"
          x2="54"
          y2="18"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1="24"
          y1="34"
          x2="10"
          y2="46"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line
          x1="40"
          y1="34"
          x2="54"
          y2="46"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Propellers */}
        <ellipse
          cx="10"
          cy="18"
          rx="8"
          ry="3"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          opacity="0.7"
        />
        <ellipse
          cx="54"
          cy="18"
          rx="8"
          ry="3"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          opacity="0.7"
        />
        <ellipse
          cx="10"
          cy="46"
          rx="8"
          ry="3"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          opacity="0.7"
        />
        <ellipse
          cx="54"
          cy="46"
          rx="8"
          ry="3"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          opacity="0.7"
        />
        {/* Landing gear */}
        <line
          x1="28"
          y1="38"
          x2="26"
          y2="44"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="36"
          y1="38"
          x2="38"
          y2="44"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line
          x1="23"
          y1="44"
          x2="41"
          y2="44"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
    gradient: 'from-emerald-500/10 to-teal-500/10',
    borderHover: 'hover:border-emerald-300/60',
    glowColor: 'group-hover:shadow-emerald-500/10',
  },
  {
    title: 'Electric Vehicles',
    description:
      'Battery enclosures, motor housings, suspension components, and structural panels — built tough for the road ahead.',
    cta: 'Explore Parts',
    href: '/services',
    icon: (
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-10 h-10 md:w-12 md:h-12"
      >
        {/* Car body */}
        <path
          d="M8 38 L14 24 L50 24 L56 38"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <rect
          x="6"
          y="38"
          width="52"
          height="10"
          rx="3"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="none"
        />
        {/* Wheels */}
        <circle cx="18" cy="48" r="5" stroke="currentColor" strokeWidth="2.5" fill="none" />
        <circle cx="18" cy="48" r="1.5" fill="currentColor" />
        <circle cx="46" cy="48" r="5" stroke="currentColor" strokeWidth="2.5" fill="none" />
        <circle cx="46" cy="48" r="1.5" fill="currentColor" />
        {/* Lightning bolt */}
        <path
          d="M34 12 L29 22 L33 22 L28 32"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Windshield */}
        <line
          x1="20"
          y1="24"
          x2="24"
          y2="38"
          stroke="currentColor"
          strokeWidth="1.5"
          opacity="0.5"
        />
        <line
          x1="44"
          y1="24"
          x2="40"
          y2="38"
          stroke="currentColor"
          strokeWidth="1.5"
          opacity="0.5"
        />
      </svg>
    ),
    gradient: 'from-amber-500/10 to-orange-500/10',
    borderHover: 'hover:border-amber-300/60',
    glowColor: 'group-hover:shadow-amber-500/10',
  },
];

export function WhatAreYouBuilding() {
  return (

    <section
      id="what-are-you-building"
      className="relative py-20 md:py-28 bg-white overflow-hidden"
    >
      {/* Background treatment */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(47,95,167,0.06),transparent_40%),radial-gradient(circle_at_70%_80%,rgba(14,165,233,0.06),transparent_40%)]" />
      <div className="absolute inset-0 blueprint-grid opacity-[0.02]" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-14 md:mb-20">
          <ScrollReveal variant="fade-down" delay={100}>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#2F5FA7] mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2F5FA7] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2F5FA7]" />
              </span>
              For Every Builder
            </div>
          </ScrollReveal>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-[#0F172A] mb-5 leading-tight">
            <TextReveal text="What Are You Building?" />
          </h2>
          <ScrollReveal variant="fade-up" delay={200}>
            <p className="text-[#64748B] max-w-xl mx-auto text-sm md:text-base font-medium text-balance">
              MechHub is built for every kind of builder. Whether you&rsquo;re
              competing, flying, or driving — we manufacture the parts you need.
            </p>
          </ScrollReveal>
        </div>

        {/* Cards Grid */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {BUILDER_CATEGORIES.map((category, idx) => (
            <ScrollReveal
              key={category.title}
              variant="fade-up"
              staggerIndex={idx}
              staggerDelay={150}
              className="h-full"
            >
              <Link
                href={category.href}
                className={`group relative flex flex-col h-full rounded-2xl md:rounded-3xl border border-slate-100/80 bg-white p-6 md:p-8 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_30px_80px_-15px_rgba(0,0,0,0.1)] ${category.borderHover} ${category.glowColor}`}
              >
                {/* Background gradient on hover */}
                <div
                  className={`absolute inset-0 rounded-2xl md:rounded-3xl bg-gradient-to-br ${category.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                />

                {/* Shimmer line on hover */}
                <div className="absolute inset-0 rounded-2xl md:rounded-3xl overflow-hidden">
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />
                  </div>
                </div>

                <div className="relative z-10 flex flex-col h-full">
                  {/* Icon */}
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl bg-slate-50 group-hover:bg-white flex items-center justify-center mb-6 md:mb-8 text-[#2F5FA7] transition-all duration-500 group-hover:scale-105 shadow-sm group-hover:shadow-md">
                    {category.icon}
                  </div>

                  {/* Title */}
                  <h3 className="text-xl md:text-2xl font-bold text-[#0F172A] mb-3 tracking-tight group-hover:text-[#2F5FA7] transition-colors duration-300">
                    {category.title}
                  </h3>

                  {/* Description */}
                  <p className="text-[#64748B] text-sm md:text-[15px] leading-relaxed mb-6 md:mb-8 font-medium">
                    {category.description}
                  </p>

                  {/* CTA */}
                  <div className="mt-auto inline-flex items-center gap-2 text-xs md:text-sm font-bold text-[#2F5FA7] uppercase tracking-[0.12em] group-hover:tracking-[0.16em] transition-all duration-300">
                    {category.cta}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
                  </div>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

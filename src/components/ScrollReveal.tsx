'use client';

import { useRef, useEffect, useState, ReactNode, CSSProperties } from 'react';

type RevealVariant =
  | 'fade-up'
  | 'fade-down'
  | 'fade-left'
  | 'fade-right'
  | 'fade-in'
  | 'blur-in'
  | 'scale-in'
  | 'slide-up';

interface ScrollRevealProps {
  children: ReactNode;
  variant?: RevealVariant;
  /** Delay in ms before the animation starts after entering viewport */
  delay?: number;
  /** Duration of the animation in ms */
  duration?: number;
  /** Threshold for IntersectionObserver (0-1) */
  threshold?: number;
  /** If true, animation only plays once */
  once?: boolean;
  /** Additional class names */
  className?: string;
  /** Render as a different element */
  as?: keyof HTMLElementTagNameMap;
  /** Stagger index for children in a group — auto-adds delay */
  staggerIndex?: number;
  /** Base stagger delay per item in ms */
  staggerDelay?: number;
}

const variantStyles: Record<RevealVariant, { hidden: CSSProperties; visible: CSSProperties }> = {
  'fade-up': {
    hidden: { opacity: 0, transform: 'translateY(40px)' },
    visible: { opacity: 1, transform: 'translateY(0)' },
  },
  'fade-down': {
    hidden: { opacity: 0, transform: 'translateY(-40px)' },
    visible: { opacity: 1, transform: 'translateY(0)' },
  },
  'fade-left': {
    hidden: { opacity: 0, transform: 'translateX(-40px)' },
    visible: { opacity: 1, transform: 'translateX(0)' },
  },
  'fade-right': {
    hidden: { opacity: 0, transform: 'translateX(40px)' },
    visible: { opacity: 1, transform: 'translateX(0)' },
  },
  'fade-in': {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  'blur-in': {
    hidden: { opacity: 0, filter: 'blur(10px)', transform: 'translateY(20px)' },
    visible: { opacity: 1, filter: 'blur(0px)', transform: 'translateY(0)' },
  },
  'scale-in': {
    hidden: { opacity: 0, transform: 'scale(0.92)' },
    visible: { opacity: 1, transform: 'scale(1)' },
  },
  'slide-up': {
    hidden: { opacity: 0, transform: 'translateY(60px)' },
    visible: { opacity: 1, transform: 'translateY(0)' },
  },
};

export function ScrollReveal({
  children,
  variant = 'fade-up',
  delay = 0,
  duration = 700,
  threshold = 0.15,
  once = true,
  className = '',
  as: Tag = 'div',
  staggerIndex,
  staggerDelay = 100,
}: ScrollRevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const computedDelay =
    staggerIndex !== undefined ? delay + staggerIndex * staggerDelay : delay;

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            observer.unobserve(element);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, once]);

  const styles = variantStyles[variant];

  const ElementTag = Tag as any;

  return (
    <ElementTag
      ref={ref}
      className={className}
      style={{
        ...(!isVisible ? styles.hidden : styles.visible),
        transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${computedDelay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${computedDelay}ms, filter ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${computedDelay}ms`,
        willChange: 'opacity, transform, filter',
      }}
    >
      {children}
    </ElementTag>
  );
}

/* ─── Word-by-word scroll reveal for headings ─── */
interface TextRevealProps {
  text: string;
  /** Delay before the first word starts revealing */
  delay?: number;
  /** Stagger between each word in ms */
  wordDelay?: number;
  /** Additional class for the container span */
  className?: string;
  /** Class applied to each word span */
  wordClassName?: string;
  /** If true, animation only plays once */
  once?: boolean;
}

export function TextReveal({
  text,
  delay = 0,
  wordDelay = 60,
  className = '',
  wordClassName = '',
  once = true,
}: TextRevealProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.unobserve(element);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold: 0.2, rootMargin: '0px 0px -30px 0px' }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [once]);

  const words = text.split(' ');

  return (
    <span ref={ref} className={`inline ${className}`}>
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          className={`inline-block ${wordClassName}`}
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(14px)',
            filter: isVisible ? 'blur(0px)' : 'blur(4px)',
            transition: `opacity 500ms cubic-bezier(0.16, 1, 0.3, 1) ${delay + i * wordDelay}ms, transform 500ms cubic-bezier(0.16, 1, 0.3, 1) ${delay + i * wordDelay}ms, filter 500ms cubic-bezier(0.16, 1, 0.3, 1) ${delay + i * wordDelay}ms`,
            willChange: 'opacity, transform, filter',
          }}
        >
          {word}
          {i < words.length - 1 ? '\u00A0' : ''}
        </span>
      ))}
    </span>
  );
}

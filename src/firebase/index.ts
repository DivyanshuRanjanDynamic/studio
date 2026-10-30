'use client';

// Barrel for pages and components that read Firestore. Code that runs on every
// page (root providers, HomeNav, landing primitives) imports from the specific
// modules instead: re-exporting the Firestore hooks here means anything imported
// from '@/firebase' bundles the Firestore SDK.
export * from './app';
export * from './provider';
export * from './client-provider';
export * from './firestore/use-firestore';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';

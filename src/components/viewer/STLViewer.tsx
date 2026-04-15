'use client';

import { useMemo, useRef, useEffect, forwardRef, useImperativeHandle, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import {
  OrbitControls,
  PerspectiveCamera,
  OrthographicCamera,
  Stage,
  Bounds,
  useBounds,
  ContactShadows,
  Environment,
  Html,
  Line,
  Edges,
  GizmoHelper,
  GizmoViewcube
} from '@react-three/drei';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { HoleFeature, BendFeature } from '@/types/viewer';

/**
 * Handle type for imperatively controlling the viewer
 */
export interface STLViewerHandle {
  resetView: () => void;
  setOrientation: (view: 'top' | 'front' | 'side' | 'iso') => void;
  zoom: (delta: number) => void;
  setZoom: (value: number) => void;
  setMode: (mode: '2D' | '3D') => void;
}

interface STLModelProps {
  buffer: ArrayBuffer;
  color?: string;
  finishType?: 'anodizing' | 'powder_coating' | 'raw';
  serviceMode?: 'none' | 'tapping' | 'bending' | 'countersink' | 'engraving';
}

function STLModel({
  buffer,
  color = '#f1f5f9', // Professional CNC Aluminum Matte
  finishType = 'raw',
  serviceMode = 'none',
  viewMode = '3D'
}: STLModelProps & { viewMode: '2D' | '3D' }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const edgesRef = useRef<THREE.LineSegments>(null);
  const opacityRef = useRef(0.94);
  const isTechnical = serviceMode !== 'none';

  // Animation & Material Lerping
  useFrame((state, delta) => {
    const targetOpacity = isTechnical ? 0.15 : 0.94;
    opacityRef.current = THREE.MathUtils.lerp(opacityRef.current, targetOpacity, delta * 10);

    if (meshRef.current) {
      if (Array.isArray(meshRef.current.material)) {
        meshRef.current.material.forEach(m => {
          m.opacity = opacityRef.current;
          m.transparent = true;
          m.depthWrite = !isTechnical;
          // In technical mode, we want subtle phong shading even for ghosting
          if (isTechnical && m instanceof THREE.MeshPhongMaterial) {
            m.shininess = 30;
            m.specular = new THREE.Color(0xffffff);
          }
        });
      } else {
        meshRef.current.material.opacity = opacityRef.current;
        meshRef.current.material.transparent = true;
        meshRef.current.material.depthWrite = !isTechnical;
        if (isTechnical && meshRef.current.material instanceof THREE.MeshPhongMaterial) {
          meshRef.current.material.shininess = 30;
          meshRef.current.material.specular = new THREE.Color(0xffffff);
        }
      }
      meshRef.current.renderOrder = 0;
    }

    if (edgesRef.current) {
      const edgeMat = edgesRef.current.material as THREE.LineBasicMaterial;
      // Always show edges subtly for a professional CAD look
      edgeMat.opacity = isTechnical ? 0.75 : 0.25;
      edgesRef.current.visible = true;
    }
  });

  const geometry = useMemo(() => {
    const loader = new STLLoader();
    const geo = loader.parse(buffer);
    geo.computeBoundingBox();
    // Senior Fix: Do NOT center the geometry. Absolute coordinates 
    // are required for perfect alignment with CAD feature metadata.
    return geo;
  }, [buffer]);

  const edgesGeometry = useMemo(() => new THREE.EdgesGeometry(geometry, 25), [geometry]);

  // Clean up geometries
  useEffect(() => {
    return () => {
      edgesGeometry.dispose();
    };
  }, [edgesGeometry]);

  const roughness = finishType === 'anodizing' ? 0.35 : finishType === 'powder_coating' ? 0.8 : 0.45;
  const metalness = finishType === 'powder_coating' ? 0.1 : 0.85;

  return (
    <group>
      <mesh ref={meshRef} geometry={geometry} castShadow={!isTechnical} receiveShadow={!isTechnical}>
        {isTechnical ? (
          <meshPhongMaterial
            color="#f1f5f9" // Solid Technical Material (Zinc-100) — Essential for line visibility
            shininess={10}
            specular="#64748b"
            side={THREE.DoubleSide}
            polygonOffset
            polygonOffsetFactor={2}
            polygonOffsetUnits={1}
            transparent={false}
            opacity={1}
          />
        ) : viewMode === '2D' ? (
          <meshBasicMaterial color="#334155" />
        ) : (
          <meshStandardMaterial
            color={color}
            roughness={roughness}
            metalness={metalness}
            envMapIntensity={finishType === 'anodizing' ? 1.5 : 0.5}
            transparent={finishType !== 'raw'}
            opacity={opacityRef.current}
          />
        )}

        {/* Professional CAD Outlines (Fixed 1px style) */}
        <Edges threshold={20} color={isTechnical ? "#475569" : "#000000"} />
      </mesh>
    </group>
  );
}

function HoleOverlays({ holes, hoveredIndex, isTechnical, maxDimension, selectedIndices = [] }: { holes: HoleFeature[], hoveredIndex?: number, isTechnical?: boolean, maxDimension: number, selectedIndices?: number[] }) {
  return (
    <>
      {holes
        .filter((hole) => (hole.radius * 2) < (maxDimension * 0.15)) // Dynamic Intelligent Filter: Skip blobs
        .map((hole, idx) => {
          const isHovered = hoveredIndex === idx;
          const isSelected = selectedIndices.includes(idx);
          const isActive = isHovered || isSelected;

          const cylinderDir = new THREE.Vector3(0, 1, 0);
          const holeNormal = new THREE.Vector3(hole.normal.x, hole.normal.y, hole.normal.z);
          const quaternion = new THREE.Quaternion().setFromUnitVectors(cylinderDir, holeNormal);

          return (
            <group key={idx} position={[hole.center.x, hole.center.y, hole.center.z]} renderOrder={10}>
              <group quaternion={quaternion}>
                {/* Highlight: show when hovered OR when a tap is selected */}
                {isActive && (
                  <>
                    {/* Main Hole Feature Highlight */}
                    <mesh renderOrder={999}>
                      <cylinderGeometry args={[hole.radius * 0.99, hole.radius * 0.99, hole.depth * 1.01, 32]} />
                      <meshStandardMaterial
                        color="#1e293b" // Industrial charcoal
                        roughness={0.9}
                        metalness={0.1}
                        side={THREE.DoubleSide}
                        depthTest={true}
                        polygonOffset
                        polygonOffsetFactor={-10}
                      />
                    </mesh>

                    {/* Technical Centerline Guide */}
                    <line>
                      <bufferGeometry>
                        <bufferAttribute
                          attach="attributes-position"
                          args={[new Float32Array([0, -hole.depth, 0, 0, hole.depth, 0]), 3]}
                        />
                      </bufferGeometry>
                      <lineDashedMaterial
                        color="#1e293b"
                        transparent
                        opacity={0.3}
                        dashSize={0.5}
                        gapSize={0.2}
                        depthTest={false}
                      />
                    </line>
                  </>
                )}
              </group>
            </group>
          )
        })}
    </>
  );
}

function BendOverlays({ bends, hoveredIndex, onHoverChange }: { bends: BendFeature[], hoveredIndex?: number, onHoverChange?: (idx: number | undefined) => void }) {
  return (
    <>
      {bends.map((bend, idx) => {
        const start = new THREE.Vector3(bend.start.x, bend.start.y, bend.start.z);
        const end = new THREE.Vector3(bend.end.x, bend.end.y, bend.end.z);
        const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

        const isHovered = hoveredIndex === idx;
        const color = bend.direction === 'UP' ? '#3B82F6' : '#F97316'; // Blue-500 : Orange-500
        const isDashed = bend.direction === 'DOWN';

        // Calculate rotation for the interaction cylinder and arrow
        const direction = new THREE.Vector3().subVectors(end, start).normalize();
        const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);

        return (
          <group key={idx} renderOrder={25}>
            {/* High-Fidelity Technical Bend Line */}
            <Line
              points={[start, end]}
              color={isHovered ? '#FACC15' : color} // Yellow-400 on hover
              lineWidth={isHovered ? 4 : 2}
              dashed={isDashed}
              dashScale={1}
              gapSize={0.5}
              dashSize={1}
              transparent
              opacity={0.9}
              depthTest={false}
            />

            {/* Interaction Layer (Invisible thick tube for easier hover) */}
            <mesh
              position={midPoint}
              quaternion={quaternion}
              onPointerOver={(e) => {
                e.stopPropagation();
                onHoverChange?.(idx);
                document.body.style.cursor = 'help';
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                onHoverChange?.(undefined);
                document.body.style.cursor = 'auto';
              }}
            >
              <cylinderGeometry args={[2.5, 2.5, start.distanceTo(end), 8]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            {/* Directional Indicator (Arrow highlighting fold nature) */}
            <group position={midPoint} quaternion={quaternion} renderOrder={30}>
              <mesh position={[0, bend.direction === 'UP' ? 2 : -2, 0]} rotation={[bend.direction === 'UP' ? 0 : Math.PI, 0, 0]}>
                <coneGeometry args={[0.8, 1.5, 4]} />
                <meshBasicMaterial color={color} depthTest={false} transparent opacity={0.8} />
              </mesh>
            </group>

            {/* Technical Tooltip */}
            {isHovered && (
              <Html position={midPoint} center>
                <div className="bg-slate-900/92 px-2 py-1 rounded border border-slate-700 shadow-lg whitespace-nowrap pointer-events-none -translate-y-5">
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="font-mono font-semibold text-white">{(bend.angle || 0).toFixed(1)}°</span>
                    <span className={`${bend.direction === 'UP' ? 'text-blue-400' : 'text-orange-400'} font-medium`}>
                      {bend.direction}
                    </span>
                    <span className="font-mono text-slate-400">R{(bend.radius || 0).toFixed(1)}</span>
                  </div>
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </>
  );
}

/**
 * Internal component to handle camera logic within the Canvas
 */
function ViewHandler({
  onMount,
  orthographic,
  viewMode,
  serviceMode
}: {
  onMount: (handle: STLViewerHandle) => void,
  orthographic: boolean,
  viewMode: '2D' | '3D',
  serviceMode?: string
}) {
  const { camera, controls } = useThree();
  const bounds = useBounds();

  const resetView = useCallback(() => {
    bounds.refresh().clip().fit();
  }, [bounds]);

  const setOrientation = useCallback((view: 'top' | 'front' | 'side' | 'iso') => {
    const distance = 5; // Default distance

    // We'll reset first to ensure we have clear bounds
    bounds.refresh().clip().fit();

    switch (view) {
      case 'top':
        camera.position.set(0, distance, 0);
        break;
      case 'front':
        camera.position.set(0, 0, distance);
        break;
      case 'side':
        camera.position.set(distance, 0, 0);
        break;
      case 'iso':
        camera.position.set(distance, distance, distance);
        break;
    }

    camera.lookAt(0, 0, 0);
    if (controls) {
      // @ts-ignore
      controls.target.set(0, 0, 0);
      // @ts-ignore
      controls.update();
    }
  }, [camera, controls, bounds]);

  const zoom = useCallback((delta: number) => {
    const factor = delta > 0 ? 0.9 : 1.1;
    camera.position.multiplyScalar(factor);
    camera.updateProjectionMatrix();
  }, [camera]);

  const setZoom = useCallback((value: number) => {
    // We'll treat 0-1 as a scale between a "near" and "far" position
    const minDistance = 1;
    const maxDistance = 15;
    const targetDistance = maxDistance - (value * (maxDistance - minDistance));

    const direction = camera.position.clone().normalize();
    camera.position.copy(direction.multiplyScalar(targetDistance));
    camera.updateProjectionMatrix();
  }, [camera]);

  // Handle technical mode transition
  useEffect(() => {
    if (serviceMode && serviceMode !== 'none') {
      setOrientation('iso');
      // If camera is orthographic, adjust zoom
      if (orthographic && camera instanceof THREE.OrthographicCamera) {
        bounds.refresh().clip().fit();
      }
    }
  }, [serviceMode, setOrientation, orthographic, camera, bounds]);

  // Handle mode transitions
  useEffect(() => {
    if (viewMode === '2D') {
      setOrientation('top');
      camera.lookAt(0, 0, 0);
    }
  }, [viewMode, setOrientation, camera]);

  useEffect(() => {
    onMount({ resetView, setOrientation, zoom, setZoom, setMode: () => { } });
  }, [onMount, resetView, setOrientation, zoom, setZoom]);

  return null;
}

interface STLViewerProps {
  buffer: ArrayBuffer;
  className?: string;
  onCameraChange?: (camera: THREE.Camera) => void;
  orthographic?: boolean;
  initialMode?: '2D' | '3D';
  color?: string;
  finishType?: 'anodizing' | 'powder_coating' | 'raw';
  holes?: HoleFeature[];
  bends?: BendFeature[];
  showHoles?: boolean;
  showBends?: boolean;
  hoveredHoleIndex?: number;
  hoveredBendIndex?: number;
  selectedHoleIndices?: number[];
  serviceMode?: 'none' | 'tapping' | 'bending' | 'countersink' | 'engraving';
  boundingBox?: { x: number, y: number, z: number };
}

/**
 * 3D Canvas for viewing STL models.
 */
export const STLViewer = forwardRef<STLViewerHandle, STLViewerProps>(
  ({
    buffer,
    className,
    orthographic = false,
    initialMode = '3D',
    color,
    finishType,
    holes = [],
    bends = [],
    showHoles = true,
    showBends = true,
    hoveredHoleIndex,
    hoveredBendIndex,
    selectedHoleIndices = [],
    serviceMode = 'none',
    boundingBox
  }, ref) => {
    const [viewMode, setViewMode] = useState<'2D' | '3D'>(initialMode);
    const [internalHoveredBendIndex, setInternalHoveredBendIndex] = useState<number | undefined>(undefined);
    const [viewHandle, setViewHandle] = useState<STLViewerHandle | null>(null);

    const activeBendIndex = hoveredBendIndex !== undefined ? hoveredBendIndex : internalHoveredBendIndex;

    // Production Debug: Log feature counts to verify API response integrity
    useEffect(() => {
      if (serviceMode !== 'none') {
        console.log(`[STLViewer] Service Active: ${serviceMode}`);
        console.log(`[STLViewer] Data Check: ${holes.length} holes, ${bends.length} bending lines found.`);
      }
    }, [serviceMode, holes.length, bends.length]);

    useImperativeHandle(ref, () => ({
      resetView: () => viewHandle?.resetView(),
      setOrientation: (view) => viewHandle?.setOrientation(view),
      zoom: (delta) => viewHandle?.zoom(delta),
      setZoom: (value) => viewHandle?.setZoom(value),
      setMode: (mode) => setViewMode(mode)
    }), [viewHandle]);

    return (
      <div className={`relative bg-white rounded-xl overflow-hidden group ${className}`}>
        <Canvas
          shadows={{ type: THREE.PCFShadowMap }}
          dpr={[1, 2]}
          gl={{
            antialias: true,
            preserveDrawingBuffer: true,
            alpha: true,
          }}
          onCreated={({ gl }) => {
            gl.setClearColor('#ffffff');
          }}
        >

          <color attach="background" args={['#ffffff']} />

          {(viewMode === '2D' || serviceMode !== 'none') ? (
            <OrthographicCamera
              makeDefault
              position={[0, 10, 0]}
              zoom={50}
              up={viewMode === '2D' ? [0, 0, -1] : [0, 1, 0]}
            />
          ) : (
            <PerspectiveCamera makeDefault position={[5, 5, 5]} fov={45} />
          )}

          <ambientLight intensity={serviceMode !== 'none' ? 0.4 : 0.7} />
          <directionalLight
            position={[10, 10, 10]}
            intensity={serviceMode !== 'none' ? 1.0 : 1}
            castShadow={serviceMode === 'none'}
          />

          {(viewMode === '3D' && serviceMode === 'none') && <Environment preset="city" />}

          {/* CRITICAL: Use Bounds for framing, but disable Stage centering to ensure 
              absolute coordinate consistency between part and technical overlays. */}
          <group>
            <Bounds fit clip observe margin={1.2}>
              <STLModel
                buffer={buffer}
                viewMode={viewMode}
                color={color}
                finishType={finishType}
                serviceMode={serviceMode}
              />
              {(() => {
                const maxDim = Math.max(
                  boundingBox?.x || 100,
                  boundingBox?.y || 100,
                  boundingBox?.z || 100
                );
                return showHoles && <HoleOverlays holes={holes} hoveredIndex={hoveredHoleIndex} isTechnical={serviceMode !== 'none'} maxDimension={maxDim} selectedIndices={selectedHoleIndices} />;
              })()}
              {showBends && (
                <BendOverlays
                  bends={bends}
                  hoveredIndex={activeBendIndex}
                  onHoverChange={setInternalHoveredBendIndex}
                />
              )}
              <ViewHandler
                onMount={setViewHandle}
                orthographic={viewMode === '2D' || serviceMode !== 'none'}
                viewMode={viewMode}
                serviceMode={serviceMode}
              />
            </Bounds>
          </group>

          <OrbitControls
            makeDefault
            minPolarAngle={viewMode === '2D' ? 0 : 0}
            maxPolarAngle={viewMode === '2D' ? 0 : Math.PI}
            enableRotate={viewMode === '3D'}
            enableDamping
            dampingFactor={0.1}
            rotateSpeed={0.5}
          />

          {/* Professional Orientation Gizmo (Senior Level CAD Widget) */}
          <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
            <GizmoViewcube
              font="bold 24px Inter, sans-serif"
              opacity={0.9}
              strokeColor="#cbd5e1"
              textColor="#334155"
              hoverColor="#2F5FA7"
              color="#ffffff"
            />
          </GizmoHelper>

          {viewMode === '3D' && serviceMode === 'none' && (
            <ContactShadows
              resolution={1024}
              scale={15}
              blur={2.5}
              opacity={0.2}
              far={10}
              color="#000000"
            />
          )}

          {viewMode === '3D' && serviceMode === 'none' && <Environment preset="city" />}
        </Canvas>

        {serviceMode !== 'none' && (
          <div className="absolute top-4 left-4 z-10">
            <div className="bg-[#2F5FA7] border px-3 py-1.5 rounded-lg border-[#2F5FA7] shadow-lg shadow-blue-500/20 translate-y-[-2px]">
              <p className="text-[10px] font-mono font-black text-white uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Service: {serviceMode}
              </p>
            </div>
          </div>
        )}

        {/* Focus Indicator */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#2F5FA7] animate-pulse" />
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Live 3D Geometry</span>
        </div>
      </div>
    );
  }
);

STLViewer.displayName = 'STLViewer';

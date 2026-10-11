import { ReactNode, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { isMobile } from "../lib/env";
import { heroProgress, useHero } from "./heroState";

type V3 = [number, number, number];
interface PartDef { name: string; pos: V3; rot: V3; from: V3; fromRot: V3 }

// Assembled positions (1 unit ≈ 1 m, chest at origin, facing +Z) and exploded start offsets.
const TH = 0.42;
const dL = [-Math.sin(TH), -Math.cos(TH)], dR = [Math.sin(TH), -Math.cos(TH)];
const shL = [-0.33, 0.27], shR = [0.33, 0.27];
const at = (sh: number[], d: number[], k: number): V3 => [sh[0] + d[0] * k, sh[1] + d[1] * k, 0];

export const PARTS: PartDef[] = [
  { name: "body", pos: [0, 0, 0], rot: [0, 0, 0], from: [0, -0.55, 0.6], fromRot: [-0.5, 0.6, 0.15] },
  { name: "hood", pos: [0, 0.46, -0.04], rot: [0, 0, 0], from: [0.15, 0.95, -0.4], fromRot: [0.8, 0.4, 0.5] },
  { name: "sleeve_L_upper", pos: at(shL, dL, 0.13), rot: [0, 0, -TH], from: [-0.95, 0.6, 0.2], fromRot: [0.4, 0.5, 1.2] },
  { name: "sleeve_L_lower", pos: at(shL, dL, 0.4), rot: [0, 0, -TH], from: [-1.1, -0.5, 0.4], fromRot: [-0.6, 0.3, -0.9] },
  { name: "sleeve_R_upper", pos: at(shR, dR, 0.13), rot: [0, 0, TH], from: [0.95, 0.7, -0.1], fromRot: [0.3, -0.6, -1.1] },
  { name: "sleeve_R_lower", pos: at(shR, dR, 0.4), rot: [0, 0, TH], from: [1.05, -0.6, 0.5], fromRot: [0.5, -0.4, 0.8] },
  { name: "pocket", pos: [0, -0.17, 0.15], rot: [0, 0, 0], from: [0.3, -1.0, 0.9], fromRot: [0.8, 0.5, 0.6] },
  { name: "hem", pos: [0, -0.37, 0], rot: [0, 0, 0], from: [0, -1.2, 0.2], fromRot: [0.3, 0, 0.2] },
  { name: "drawstring_L", pos: [-0.05, 0.3, 0.14], rot: [0, 0, 0.05], from: [-0.5, 1.0, 0.7], fromRot: [1, 0.5, 0.9] },
  { name: "drawstring_R", pos: [0.05, 0.3, 0.14], rot: [0, 0, -0.05], from: [0.55, 1.1, 0.6], fromRot: [-1, 0.4, -0.9] },
];
const EXTRA: Record<string, number> = {};
const defFor = (name: string): PartDef => {
  const f = PARTS.find((p) => p.name === name);
  if (f) return f;
  const h = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  EXTRA[name] = h;
  return { name, pos: [0, 0, 0], rot: [0, 0, 0], from: [Math.sin(h) * 0.9, Math.cos(h) * 0.9, 0.4], fromRot: [Math.sin(h), Math.cos(h), 0.5] };
};

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const partT = (p: number, i: number) => ease(Math.min(1, Math.max(0, (p - i * 0.035) / 0.7)));
const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// near-black garments need a lifted tone to read in 3D
const lift = (hex: string) => { if (!hex) return "#5b5c62"; const n = parseInt(hex.slice(1), 16); const l = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; return l < 0.22 ? "#3a3a40" : hex; };

function useFabric(color: string) {
  const mat = useMemo(() => {
    const cv = document.createElement("canvas"); cv.width = cv.height = 128;
    const g = cv.getContext("2d")!; const img = g.createImageData(128, 128);
    for (let i = 0; i < img.data.length; i += 4) { const v = 110 + Math.random() * 90; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
    g.putImageData(img, 0, 0);
    const bump = new THREE.CanvasTexture(cv); bump.wrapS = bump.wrapT = THREE.RepeatWrapping; bump.repeat.set(5, 5);
    return new THREE.MeshStandardMaterial({ color: lift(color), roughness: 0.9, metalness: 0, bumpMap: bump, bumpScale: 0.6 });
  }, [color]);
  return mat;
}

function geoFor(name: string, mat: THREE.Material): ReactNode {
  switch (name) {
    case "body": return <RoundedBox args={[0.62, 0.7, 0.28]} radius={0.08} smoothness={3} material={mat} />;
    case "hood": return <mesh material={mat} scale={[0.4, 0.36, 0.33]}><sphereGeometry args={[0.5, 28, 20]} /></mesh>;
    case "pocket": return <RoundedBox args={[0.36, 0.16, 0.04]} radius={0.02} smoothness={2} material={mat} />;
    case "hem": return <RoundedBox args={[0.64, 0.07, 0.29]} radius={0.03} smoothness={2} material={mat} />;
    case "drawstring_L": case "drawstring_R": return <mesh><cylinderGeometry args={[0.009, 0.009, 0.2, 8]} /><meshStandardMaterial color="#d8d3c8" roughness={0.8} /></mesh>;
    default: return <mesh material={mat}><capsuleGeometry args={[name.includes("upper") ? 0.088 : 0.078, 0.2, 6, 14]} /></mesh>;
  }
}

interface Rig { spread: number; spin: number }

function useAssemble(groups: React.MutableRefObject<{ obj: THREE.Object3D; def: PartDef; base: THREE.Vector3; baseRot: THREE.Euler; i: number }[]>, root: React.RefObject<THREE.Group>, rig: Rig, scale: number) {
  const { viewport } = useThree();
  useFrame((st, dt) => {
    const p = heroProgress.v, t = st.clock.elapsedTime;
    const xs = Math.min(1.25, Math.max(0.55, viewport.width / 2.4));
    groups.current.forEach(({ obj, def, base, baseRot, i }) => {
      const e = partT(p, i), k = 1 - e;
      obj.position.set(base.x + def.from[0] * xs * k, base.y + def.from[1] * 0.85 * k + Math.sin(t * 0.8 + i) * 0.035 * k, base.z + def.from[2] * 0.3 * k);
      obj.rotation.set(baseRot.x + def.fromRot[0] * k + Math.sin(t * 0.6 + i) * 0.06 * k, baseRot.y + def.fromRot[1] * k, baseRot.z + def.fromRot[2] * k);
    });
    if (root.current) {
      rig.spin += dt * 0.35 * smooth(0.82, 1, p);
      root.current.rotation.y = rig.spin + (1 - smooth(0.0, 0.9, p)) * 0.4;
      root.current.scale.setScalar(scale * (0.9 + 0.1 * smooth(0, 1, p)));
    }
  });
}

function Procedural({ scale, color }: { scale: number; color: string }) {
  const mat = useFabric(color);
  const root = useRef<THREE.Group>(null);
  const groups = useRef<{ obj: THREE.Object3D; def: PartDef; base: THREE.Vector3; baseRot: THREE.Euler; i: number }[]>([]);
  const rig = useRef<Rig>({ spread: 1, spin: 0 }).current;
  const refs = useRef<(THREE.Group | null)[]>([]);
  useLayoutEffect(() => {
    groups.current = PARTS.map((def, i) => ({ obj: refs.current[i]!, def, base: new THREE.Vector3(...def.pos), baseRot: new THREE.Euler(...def.rot), i })).filter((g) => g.obj);
    useHero.getState().setReady();
  }, []);
  useAssemble(groups, root, rig, scale);
  return (
    <group ref={root} position={[0, 0.1, 0]}>
      {PARTS.map((d, i) => (
        <group key={d.name} ref={(r) => (refs.current[i] = r)}>{geoFor(d.name, mat)}</group>
      ))}
    </group>
  );
}

// Pull the camera back on tall/narrow screens so the whole hoodie (sleeves included) fits.
function CameraFit() {
  const { camera, size } = useThree();
  useEffect(() => {
    const aspect = size.width / size.height;
    camera.position.z = 3.8 / Math.min(1, aspect * 1.45);
    camera.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}

function FpsGuard({ onLow }: { onLow: () => void }) {
  const acc = useRef({ n: 0, t: 0, bad: 0, windows: 0 });
  useFrame((_, dt) => {
    const a = acc.current;
    if (a.windows > 6) return;
    a.n++; a.t += dt;
    if (a.t >= 1) {
      const fps = a.n / a.t;
      a.bad = fps < 24 ? a.bad + 1 : 0; a.windows++; a.n = 0; a.t = 0;
      if (a.bad >= 3) onLow();
    }
  });
  return null;
}

// Built-in procedural hoodie: shown only until the real hero video / static image exist.
export default function HeroScene({ active, onLowFps, color = "#5b5c62" }: { active: boolean; onLowFps: () => void; color?: string }) {
  const mobile = isMobile();
  const scale = mobile ? 1.0 : 1.05;
  return (
    <Canvas
      dpr={[1, mobile ? 1.5 : 2]}
      frameloop={active ? "always" : "never"}
      camera={{ position: [0, 0.02, mobile ? 4 : 3.8], fov: 35 }}
      gl={{ antialias: !mobile, powerPreference: "high-performance", alpha: true }}
      style={{ touchAction: "pan-y" }}
      aria-hidden="true"
    >
      <hemisphereLight args={["#fbf7ef", "#9a958c", mobile ? 1.5 : 1.3]} />
      <directionalLight position={[2.5, 3, 4]} intensity={mobile ? 2.2 : 2.8} />
      {!mobile && <directionalLight position={[-3, 1, -2]} intensity={0.9} color="#cfd8e6" />}
      <CameraFit />
      <Procedural scale={scale} color={color} />
      <FpsGuard onLow={onLowFps} />
    </Canvas>
  );
}




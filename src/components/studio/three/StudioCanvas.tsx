"use client";

import { memo, Suspense, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Billboard, ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { Flower } from "@/data/flowers";
import {
  resolvePlacement,
  snapPlacement,
  type Placement,
  type Resolved,
  type VaseSpec,
} from "@/lib/flora/physics";
import { getBelowStemGeometry, getFlowerAsset, getMaterials, setWindTime, updateLightView } from "./models";
import { HDRI_URL } from "@/lib/flora/assets";
import { createWaterMaterial, updateWater, VaseModel } from "./Vases";

function setControlsEnabled(controls: unknown, enabled: boolean) {
  const c = controls as { enabled?: boolean } | null;
  if (c && c.enabled !== enabled) c.enabled = enabled;
}

export type DragState = {
  mode: "new" | "move";
  slug: string;
  id: string;
  clientX: number;
  clientY: number;
  planeY: number;
  scale: number;
  spin: number;
  /** 目前吸附到的位置（null = 沒有吸附，放開會取消） */
  snap: Placement | null;
};

type Props = {
  vase: VaseSpec;
  bySlug: Map<string, Flower>;
  resolved: Resolved[];
  selectedId: string | null;
  dragging: boolean;
  /** false 時（例如示範中）不能拖曳或選取花朵 */
  interactive?: boolean;
  /** 依序插入時每枝花延遲落下的秒數 */
  enterDelays?: Record<string, number>;
  /** 花藝師示範播放中：鏡頭緩慢環繞 */
  autoRotate?: boolean;
  dragRef: RefObject<DragState | null>;
  captureRef: RefObject<(() => string) | null>;
  onSelect: (id: string | null) => void;
  onStartMove: (state: DragState) => void;
  onMove: (placement: Placement) => void;
};

const UP = new THREE.Vector3(0, 1, 0);
const ghostMaterial = new THREE.MeshBasicMaterial({
  color: "#b5525c",
  transparent: true,
  opacity: 0.35,
  depthWrite: false,
});

// ───────────── 單枝花：彈性阻尼（Spring Physics）＋平滑移動 ─────────────

const FlowerStem = memo(function FlowerStem({
  r,
  flower,
  selected,
  ghost = false,
  enterDelay = 0,
  onSelect,
  onStartMove,
}: {
  r: Resolved;
  flower: Flower;
  selected?: boolean;
  ghost?: boolean;
  enterDelay?: number;
  onSelect?: (id: string) => void;
  onStartMove?: (e: ThreeEvent<PointerEvent>, r: Resolved) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const asset = useMemo(() => getFlowerAsset(flower, flower.height * r.scale), [flower, r.scale]);
  const mats = useMemo(() => getMaterials(flower), [flower]);
  const camera = useThree((s) => s.camera);

  const target = useMemo(() => {
    const q = new THREE.Quaternion().setFromUnitVectors(UP, new THREE.Vector3(...r.dir));
    q.multiply(new THREE.Quaternion().setFromAxisAngle(UP, r.spin));
    return { pos: new THREE.Vector3(...r.pivot), quat: q };
  }, [r.dir, r.pivot, r.spin]);

  // 新插入的花從上方落進瓶口（預覽用的 ghost 直接到位）
  const sim = useRef({
    pos: new THREE.Vector3(r.pivot[0], r.pivot[1] + (ghost ? 0 : 0.2), r.pivot[2]),
    quat: target.quat.clone(),
    off: new THREE.Vector2(),
    vel: new THREE.Vector2(),
    wait: enterDelay,
  });

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const s = sim.current;
    const step = Math.min(dt, 1 / 30);
    if (s.wait > 0) {
      s.wait -= step;
      g.visible = false;
      return;
    }
    g.visible = true;
    if (ghost) {
      s.pos.copy(target.pos);
      s.quat.copy(target.quat);
    } else {
      s.pos.lerp(target.pos, 1 - Math.exp(-step * 9));
      s.quat.slerp(target.quat, 1 - Math.exp(-step * 10));
    }
    // 阻尼彈簧：a = -k·x - c·v（略為欠阻尼，會輕輕回彈）
    const K = 90;
    const C = 7;
    s.vel.x += (-K * s.off.x - C * s.vel.x) * step;
    s.vel.y += (-K * s.off.y - C * s.vel.y) * step;
    s.off.x += s.vel.x * step;
    s.off.y += s.vel.y * step;
    s.off.clampLength(0, 0.18);
    // 螢幕上的推動方向轉成世界座標的旋轉軸
    const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0).setY(0).normalize();
    const fwd = new THREE.Vector3().crossVectors(UP, right).negate();
    const axisA = new THREE.Vector3().crossVectors(UP, right).negate();
    const axisB = new THREE.Vector3().crossVectors(UP, fwd).negate();
    const tilt = new THREE.Quaternion()
      .setFromAxisAngle(axisA.normalize(), s.off.x)
      .multiply(new THREE.Quaternion().setFromAxisAngle(axisB.normalize(), s.off.y));
    g.position.copy(s.pos);
    g.quaternion.copy(tilt).multiply(s.quat);
  });

  const nudge = (e: ThreeEvent<PointerEvent>) => {
    if (ghost) return;
    e.stopPropagation();
    const s = sim.current;
    s.vel.x += THREE.MathUtils.clamp(e.nativeEvent.movementX, -40, 40) * 0.035;
    s.vel.y += THREE.MathUtils.clamp(e.nativeEvent.movementY, -40, 40) * 0.025;
  };

  const L = flower.height * r.scale;

  return (
    <group
      ref={group}
      onPointerMove={ghost ? undefined : nudge}
      onPointerOver={ghost ? undefined : () => (document.body.style.cursor = "grab")}
      onPointerOut={ghost ? undefined : () => (document.body.style.cursor = "")}
      onPointerDown={
        ghost
          ? undefined
          : (e) => {
              e.stopPropagation();
              onSelect?.(r.id);
              onStartMove?.(e, r);
            }
      }
    >
      {asset.map(({ key, geometry }) => (
        <mesh
          key={key}
          geometry={geometry}
          material={ghost ? ghostMaterial : mats[key]}
          castShadow={!ghost}
          receiveShadow={!ghost}
        />
      ))}
      <mesh
        geometry={getBelowStemGeometry()}
        material={ghost ? ghostMaterial : mats.stem}
        scale={[1, r.below, 1]}
        castShadow={!ghost}
      />
      {selected && (
        <Billboard position={[0, L, 0]}>
          <mesh userData={{ noCapture: true }}>
            <ringGeometry args={[r.headRadius * 1.05, r.headRadius * 1.15, 48]} />
            <meshBasicMaterial color="#b5525c" transparent opacity={0.8} depthTest={false} />
          </mesh>
        </Billboard>
      )}
    </group>
  );
});

// ───────────── 拖曳與磁吸（Magnetic Snap） ─────────────

function DragController({
  vase,
  bySlug,
  dragRef,
  onMove,
  setGhost,
}: {
  vase: VaseSpec;
  bySlug: Map<string, Flower>;
  dragRef: RefObject<DragState | null>;
  onMove: (p: Placement) => void;
  setGhost: (s: { mode: DragState["mode"]; p: Placement } | null) => void;
}) {
  const { camera, gl, raycaster } = useThree();
  const last = useRef("");
  const plane = useMemo(() => new THREE.Plane(), []);
  const hit = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const d = dragRef.current;
    if (!d) {
      if (last.current) {
        last.current = "";
        setGhost(null);
      }
      return;
    }
    const flower = bySlug.get(d.slug);
    if (!flower) return;
    const rect = gl.domElement.getBoundingClientRect();
    const inside =
      d.clientX >= rect.left && d.clientX <= rect.right && d.clientY >= rect.top && d.clientY <= rect.bottom;
    let snap: Placement | null = null;
    if (inside) {
      const ndc = new THREE.Vector2(
        ((d.clientX - rect.left) / rect.width) * 2 - 1,
        -((d.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(ndc, camera);
      plane.set(UP, -d.planeY);
      if (raycaster.ray.intersectPlane(plane, hit)) {
        snap = snapPlacement(flower, vase, [hit.x, hit.z], { id: d.id, spin: d.spin, scale: d.scale });
      }
    }
    d.snap = snap;
    const key = snap ? `${snap.anchor.join()}|${snap.lean.map((v) => v.toFixed(3)).join()}` : "none";
    if (key === last.current) return;
    last.current = key;
    setGhost(snap ? { mode: d.mode, p: snap } : null);
    if (d.mode === "move" && snap) onMove(snap);
  });
  return null;
}

function AnchorMarkers({ vase, active }: { vase: VaseSpec; active: Placement | null }) {
  return (
    <group position={[0, vase.mouthY + 0.0015, 0]}>
      {vase.anchors.map(([x, z]) => {
        const on = active && active.anchor[0] === x && active.anchor[1] === z;
        return (
          <mesh key={`${x},${z}`} userData={{ noCapture: true }} position={[x, 0, z]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={5}>
            <ringGeometry args={on ? [0.005, 0.0085, 32] : [0.0025, 0.0042, 24]} />
            <meshBasicMaterial color={on ? "#b5525c" : "#ffffff"} transparent opacity={on ? 1 : 0.85} depthTest={false} />
          </mesh>
        );
      })}
    </group>
  );
}

// ───────────── 渲染管線：先畫不含水的場景到 FBO，再讓水的 shader 取樣折射 ─────────────

function RenderPipeline({
  glassRef,
  waterMaterial,
  captureRef,
}: {
  glassRef: RefObject<THREE.Group | null>;
  waterMaterial: THREE.ShaderMaterial;
  captureRef: RefObject<(() => string) | null>;
}) {
  const { gl, size, scene, camera } = useThree();
  const fbo = useMemo(() => new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 }), []);

  useEffect(() => {
    const dpr = gl.getPixelRatio();
    fbo.setSize(Math.floor(size.width * dpr), Math.floor(size.height * dpr));
  }, [fbo, gl, size]);

  useEffect(() => () => fbo.dispose(), [fbo]);

  useEffect(() => {
    // 配方卡截圖：暫時把鏡頭拉到能完整框住花器與所有花材的位置，截完再還原
    captureRef.current = () => {
      const cam = camera as THREE.PerspectiveCamera;
      const box = new THREE.Box3();
      scene.traverse((o) => {
        if ((o as THREE.Mesh).isMesh && o.visible && o.name !== "floor" && !o.userData.noCapture)
          box.expandByObject(o);
      });
      const saved = { pos: cam.position.clone(), quat: cam.quaternion.clone() };
      if (!box.isEmpty()) {
        const center = box.getCenter(new THREE.Vector3());
        const radius = box.getBoundingSphere(new THREE.Sphere()).radius;
        const CARD_ASPECT = 952 / 760;
        const tanV = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
        const visibleTanV = cam.aspect < CARD_ASPECT ? tanV * (cam.aspect / CARD_ASPECT) : tanV;
        const visibleTanH = visibleTanV * CARD_ASPECT;
        const dist = (radius * 1.05) / Math.min(visibleTanV, visibleTanH);
        const dir = cam.position.clone().sub(center).normalize();
        cam.position.copy(center).addScaledVector(dir, dist);
        cam.lookAt(center);
        cam.updateMatrixWorld();
      }
      const water = scene.getObjectByName("water");
      if (water) {
        water.visible = false;
        if (glassRef.current) glassRef.current.visible = false;
        gl.setRenderTarget(fbo);
        gl.render(scene, cam);
        gl.setRenderTarget(null);
        water.visible = true;
        if (glassRef.current) glassRef.current.visible = true;
      }
      gl.render(scene, cam);
      const url = gl.domElement.toDataURL("image/png");
      cam.position.copy(saved.pos);
      cam.quaternion.copy(saved.quat);
      cam.updateMatrixWorld();
      return url;
    };
    return () => {
      captureRef.current = null;
    };
  }, [captureRef, gl, scene, camera, fbo, glassRef]);

  useFrame((state) => {
    const { gl, scene, camera, clock } = state;
    setWindTime(clock.elapsedTime);
    updateLightView(camera);
    const water = scene.getObjectByName("water");
    if (water) {
      const glass = glassRef.current;
      water.visible = false;
      if (glass) glass.visible = false;
      gl.setRenderTarget(fbo);
      gl.render(scene, camera);
      gl.setRenderTarget(null);
      water.visible = true;
      if (glass) glass.visible = true;
      updateWater(waterMaterial, fbo.texture, clock.elapsedTime);
    }
    gl.render(scene, camera);
  }, 1);

  return null;
}

// ───────────── 主場景 ─────────────

function Scene(props: Props) {
  const { vase, bySlug, resolved, selectedId, dragging, interactive = true, enterDelays, autoRotate, dragRef, captureRef, onSelect, onStartMove, onMove } =
    props;
  const glassRef = useRef<THREE.Group>(null);
  const waterMaterial = useMemo(() => createWaterMaterial(), []);
  const [snapState, setSnapState] = useState<{ mode: DragState["mode"]; p: Placement } | null>(null);

  const ghostResolved = useMemo(() => {
    if (!snapState || snapState.mode !== "new") return null;
    const f = bySlug.get(snapState.p.slug);
    return f ? { r: resolvePlacement(snapState.p, f, vase), f } : null;
  }, [snapState, bySlug, vase]);

  const getState = useThree((s) => s.get);

  const startMove = (e: ThreeEvent<PointerEvent>, r: Resolved) => {
    if (!interactive) return;
    setControlsEnabled(getState().controls, false);
    onStartMove({
      mode: "move",
      slug: r.slug,
      id: r.id,
      clientX: e.nativeEvent.clientX,
      clientY: e.nativeEvent.clientY,
      planeY: r.head[1],
      scale: r.scale,
      spin: r.spin,
      snap: null,
    });
  };

  return (
    <>
      <color attach="background" args={["#f3eee6"]} />
      <fog attach="fog" args={["#f3eee6", 2.2, 4.5]} />
      <hemisphereLight args={["#fff8ef", "#d9cbb8", 0.35]} />
      <directionalLight
        position={[0.55, 1.25, 0.6]}
        intensity={1.8}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.015}
        shadow-camera-left={-0.5}
        shadow-camera-right={0.5}
        shadow-camera-top={0.6}
        shadow-camera-bottom={-0.4}
        shadow-camera-near={0.1}
        shadow-camera-far={3}
      />
      {/* 背後的暖色輪廓光：讓花瓣邊緣透光 */}
      <directionalLight position={[-0.5, 0.9, -1]} intensity={0.9} color="#ffe9d2" />
      <Suspense fallback={null}>
        {/* 攝影棚 HDRI 環境光（Poly Haven，CC0），檔案存於 Vercel Blob */}
        <Environment files={HDRI_URL} environmentIntensity={0.55} />
      </Suspense>
      <ContactShadows position={[0, 0.0008, 0]} opacity={0.45} scale={0.9} blur={2.6} far={0.35} resolution={512} color="#5a4636" />

      <mesh name="floor" rotation={[-Math.PI / 2, 0, 0]} receiveShadow onPointerDown={() => onSelect(null)}>
        <circleGeometry args={[3, 64]} />
        <meshStandardMaterial color="#ece4d8" roughness={0.95} />
      </mesh>

      <VaseModel vase={vase} glassRef={glassRef} waterMaterial={waterMaterial} />

      {resolved.map((r) => {
        const f = bySlug.get(r.slug);
        return f ? (
          <FlowerStem
            key={r.id}
            r={r}
            flower={f}
            selected={r.id === selectedId}
            enterDelay={enterDelays?.[r.id] ?? 0}
            onSelect={interactive ? onSelect : undefined}
            onStartMove={startMove}
          />
        ) : null;
      })}

      {ghostResolved && <FlowerStem key={`ghost-${ghostResolved.r.slug}`} r={ghostResolved.r} flower={ghostResolved.f} ghost />}
      {dragging && <AnchorMarkers vase={vase} active={snapState?.p ?? null} />}

      <DragController vase={vase} bySlug={bySlug} dragRef={dragRef} onMove={onMove} setGhost={setSnapState} />
      <RenderPipeline glassRef={glassRef} waterMaterial={waterMaterial} captureRef={captureRef} />
      <OrbitControls
        makeDefault
        enabled={!dragging}
        autoRotate={autoRotate}
        autoRotateSpeed={0.7}
        enablePan={false}
        enableDamping
        target={[0, 0.3, 0]}
        minDistance={0.45}
        maxDistance={2}
        minPolarAngle={0.25}
        maxPolarAngle={1.48}
      />
    </>
  );
}

function ControlsGuard({ dragRef }: { dragRef: RefObject<DragState | null> }) {
  // 在花朵上按下時立即停用視角旋轉（OrbitControls 會在同一個 pointerdown 中判斷 enabled）
  useFrame((state) => {
    if (dragRef.current) setControlsEnabled(state.controls, false);
  });
  return null;
}

export default function StudioCanvas(props: Props) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0.74, 0.7, 1.22], fov: 35, near: 0.01, far: 20 }}
      gl={{ preserveDrawingBuffer: true, antialias: true }}
      onCreated={({ gl }) => {
        // Khronos PBR Neutral：盡量保留花材原本的顏色
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = 1.0;
      }}
    >
      <Scene {...props} />
      <ControlsGuard dragRef={props.dragRef} />
    </Canvas>
  );
}

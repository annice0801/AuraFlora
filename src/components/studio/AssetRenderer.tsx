"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { HDRI_URL } from "@/lib/flora/assets";
import * as THREE from "three";
import { flowerCatalog, type Flower } from "@/data/flowers";
import { getBelowStemGeometry, getFlowerAsset, getMaterials, setWindTime, updateLightView } from "./three/models";

type Mode = "full" | "head" | "hero";
type Job = { flower: Flower; mode: Mode; resolve: (dataUrl: string) => void };

/** hero：主視覺用，花枝橫躺、正面取景、寬 2:1 */
const HERO_TILT = -Math.PI / 2 + 0.16;
const SIZES: Record<Mode, [number, number]> = { full: [512, 512], head: [512, 512], hero: [1200, 600] };

declare global {
  interface Window {
    __auraRender?: (slug: string, mode?: Mode) => Promise<string>;
    /** 渲染自訂色版的花材（配色花譜用） */
    __auraRenderFlower?: (flower: Flower, mode?: Mode) => Promise<string>;
    __auraReady?: boolean;
  }
}

/** 依取景模式把鏡頭對準花材 */
function fitCamera(cam: THREE.PerspectiveCamera, box: THREE.Box3, mode: Mode) {
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const tanV = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
  if (mode === "hero") {
    // 正面取景，依 2:1 畫面同時符合寬與高
    cam.aspect = SIZES.hero[0] / SIZES.hero[1];
    const dist = Math.max(size.y / 2 / tanV, size.x / 2 / (tanV * cam.aspect)) * 1.1 + size.z / 2;
    cam.position.set(center.x, center.y + dist * 0.12, center.z + dist);
  } else {
    const fit = Math.max(size.y, size.x * 1.05, size.z * 1.05) * 0.5;
    const dist = (fit / tanV) * 1.08;
    cam.position.set(center.x + dist * 0.38, center.y + dist * 0.22, center.z + dist * 0.9);
  }
  cam.lookAt(center);
  cam.updateProjectionMatrix();
}

function Subject({ job, onDone }: { job: Job; onDone: () => void }) {
  const { gl, camera } = useThree();
  const frames = useRef(0);
  const { flower } = job;
  const asset = useMemo(() => getFlowerAsset(flower, flower.height), [flower]);
  const mats = useMemo(() => getMaterials(flower), [flower]);

  // 自動取景：full 拍整枝花（含花莖），head 只拍上方花頭
  const rotation = useMemo(
    () => new THREE.Matrix4().makeRotationZ(job.mode === "hero" ? HERO_TILT : 0),
    [job.mode],
  );
  const box = useMemo(() => {
    const b = new THREE.Box3();
    const minY = job.mode === "head" ? flower.height * 0.7 : -Infinity;
    const p = new THREE.Vector3();
    for (const { geometry } of asset) {
      const pos = geometry.getAttribute("position");
      for (let i = 0; i < pos.count; i++) {
        p.fromBufferAttribute(pos, i);
        if (p.y >= minY) b.expandByPoint(p.applyMatrix4(rotation));
      }
    }
    if (job.mode === "full") b.expandByPoint(new THREE.Vector3(0, -0.04, 0));
    return b;
  }, [asset, flower.height, job.mode, rotation]);

  useEffect(() => {
    fitCamera(camera as THREE.PerspectiveCamera, box, job.mode);
    frames.current = 0;
  }, [box, camera, job.mode]);

  useFrame(() => {
    setWindTime(0);
    updateLightView(camera);
    frames.current += 1;
    // 主視覺會改變畫布尺寸，多等幾幀讓畫布重新配置
    if (frames.current === (job.mode === "hero" ? 10 : 4)) {
      job.resolve(gl.domElement.toDataURL("image/png"));
      onDone();
    }
  });

  return (
    <group rotation={[0, 0, job.mode === "hero" ? HERO_TILT : 0]}>
      {asset.map(({ key, geometry }) => (
        <mesh key={key} geometry={geometry} material={mats[key]} />
      ))}
      {job.mode === "full" && (
        <mesh geometry={getBelowStemGeometry()} material={mats.stem} scale={[1, 0.04, 1]} />
      )}
    </group>
  );
}

export default function AssetRenderer() {
  const [job, setJob] = useState<Job | null>(null);
  const queue = useRef<Job[]>([]);

  useEffect(() => {
    const enqueue = (flower: Flower, mode: Mode) =>
      new Promise<string>((resolve) => {
        const next = { flower, mode, resolve };
        setJob((cur) => {
          if (cur) {
            queue.current.push(next);
            return cur;
          }
          return next;
        });
      });
    window.__auraRender = (slug, mode = "full") => {
      const flower = flowerCatalog.find((f) => f.slug === slug);
      return flower ? enqueue(flower, mode) : Promise.reject(new Error(`unknown flower ${slug}`));
    };
    window.__auraRenderFlower = (flower, mode = "head") => enqueue(flower, mode);
    window.__auraReady = true;
  }, []);

  const [w, h] = SIZES[job?.mode ?? "full"];
  return (
    <div style={{ width: w, height: h, background: "transparent" }}>
      <Canvas
        dpr={2}
        gl={{ alpha: true, preserveDrawingBuffer: true, antialias: true }}
        camera={{ fov: 30, near: 0.005, far: 10 }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          gl.toneMapping = THREE.NeutralToneMapping;
        }}
      >
        <directionalLight position={[0.55, 1.25, 0.6]} intensity={1.8} />
        <directionalLight position={[-0.5, 0.9, -1]} intensity={0.9} color="#ffe9d2" />
        <Suspense fallback={null}>
          <Environment files={HDRI_URL} environmentIntensity={0.55} />
        </Suspense>
        {job && (
          <Subject
            key={`${job.flower.slug}-${job.mode}`}
            job={job}
            onDone={() => setJob(queue.current.shift() ?? null)}
          />
        )}
      </Canvas>
    </div>
  );
}

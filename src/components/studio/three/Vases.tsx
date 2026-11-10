"use client";

import { forwardRef, useMemo } from "react";
import * as THREE from "three";
import { WATER_LEVEL, type VaseSpec } from "@/lib/flora/physics";

// ───────────── 程序化材質貼圖 ─────────────

function canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function terrazzoTexture() {
  const r = rng(7);
  return canvasTexture(1024, 512, (ctx) => {
    ctx.fillStyle = "#d9cfc2";
    ctx.fillRect(0, 0, 1024, 512);
    // 細砂質感
    for (let i = 0; i < 9000; i++) {
      ctx.fillStyle = `rgba(${90 + r() * 60},${80 + r() * 50},${70 + r() * 40},${0.08 + r() * 0.1})`;
      ctx.fillRect(r() * 1024, r() * 512, 1.5, 1.5);
    }
    // 水磨石碎石
    const chips = ["#8a6f5a", "#c46a4f", "#3e4a3d", "#efe8dc", "#a48a6e", "#6b6560"];
    for (let i = 0; i < 520; i++) {
      ctx.fillStyle = chips[Math.floor(r() * chips.length)];
      const x = r() * 1024;
      const y = r() * 512;
      const s = 2 + Math.pow(r(), 3) * 14;
      ctx.beginPath();
      const n = 5 + Math.floor(r() * 3);
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2;
        const rr = s * (0.6 + r() * 0.6);
        ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.8);
      }
      ctx.closePath();
      ctx.fill();
    }
  });
}

function foamTexture() {
  const r = rng(3);
  return canvasTexture(512, 512, (ctx) => {
    ctx.fillStyle = "#5d7b46";
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 2600; i++) {
      ctx.fillStyle = r() > 0.5 ? "rgba(40,60,30,0.35)" : "rgba(140,170,110,0.25)";
      ctx.beginPath();
      ctx.arc(r() * 512, r() * 512, 0.6 + r() * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

// ───────────── 水的折射 Fragment Shader（IOR 1.33） ─────────────

export function createWaterMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uScene: { value: null as THREE.Texture | null },
      uIOR: { value: 1.33 },
      uThickness: { value: 0.035 },
      uTint: { value: new THREE.Color("#e3f1ee") },
      uTime: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform mat4 projectionMatrix;
      uniform sampler2D uScene;
      uniform float uIOR;
      uniform float uThickness;
      uniform vec3 uTint;
      uniform float uTime;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;

      vec2 toScreen(vec3 p) {
        vec4 c = projectionMatrix * viewMatrix * vec4(p, 1.0);
        return c.xy / c.w * 0.5 + 0.5;
      }

      void main() {
        vec3 V = normalize(vWorldPos - cameraPosition);
        vec3 N = normalize(vWorldNormal);
        // 水面細微波紋
        if (N.y > 0.9) {
          N = normalize(N + vec3(sin(vWorldPos.x * 180.0 + uTime * 1.6), 0.0, cos(vWorldPos.z * 170.0 + uTime * 1.3)) * 0.035);
        }
        // 光線由空氣進入水（n1/n2 = 1/1.33），依折射方向偏移取樣，三個色版用略微不同的 IOR 產生色散
        vec3 col;
        for (int c = 0; c < 3; c++) {
          float ior = uIOR + float(c) * 0.007;
          vec3 R = refract(V, N, 1.0 / ior);
          vec2 uv = clamp(toScreen(vWorldPos + R * uThickness), 0.001, 0.999);
          col[c] = texture2D(uScene, uv)[c];
        }
        // 莖部交錯陰影：越往瓶中心光程越長，吸收越多，水中的莖會帶出淡淡的綠灰陰影
        float centerDist = length(vWorldPos.xz) / 0.041;
        float path = sqrt(max(1.0 - centerDist * centerDist, 0.0));
        col *= mix(vec3(1.0), uTint * 0.88, path * 0.55 + 0.2);
        float fresnel = pow(1.0 - max(dot(-V, N), 0.0), 3.0);
        col = mix(col, vec3(1.0), fresnel * 0.4);
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
}

export function updateWater(mat: THREE.ShaderMaterial, scene: THREE.Texture, time: number) {
  mat.uniforms.uScene.value = scene;
  mat.uniforms.uTime.value = time;
}

// ───────────── 花器 ─────────────

function lathe(points: [number, number][], segments = 72) {
  return new THREE.LatheGeometry(points.map(([x, y]) => new THREE.Vector2(x, y)), segments);
}

function Dish({ vase }: { vase: VaseSpec }) {
  const geo = useMemo(
    () =>
      lathe([
        [0, 0],
        [0.15, 0],
        [0.168, 0.006],
        [0.172, 0.03],
        [0.165, 0.031],
        [0.16, 0.012],
        [0.145, 0.009],
        [0, 0.009],
      ]),
    [],
  );
  const foamTex = useMemo(() => foamTexture(), []);
  const foam = vase.foam!;
  const foamH = vase.mouthY - 0.008;
  return (
    <group>
      <mesh geometry={geo} castShadow receiveShadow>
        <meshStandardMaterial color="#f2f0ec" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.008 + foamH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[foam.width, foamH, foam.depth]} />
        <meshStandardMaterial map={foamTex} roughness={1} />
      </mesh>
    </group>
  );
}

function Terrazzo() {
  const geo = useMemo(
    () =>
      lathe([
        [0, 0],
        [0.07, 0],
        [0.078, 0.006],
        [0.095, 0.06],
        [0.1, 0.11],
        [0.094, 0.17],
        [0.087, 0.2],
        [0.079, 0.2],
        [0.085, 0.17],
        [0.091, 0.11],
        [0.086, 0.06],
        [0.07, 0.018],
        [0, 0.018],
      ]),
    [],
  );
  const tex = useMemo(() => terrazzoTexture(), []);
  return (
    <group>
      <mesh geometry={geo} castShadow receiveShadow>
        <meshStandardMaterial map={tex} roughness={0.78} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.165, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.086, 48]} />
        <meshStandardMaterial color="#3d4a48" roughness={0.08} metalness={0.3} />
      </mesh>
    </group>
  );
}

type GlassProps = { waterMaterial: THREE.ShaderMaterial };

export const Glass = forwardRef<THREE.Group, GlassProps>(function Glass({ waterMaterial }, ref) {
  const shell = useMemo(
    () =>
      lathe([
        [0, 0],
        [0.045, 0],
        [0.045, 0.259],
        [0.0438, 0.2605],
        [0.0422, 0.2605],
        [0.041, 0.259],
        [0.041, 0.012],
        [0, 0.012],
      ]),
    [],
  );
  const waterH = WATER_LEVEL - 0.012;
  return (
    <group>
      <group ref={ref}>
        <mesh geometry={shell} renderOrder={2}>
          <meshPhysicalMaterial
            color="#eef6f5"
            roughness={0.04}
            metalness={0}
            transparent
            opacity={0.2}
            clearcoat={1}
            clearcoatRoughness={0.05}
            envMapIntensity={1.6}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      </group>
      <mesh name="water" position={[0, 0.012 + waterH / 2, 0]} material={waterMaterial} renderOrder={1}>
        <cylinderGeometry args={[0.0405, 0.0405, waterH, 64, 1]} />
      </mesh>
    </group>
  );
});

export function VaseModel({
  vase,
  glassRef,
  waterMaterial,
}: {
  vase: VaseSpec;
  glassRef: React.Ref<THREE.Group>;
  waterMaterial: THREE.ShaderMaterial;
}) {
  if (vase.id === "dish") return <Dish vase={vase} />;
  if (vase.id === "terrazzo") return <Terrazzo />;
  return <Glass ref={glassRef} waterMaterial={waterMaterial} />;
}

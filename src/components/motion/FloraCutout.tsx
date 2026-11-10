import Image from "next/image";
import { HERO_FLORA, type HeroFlora } from "@/lib/flora/assets";
import Parallax from "./Parallax";

/** 漂浮的花材去背圖：以 width（CSS 長度）控制大小，搭配視差速度與旋轉 */
export default function FloraCutout({
  name,
  width,
  speed = -0.2,
  rotate = 0,
  tilt = 0,
  className = "",
  priority = false,
  shadow = true,
}: {
  name: HeroFlora;
  width: string;
  speed?: number;
  rotate?: number;
  /** 圖片本身的固定傾斜角度 */
  tilt?: number;
  className?: string;
  priority?: boolean;
  shadow?: boolean;
}) {
  const f = HERO_FLORA[name];
  return (
    <Parallax speed={speed} rotate={rotate} className={`pointer-events-none absolute select-none ${className}`} style={{ width }}>
      <Image
        src={f.src}
        alt=""
        width={f.width}
        height={f.height}
        sizes={`(max-width: 768px) 100vw, ${width}`}
        priority={priority}
        className="h-auto w-full"
        style={{
          transform: tilt ? `rotate(${tilt}deg)` : undefined,
          filter: shadow ? "drop-shadow(0 28px 30px rgba(60,45,30,.18))" : undefined,
        }}
      />
    </Parallax>
  );
}

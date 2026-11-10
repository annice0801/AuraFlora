import Image from "next/image";
import Parallax from "./Parallax";

/** 圖框固定、圖片在框內以較慢速度移動的視差照片 */
export default function ParallaxImage({
  src,
  alt,
  sizes,
  className = "",
  speed = 0.12,
  priority = false,
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  speed?: number;
  priority?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Parallax speed={speed} className="absolute inset-x-0 -top-[12%] -bottom-[12%]" innerClassName="relative h-full w-full">
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
      </Parallax>
    </div>
  );
}

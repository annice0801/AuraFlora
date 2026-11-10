import { Camera, ShieldCheck, Truck } from "lucide-react";
import { QUALITY_BADGES } from "@/data/gifts";

const ICONS = { shock: Truck, photo: Camera, partner: ShieldCheck } as const;

export default function QualityBadges({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`grid gap-3 ${compact ? "" : "sm:grid-cols-3"}`}>
      {QUALITY_BADGES.map((b) => {
        const Icon = ICONS[b.id as keyof typeof ICONS];
        return (
          <div key={b.id} className="flex gap-3 rounded-2xl border border-line bg-surface p-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sage-soft text-sage">
              <Icon className="size-5" aria-hidden />
            </span>
            <div>
              <p className="font-medium">{b.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted">{b.text}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

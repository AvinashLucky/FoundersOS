import { cn } from "@shared/lib/utils";
import { Surface } from "@shared/ui/Surface";

/**
 * Card — a titled Surface. The standard content container on the focal plane.
 * Title uses the company voice (serif); meta uses the machine voice (mono).
 */
export function Card({
  title,
  meta,
  className,
  children,
  ...props
}: {
  title?: string;
  meta?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <Surface className={cn("p-card", className)} {...props}>
      {(title || meta) && (
        <div className="mb-3 flex items-baseline justify-between">
          {title && <h3 className="font-serif text-xl font-normal tracking-tight">{title}</h3>}
          {meta && <span className="font-mono text-[11px] text-ink3">{meta}</span>}
        </div>
      )}
      {children}
    </Surface>
  );
}

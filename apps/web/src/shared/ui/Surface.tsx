import { cn } from "@shared/lib/utils";

type Elevation = "flat" | "raised" | "glass";

/**
 * Strata uses depth, not heavy shadow. Elevation = a 1px hairline + subtle fill +
 * blur. This is the spatial-depth primitive every panel composes from (Principle P3).
 */
export function Surface({
  elevation = "glass",
  className,
  children,
  ...props
}: { elevation?: Elevation } & React.HTMLAttributes<HTMLDivElement>) {
  const map: Record<Elevation, string> = {
    flat: "bg-base border border-white/[0.07]",
    raised: "bg-raised border border-white/[0.07]",
    glass: "bg-white/[0.04] border border-white/[0.07] backdrop-blur-xl",
  };
  return (
    <div className={cn("rounded-2xl", map[elevation], className)} {...props}>
      {children}
    </div>
  );
}

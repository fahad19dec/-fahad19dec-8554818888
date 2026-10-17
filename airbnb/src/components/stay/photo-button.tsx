import { Icon, PressableScale, type IconName, type PressableScaleProps, type Tone } from "@/components/ui";

// The round white buttons over the stay's photo (back, share, heart).
export function PhotoButton({
  icon,
  tone = "ink",
  ...props
}: Omit<PressableScaleProps, "children" | "className"> & { icon: IconName; tone?: Tone; accessibilityLabel: string }) {
  return (
    <PressableScale accessibilityRole="button" hitSlop={4} className="size-14 items-center justify-center rounded-full bg-surface shadow-raised" {...props}>
      <Icon name={icon} size={24} tone={tone} />
    </PressableScale>
  );
}

import { brand } from "@brand";

const points = (list: number[][]) => list.map(([x, y]) => `${x},${y}`).join(" ");

// The brand's axe mark, from brand.config.js. `onDark` uses the wood handle color.
export function LogoMark({ size = 28, onDark = false }: { size?: number; onDark?: boolean }) {
  const { logo } = brand;
  const [[x1, y1], [x2, y2]] = logo.handle;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={onDark ? logo.handleColor : brand.colors.ink} strokeWidth={logo.handleWidth} strokeLinecap="round" />
      <polygon points={points(logo.poll)} fill={logo.headColor} />
      <polygon points={points(logo.head)} fill={logo.headColor} />
    </svg>
  );
}

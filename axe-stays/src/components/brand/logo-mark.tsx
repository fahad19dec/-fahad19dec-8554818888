import Svg, { Line, Polygon } from "react-native-svg";

import { brand } from "@/brand";

const { logo } = brand;
const points = (list: number[][]) => list.map(([x, y]) => `${x},${y}`).join(" ");

// The axe mark, drawn from brand.config.js. On light backgrounds the handle
// takes the ink color; the app icon (dark tile) uses the logo's handle color.
// Decorative: the Wordmark around it carries the brand name for screen readers.
export function LogoMark({ size, onDark = false }: { size: number; onDark?: boolean }) {
  const [[x1, y1], [x2, y2]] = logo.handle;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={onDark ? logo.handleColor : brand.colors.ink}
        strokeWidth={logo.handleWidth}
        strokeLinecap="round"
      />
      <Polygon points={points(logo.poll)} fill={logo.headColor} />
      <Polygon points={points(logo.head)} fill={logo.headColor} />
    </Svg>
  );
}

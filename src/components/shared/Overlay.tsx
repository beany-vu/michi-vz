import React, { forwardRef } from "react";

interface Props {
  width: number;
  height: number;
  children: React.ReactNode;
}

/**
 * Use Overlay as a wrapper for components that need mouse events to be handled.
 * For example: Tooltip, AxisX.
 */
const Overlay = forwardRef<SVGRectElement, Props>(({ width, height, children }, ref) => (
  <g>
    {children}
    <rect ref={ref} className="tpRef" width={width} height={height} opacity={0} />
  </g>
));

Overlay.displayName = "Overlay";

export default Overlay;

import React, { forwardRef, SVGProps } from "react";

export const Svg = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>(
  ({ children, ...props }, ref) => (
    <svg ref={ref} {...props}>
      {children}
    </svg>
  )
);
Svg.displayName = "Svg";

export const Circle = forwardRef<SVGCircleElement, SVGProps<SVGCircleElement>>(
  (props, ref) => <circle ref={ref} {...props} />
);
Circle.displayName = "Circle";

export const Ellipse = forwardRef<SVGEllipseElement, SVGProps<SVGEllipseElement>>(
  (props, ref) => <ellipse ref={ref} {...props} />
);
Ellipse.displayName = "Ellipse";

export const Rect = forwardRef<SVGRectElement, SVGProps<SVGRectElement>>(
  (props, ref) => <rect ref={ref} {...props} />
);
Rect.displayName = "Rect";

export const Path = forwardRef<SVGPathElement, SVGProps<SVGPathElement>>(
  (props, ref) => <path ref={ref} {...props} />
);
Path.displayName = "Path";

export const G = forwardRef<SVGGElement, SVGProps<SVGGElement>>(
  ({ children, ...props }, ref) => (
    <g ref={ref} {...props}>
      {children}
    </g>
  )
);
G.displayName = "G";

export const Defs = forwardRef<SVGDefsElement, SVGProps<SVGDefsElement>>(
  ({ children, ...props }, ref) => (
    <defs ref={ref} {...props}>
      {children}
    </defs>
  )
);
Defs.displayName = "Defs";

export const LinearGradient = forwardRef<
  SVGLinearGradientElement,
  SVGProps<SVGLinearGradientElement>
>(({ children, ...props }, ref) => (
  <linearGradient ref={ref} {...props}>
    {children}
  </linearGradient>
));
LinearGradient.displayName = "LinearGradient";

export const RadialGradient = forwardRef<
  SVGRadialGradientElement,
  SVGProps<SVGRadialGradientElement>
>(({ children, ...props }, ref) => (
  <radialGradient ref={ref} {...props}>
    {children}
  </radialGradient>
));
RadialGradient.displayName = "RadialGradient";

export const Stop = forwardRef<SVGStopElement, SVGProps<SVGStopElement>>(
  (props, ref) => <stop ref={ref} {...props} />
);
Stop.displayName = "Stop";

export const Polyline = forwardRef<SVGPolylineElement, SVGProps<SVGPolylineElement>>(
  (props, ref) => <polyline ref={ref} {...props} />
);
Polyline.displayName = "Polyline";

export const Polygon = forwardRef<SVGPolygonElement, SVGProps<SVGPolygonElement>>(
  (props, ref) => <polygon ref={ref} {...props} />
);
Polygon.displayName = "Polygon";

export const Line = forwardRef<SVGLineElement, SVGProps<SVGLineElement>>(
  (props, ref) => <line ref={ref} {...props} />
);
Line.displayName = "Line";

export const Text = forwardRef<SVGTextElement, SVGProps<SVGTextElement>>(
  ({ children, ...props }, ref) => (
    <text ref={ref} {...props}>
      {children}
    </text>
  )
);
Text.displayName = "Text";

export const TSpan = forwardRef<SVGTSpanElement, SVGProps<SVGTSpanElement>>(
  ({ children, ...props }, ref) => (
    <tspan ref={ref} {...props}>
      {children}
    </tspan>
  )
);
TSpan.displayName = "TSpan";

export const ClipPath = forwardRef<SVGClipPathElement, SVGProps<SVGClipPathElement>>(
  ({ children, ...props }, ref) => (
    <clipPath ref={ref} {...props}>
      {children}
    </clipPath>
  )
);
ClipPath.displayName = "ClipPath";

export const Mask = forwardRef<SVGMaskElement, SVGProps<SVGMaskElement>>(
  ({ children, ...props }, ref) => (
    <mask ref={ref} {...props}>
      {children}
    </mask>
  )
);
Mask.displayName = "Mask";

export const Filter = forwardRef<SVGFilterElement, SVGProps<SVGFilterElement>>(
  ({ children, ...props }, ref) => (
    <filter ref={ref} {...props}>
      {children}
    </filter>
  )
);
Filter.displayName = "Filter";

export const FeGaussianBlur = forwardRef<
  SVGFEGaussianBlurElement,
  SVGProps<SVGFEGaussianBlurElement>
>((props, ref) => <feGaussianBlur ref={ref} {...props} />);
FeGaussianBlur.displayName = "FeGaussianBlur";

export default Svg;

import React from "react";

interface Props {
  x: number;
  y: number;
  children: React.ReactNode | string;
}

const Title: React.FC<Props> = ({ x, y, children }) => {
  return children ? (
    <text className="title" x={x} y={y} textAnchor="middle">
      {children}
    </text>
  ) : null;
};
export default Title;

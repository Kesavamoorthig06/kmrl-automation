import React from "react";

export function Card({ children, className }) {
  return <div className={`rounded-2xl border shadow-sm bg-white ${className}`}>{children}</div>;
}

export function CardHeader({ children }) {
  return <div className="border-b px-4 py-2">{children}</div>;
}

export function CardTitle({ children }) {
  return <h2 className="text-lg font-semibold">{children}</h2>;
}

export function CardContent({ children, className }) {
  return <div className={`px-4 py-3 ${className}`}>{children}</div>;
}

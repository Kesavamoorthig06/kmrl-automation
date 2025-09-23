import React from "react";

export function Alert({ children, variant, className }) {
  const base = "flex items-start space-x-2 rounded-lg p-3 border";
  const styles =
    variant === "destructive"
      ? "bg-red-50 border-red-300 text-red-700"
      : "bg-gray-50 border-gray-300 text-gray-700";

  return <div className={`${base} ${styles} ${className}`}>{children}</div>;
}

export function AlertTitle({ children }) {
  return <h4 className="font-semibold">{children}</h4>;
}

export function AlertDescription({ children }) {
  return <p className="text-sm">{children}</p>;
}

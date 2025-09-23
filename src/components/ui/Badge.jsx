import React from "react";
import { CheckCircle, XCircle } from "lucide-react";

export function Badge({ children, className, variant }) {
  let base = "inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full";
  let styles =
    variant === "outline"
      ? "border border-gray-400 text-gray-700"
      : className || "bg-gray-200 text-gray-800";

  return <span className={`${base} ${styles}`}>{children}</span>;
}

export function BadgeCheckbox({ checked, onToggle, onUnavailableClick, onAvailableClick, train }) {
  const handleUnavailableClick = (e) => {
    e.stopPropagation();
    if (onUnavailableClick) {
      onUnavailableClick();
    } else if (onToggle) {
      onToggle(false);
    }
  };

  const handleAvailableClick = (e) => {
    e.stopPropagation();
    if (onAvailableClick) {
      onAvailableClick(train);
    } else if (onToggle) {
      onToggle(true);
    }
  };

  return (
    <div className="flex justify-center">
      {checked ? (
        <button
          onClick={handleAvailableClick}
          className="inline-flex px-3 py-1.5 text-sm font-medium rounded-full bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 hover:shadow-md transition-all duration-200 cursor-pointer transform hover:scale-105"
        >
          <CheckCircle className="h-4 w-4 mr-1.5 text-green-600" />
          Available
        </button>
      ) : (
        <button
          onClick={handleUnavailableClick}
          className="inline-flex px-3 py-1.5 text-sm font-medium rounded-full bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 hover:shadow-md transition-all duration-200 cursor-pointer transform hover:scale-105"
        >
          <XCircle className="h-4 w-4 mr-1.5 text-red-600" />
          Unavailable
        </button>
      )}
    </div>
  );
}



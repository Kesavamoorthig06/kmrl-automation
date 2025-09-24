import React from "react";

export function Table({ children }) {
  return <table className="w-full border-collapse">{children}</table>;
}

export function TableHeader({ children }) {
  return <thead className="bg-gray-100">{children}</thead>;
}

export function TableRow({ children }) {
  return <tr className="border-b hover:bg-gray-50">{children}</tr>;
}

export function TableHead({ children }) {
  return <th className="text-left p-2 font-medium text-gray-700">{children}</th>;
}

export function TableBody({ children }) {
  return <tbody>{children}</tbody>;
}

export function TableCell({ children }) {
  return <td className="p-2 text-sm">{children}</td>;
}

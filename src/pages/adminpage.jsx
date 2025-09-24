import React, { useState } from "react";
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell
} from "../components/ui/Table";
import { BadgeCheckbox } from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import { useNavigate } from "react-router-dom";




const initialTrains = [
  { id: "R-01", status: false, reason: "Telecom got malfunctioned at 2:00", score: "-", explain: "" },
  { id: "R-02", status: true, reason: "", score: "19.7", explain: "Certificates valid; mileage balanced; branding contract normal" },
  { id: "R-03", status: true, reason: "", score: "19.4", explain: "Certificates valid; mileage balanced; branding contract normal" },
  { id: "R-06", status: false, reason: "JobCard pending or certificate expired at 7:00", score: "-", explain: "" },
  // add more rows as necessary
];

export default function AdminPage() {
  const [trains, setTrains] = useState(initialTrains);
  const [selected, setSelected] = useState(() => new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [modalText, setModalText] = useState("");
  const navigate = useNavigate();

  const toggleStatus = (index, newStatus) => {
    setTrains((prev) => {
      const clone = [...prev];
      clone[index] = { ...clone[index], status: newStatus };
      return clone;
    });
  };

  const handleUnavailableClick = (index) => {
    const reason = trains[index].reason || "No reason provided";
    setModalText(reason);
    setModalOpen(true);
    // If you want the click to also toggle to available immediately:
    // toggleStatus(index, true);
  };

  const handleSelectRow = (id, checked) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Ranked Induction List</h2>
              <p className="text-gray-600 text-sm mt-1">Train Management System</p>
            </div>
            <div>
              <button
                onClick={() => navigate("/confirm", { state: { selectedIds: Array.from(selected) } })}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors duration-200 text-sm font-medium"
                disabled={selected.size === 0}
              >
                Go to Confirmation ({selected.size})
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-gray-700 font-medium text-sm py-4">Rank</TableHead>
                <TableHead className="text-gray-700 font-medium text-sm py-4">Train ID</TableHead>
                <TableHead className="text-gray-700 font-medium text-sm py-4">Status</TableHead>
                <TableHead className="text-gray-700 font-medium text-sm py-4">Score</TableHead>
                <TableHead className="text-gray-700 font-medium text-sm py-4">Explainability</TableHead>
                <TableHead className="text-gray-700 font-medium text-sm py-4">Mark</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {trains.map((t, idx) => (
                <TableRow key={t.id} className="hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100">
                  <TableCell className="text-gray-700 font-medium py-4">
                    <div className="flex justify-center items-center">
                      —
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex justify-center items-center">
                      <button
                        onClick={() => alert("Train picture modal will be implemented later for " + t.id)}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors duration-200"
                      >
                        {t.id}
                      </button>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex justify-center items-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${t.status ? "bg-green-100 text-green-700 border border-green-200" : "bg-red-100 text-red-700 border border-red-200"}`}>
                        {t.status ? "Available" : "Unavailable"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600 font-medium py-4">
                    <div className="flex justify-center items-center">
                      {t.score}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600 text-sm py-4">
                    <div className="flex justify-center items-center">
                      {t.explain || (t.reason ? t.reason : "-")}
                    </div>
                  </TableCell>

                  <TableCell className="py-4">
                    <div className="flex justify-center items-center">
                      <div className="flex items-center space-x-3">
                        <BadgeCheckbox
                          checked={t.status}
                          onToggle={(newVal) => toggleStatus(idx, newVal)}
                          onUnavailableClick={() => handleUnavailableClick(idx)}
                        />
                        <label className="inline-flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selected.has(t.id)}
                            onChange={(e) => handleSelectRow(t.id, e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          />
                          <span className="text-xs text-gray-600">Select</span>
                        </label>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
        </Table>
      </div>

        <Modal show={modalOpen} onClose={() => setModalOpen(false)} title="Why Unavailable">
          {modalText}
        </Modal>
      </div>
    </div>
  );
}

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card.jsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/Table.jsx";
import { BadgeCheckbox } from "../ui/Badge.jsx";

const TrainTable = ({ 
  trains, 
  selectedTrains, 
  onTrainClick, 
  onUnavailableClick, 
  onAvailableClick, 
  onTrainSelection 
}) => {
  return (
    <Card className="border border-gray-300">
      <CardHeader className="bg-gray-50 border-b border-gray-300 px-6 py-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-black text-lg font-semibold">Train Ranked Induction List</span>
          </div>
          <div className="text-sm text-gray-600 font-medium" style={{ listStyle: 'none' }}>
            {selectedTrains.size} of {trains.filter(t => t.status === "Available").length} available trains selected
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="px-2 py-4">
        <div className="overflow-x-auto w-full table-container">
          <Table className="table w-full min-w-max">
            {/* Fixed layout + explicit column widths so headers and body always align */}
            <colgroup>
              <col style={{ width: '8%' }} />   {/* Rank */}
              <col style={{ width: '10%' }} />  {/* Train ID */}
              <col style={{ width: '14%' }} />  {/* Status badge */}
              <col style={{ width: '10%' }} />  {/* Score */}
              <col style={{ width: '12%' }} />  {/* Stabling Bay */}
              <col style={{ width: '14%' }} />  {/* Branding Priority */}
              <col style={{ width: '12%' }} />  {/* Mileage (right) */}
              <col style={{ width: '12%' }} />  {/* Last Cleaned */}
              <col style={{ width: '8%' }} />   {/* Deployable */}
            </colgroup>

            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-center font-bold py-4 text-gray-800">Rank</TableHead>
                <TableHead className="text-center font-bold py-4 text-gray-800">Train ID</TableHead>
                <TableHead className="text-center font-bold py-4 text-gray-800">Status</TableHead>
                <TableHead className="text-center font-bold py-4 text-gray-800">Score</TableHead>
                <TableHead className="text-center font-bold py-4 text-gray-800">Stabling Bay</TableHead>
                <TableHead className="text-center font-bold py-4 text-gray-800">Branding Priority</TableHead>
                <TableHead className="text-right font-bold py-4 text-gray-800">Mileage</TableHead>
                <TableHead className="text-center font-bold py-4 text-gray-800">Last Cleaned</TableHead>
                <TableHead className="text-center font-bold py-4 text-gray-800">Deployable</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {trains.map((train) => (
                <TableRow 
                  key={train.id}
                  className={`transition-colors duration-200 border-b border-gray-200 ${
                    selectedTrains.has(train.id) 
                      ? 'bg-gray-50 border-l-4 border-l-black' 
                      : train.status === "Available"
                        ? 'hover:bg-green-50 bg-green-25'
                        : 'hover:bg-red-50 bg-red-25'
                  }`}
                >
                  {/* Rank */}
                  <TableCell className="font-medium text-gray-900 text-center py-4">
                    <div className="flex justify-center items-center w-full">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-sm font-bold rank-text border border-gray-300">
                        {train.rank}
                      </span>
                    </div>
                  </TableCell>

                  {/* Train ID */}
                  <TableCell className="font-mono text-center py-4">
                    <div className="flex justify-center items-center w-full">
                      <button
                        onClick={() => onTrainClick(train.id)}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-semibold transition-all duration-200 hover:scale-105 px-3 py-1 rounded-md hover:bg-blue-50"
                      >
                        {train.id}
                      </button>
                    </div>
                  </TableCell>

                  {/* Status */}
                  <TableCell className="text-center py-4">
                    <div className="flex justify-center items-center w-full">
                      <BadgeCheckbox
                        checked={train.status === "Available"}
                        onUnavailableClick={() => onUnavailableClick(train)}
                        onAvailableClick={onAvailableClick}
                        train={train}
                      />
                    </div>
                  </TableCell>

                  {/* Score */}
                  <TableCell className="font-mono text-center py-4">
                    <div className="flex justify-center items-center w-full">
                      <span className={`score-badge px-4 py-2 text-sm font-bold ${
                        parseFloat(train.score) >= 0.6 
                          ? 'score-excellent' 
                          : parseFloat(train.score) >= 0.4 
                            ? 'score-good' 
                            : parseFloat(train.score) >= 0.2 
                              ? 'score-average' 
                              : 'score-poor'
                      }`}>
                        {train.score}
                      </span>
                    </div>
                  </TableCell>

                  {/* Stabling Bay */}
                  <TableCell className="font-mono text-center py-4">
                    <div className="flex justify-center items-center w-full">
                      <span className={`stabling-badge px-4 py-2 text-sm font-bold rounded-md ${
                        train.stabling_bay && train.stabling_bay.toString().length > 2
                          ? 'stabling-badge-high'
                          : train.stabling_bay && train.stabling_bay.toString().length === 2
                            ? 'stabling-badge-medium'
                            : 'stabling-badge-low'
                      }`}>
                        {train.stabling_bay}
                      </span>
                    </div>
                  </TableCell>

                  {/* Branding Priority */}
                  <TableCell className="text-center py-4">
                    <div className="flex justify-center items-center w-full">
                      <span className={`branding-badge px-4 py-2 text-sm font-bold rounded-md ${
                        train.branding_priority >= 7
                          ? 'branding-badge-high'  // Purple/pink for 7, 8
                          : train.branding_priority >= 4
                          ? 'branding-badge-medium'  // Blue for 4, 5, 6
                          : 'branding-badge-low'  // Gray/white for 1, 2, 3
                      }`}>
                        {train.branding_priority}
                      </span>
                    </div>
                  </TableCell>

                  {/* Mileage (right-aligned) */}
                  <TableCell className="text-gray-700 py-4">
                    <div className="flex justify-end items-center w-full">
                      <span className="mileage-text font-semibold text-sm px-2 py-1 bg-gray-50 rounded-md">{train.mileage?.toLocaleString()} km</span>
                    </div>
                  </TableCell>

                  {/* Last Cleaned */}
                  <TableCell className="text-gray-600 text-sm text-center py-4">
                    <div className="flex justify-center items-center w-full">
                      <span className="last-cleaned-text font-semibold text-sm px-2 py-1 bg-gray-50 rounded-md">{train.last_cleaned_date}</span>
                    </div>
                  </TableCell>

                  {/* Deployable (checkbox) */}
                  <TableCell className="text-center py-4">
                    <div className="flex justify-center items-center w-full">
                      <label className="relative inline-flex cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={selectedTrains.has(train.id)}
                          disabled={train.status === "Unavailable"}
                          onChange={(e) => {
                            if (train.status !== "Unavailable") {
                              onTrainSelection(train.id, e.target.checked);
                            }
                          }}
                          className={`w-6 h-6 border-2 rounded-md focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-300 appearance-none ${
                            train.status === "Unavailable" 
                              ? "border-gray-200 bg-gray-100 cursor-not-allowed opacity-50" 
                              : selectedTrains.has(train.id)
                                ? "text-black border-black bg-black shadow-lg shadow-gray-200"
                                : "text-black border-gray-300 hover:border-gray-500 hover:shadow-md hover:shadow-gray-100 bg-white"
                          }`}
                        />
                        {selectedTrains.has(train.id) && train.status !== "Unavailable" && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <svg 
                              className="w-4 h-4 text-white drop-shadow-sm" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="3" 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              viewBox="0 0 24 24"
                            >
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          </div>
                        )}
                      </label>
                    </div>
                  </TableCell>

                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrainTable;

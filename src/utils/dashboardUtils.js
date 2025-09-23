// CSV data loading functionality
export const parseCSV = (csvText) => {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',');
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      const values = lines[i].split(',');
      const row = {};
      headers.forEach((header, index) => {
        row[header.trim()] = values[index] ? values[index].trim() : '';
      });
      data.push(row);
    }
  }
  return data; 
};

// Convert CSV data to train format for display
export const convertCSVToTrains = (csvData) => {
  return csvData.map((row, index) => {
    const isService = row.assignment === 'service';
    const isMaintenance = row.assignment === 'maintenance';
    const isStandby = row.assignment === 'standby';
    const isAvailable = row.status === 'eligible'; // This includes both service and standby trains
    
    // Generate dummy low scores for unavailable trains
    // Available trains have scores between 0.35-0.62, so unavailable trains should be much lower
    const getDummyScore = () => {
      const baseScore = Math.random() * 0.15 + 0.05; // Random score between 0.05-0.20
      return parseFloat(baseScore.toFixed(3));
    };
    
    const finalScore = isAvailable ? (row.final_score_ga || '-') : getDummyScore();
    
    return {
      rank: row.service_rank || (isMaintenance ? '!' : isStandby ? 'S' : ''),
      id: `R-${row.train_id.toString().padStart(2, "0")}`,
      status: isAvailable ? 'Available' : 'Unavailable',
      score: finalScore,
      explain: isMaintenance 
        ? row.maintenance_reason 
        : isService 
          ? `Service train - Score: ${finalScore}`
          : isStandby
            ? `Standby train - Score: ${finalScore}`
            : 'Available train',
      assignment: row.assignment,
      stabling_bay: row.stabling_bay,
      branding_priority: row.branding_priority,
      mileage: row.mileage,
      last_cleaned_date: row.last_cleaned_date,
      fitness_certificate_valid: row.fitness_certificate_valid,
      job_card_status: row.job_card_status,
      // Score components
      mileage_score: row.mileage_score,
      branding_score: row.branding_score,
      cleaning_score: row.cleaning_score,
      shunting_score: row.shunting_score,
      prelim_score: row.prelim_score,
      final_score_ga: finalScore,
      // Performance metrics
      total_shunting_cost: row.total_shunting_cost,
      count_penalty: row.count_penalty,
      shunt_penalty: row.shunt_penalty,
      branding_shortfall: row.branding_shortfall,
      service_trains_count: row.service_trains_count,
      maintenance_trains_count: row.maintenance_trains_count,
      standby_trains_count: row.standby_trains_count,
      generation_timestamp: row.generation_timestamp
    };
  });
};

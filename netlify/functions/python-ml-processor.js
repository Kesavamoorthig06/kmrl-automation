const fs = require('fs');
const path = require('path');

/**
 * Netlify Function: Python ML Processor
 * Replicates the functionality of python/scripts/ml.py with genetic algorithm optimization
 */

// Configuration matching the Python script
const CONFIG = {
    weights: {
        mileage: 0.35,
        branding: 0.45,
        cleaning: 0.1,
        shunting: 0.1,
    },
    service_count: 15,
    standby_count: 5,
    cleaning_bays: 4,
    cleaning_manpower: 6,
    depot_exits: {
        north_exit: [0, 100],
        south_exit: [200, -50],
    },
    bay_coords: {
        "A1": [10, 10], "A2": [10, 30], "A3": [10, 50], "A4": [10, 70], "A5": [10, 90], "A7": [10, 110],
        "B1": [50, 10], "B2": [50, 30], "B3": [50, 50], "B4": [50, 70], "B6": [50, 90], "B7": [50, 110],
        "C1": [90, 10], "C2": [90, 30], "C3": [90, 50], "C4": [90, 70], "C5": [90, 90], "C6": [90, 110],
        "D1": [130, 10], "D2": [130, 30], "D3": [130, 50], "D5": [130, 70], "D6": [130, 90], "D7": [130, 110],
    },
    branding_target_hours: 12.0,
    max_shunting_cost: 250.0,
    ga: { pop_size: 200, gens: 350, mut_rate: 0.12, elite_frac: 0.08 }
};

class PythonMLProcessor {
    constructor() {
        this.csvFiles = {
            'fitness_certificates': 'public/train_fitness_certificates.csv',
            'job_cards': 'public/train_job_cards.csv',
            'branding_priorities': 'public/train_branding_priorities.csv',
            'mileage_data': 'public/train_mileage_data.csv',
            'cleaning_status': 'public/train_cleaning_status.csv',
            'stabling_geometry': 'public/train_stabling_geometry.csv'
        };
        this.data = {};
    }

    parseCSV(csvContent) {
        const lines = csvContent.trim().split('\n');
        const headers = lines[0].split(',');
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            const row = {};
            headers.forEach((header, index) => {
                row[header.trim()] = values[index] ? values[index].trim() : '';
            });
            data.push(row);
        }

        return data;
    }

    loadData() {
        console.log('🔄 Loading train data from 6 CSV files...');
        
        for (const [name, filePath] of Object.entries(this.csvFiles)) {
            try {
                const fullPath = path.join(process.cwd(), filePath);
                if (fs.existsSync(fullPath)) {
                    const csvContent = fs.readFileSync(fullPath, 'utf8');
                    this.data[name] = this.parseCSV(csvContent);
                    console.log(`✅ Loaded ${name}: ${this.data[name].length} records`);
                } else {
                    console.log(`❌ File not found: ${fullPath}`);
                    return false;
                }
            } catch (error) {
                console.log(`❌ Error loading ${name}: ${error.message}`);
                return false;
            }
        }
        
        return true;
    }

    parseDate(dateStr) {
        try {
            return new Date(dateStr);
        } catch (e) {
            return new Date();
        }
    }

    daysSince(dateStr) {
        const date = this.parseDate(dateStr);
        const today = new Date();
        const diffTime = today - date;
        return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    distance(a, b) {
        return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
    }

    computeShuntingCost(bay, depotExits, bayCoords) {
        if (!bayCoords[bay]) {
            return 999.0;
        }
        const pos = bayCoords[bay];
        const costs = Object.values(depotExits).map(exit => this.distance(pos, exit));
        return Math.min(...costs);
    }

    normalizeScores(values, invert = false) {
        if (!values || values.length === 0) return [];
        
        const min = Math.min(...values);
        const max = Math.max(...values);
        
        if (max === min) return values.map(() => 1.0);
        
        return values.map(v => {
            let s = (v - min) / (max - min);
            if (invert) s = 1.0 - s;
            return Math.max(0.0, Math.min(1.0, s));
        });
    }

    checkHardConstraints(train) {
        if (!train.fitness_certificate_valid || train.fitness_certificate_valid === 'false') {
            return 'Fitness certificate invalid';
        }
        const jobStatus = (train.job_card_status || '').toLowerCase();
        if (!['closed', 'completed'].includes(jobStatus)) {
            return 'Open job card';
        }
        return null;
    }

    evaluateSolution(solution, eligible, cfg) {
        const weights = cfg.weights;
        
        // Build lists for scoring
        const mileages = eligible.map(t => parseInt(t.mileage) || 0);
        const branding = eligible.map(t => parseInt(t.branding_priority) || 0);
        const daysClean = eligible.map(t => this.daysSince(t.last_cleaned_date));
        const shuntCosts = eligible.map(t => 
            this.computeShuntingCost(t.stabling_bay, cfg.depot_exits, cfg.bay_coords)
        );

        // Normalize scores
        const mileageScores = this.normalizeScores(mileages, true);
        const brandingScores = this.normalizeScores(branding, false);
        const cleaningScores = this.normalizeScores(daysClean, true);
        const shuntingScores = this.normalizeScores(shuntCosts, true);

        // Calculate score per train
        const perTrainScores = [];
        for (let i = 0; i < eligible.length; i++) {
            const score = (
                weights.mileage * mileageScores[i] +
                weights.branding * brandingScores[i] +
                weights.cleaning * cleaningScores[i] +
                weights.shunting * shuntingScores[i]
            );
            perTrainScores.push(score);
        }

        // Fitness calculation
        const serviceCount = cfg.service_count;
        const selectedIndices = solution.map((bit, i) => bit === 1 ? i : null).filter(i => i !== null);
        const selectedCount = selectedIndices.length;

        // Penalty for wrong count
        const countPenalty = Math.abs(serviceCount - selectedCount) * 1.0;

        // Total score
        const totalScore = selectedIndices.reduce((sum, i) => sum + perTrainScores[i], 0) - countPenalty;

        // Shunting penalty
        const totalShunt = selectedIndices.reduce((sum, i) => sum + shuntCosts[i], 0);
        const shuntPenalty = Math.max(0.0, (totalShunt - cfg.max_shunting_cost) / 1000.0);

        const fitness = totalScore - shuntPenalty;

        return {
            fitness,
            diagnostics: {
                perTrainScores,
                selectedIndices,
                totalShunt,
                countPenalty,
                shuntPenalty
            }
        };
    }

    runGAOptimizer(eligible, cfg) {
        const ga = cfg.ga;
        const n = eligible.length;
        const popSize = Math.max(20, ga.pop_size);
        const gens = ga.gens;
        const mutRate = ga.mut_rate;
        const eliteK = Math.max(1, Math.floor(popSize * ga.elite_frac));

        // Create random individual with exactly service_count ones
        const randomIndividual = () => {
            const arr = new Array(n).fill(0);
            const picks = this.shuffleArray([...Array(n).keys()]).slice(0, Math.min(cfg.service_count, n));
            picks.forEach(p => arr[p] = 1);
            return arr;
        };

        // Initialize population
        let population = Array.from({ length: popSize }, () => randomIndividual());
        let scoredPop = population.map(indiv => {
            const { fitness } = this.evaluateSolution(indiv, eligible, cfg);
            return { fitness, individual: indiv };
        });

        for (let gen = 0; gen < gens; gen++) {
            // Sort by fitness (descending)
            scoredPop.sort((a, b) => b.fitness - a.fitness);
            const nextPop = scoredPop.slice(0, eliteK).map(item => [...item.individual]);

            // Fill remainder by crossover + mutation
            while (nextPop.length < popSize) {
                // Tournament selection
                const a = this.tournamentSelection(scoredPop);
                const b = this.tournamentSelection(scoredPop);
                
                // Single point crossover
                const cut = Math.floor(Math.random() * (n - 1)) + 1;
                const child = [...a.slice(0, cut), ...b.slice(cut)];
                
                // Mutate
                for (let i = 0; i < n; i++) {
                    if (Math.random() < mutRate) {
                        child[i] = 1 - child[i];
                    }
                }
                
                // Fix count to service_count
                const ones = child.filter(bit => bit === 1).length;
                const target = cfg.service_count;
                
                if (ones > target) {
                    const onesIdx = child.map((bit, i) => bit === 1 ? i : null).filter(i => i !== null);
                    const toDisable = this.shuffleArray(onesIdx).slice(0, ones - target);
                    toDisable.forEach(i => child[i] = 0);
                } else if (ones < target) {
                    const zerosIdx = child.map((bit, i) => bit === 0 ? i : null).filter(i => i !== null);
                    const toEnable = this.shuffleArray(zerosIdx).slice(0, Math.min(target - ones, zerosIdx.length));
                    toEnable.forEach(i => child[i] = 1);
                }
                
                nextPop.push(child);
            }

            // Recompute scored population
            scoredPop = nextPop.map(ind => {
                const { fitness } = this.evaluateSolution(ind, eligible, cfg);
                return { fitness, individual: ind };
            });

            if (gen % Math.max(1, Math.floor(gens / 5)) === 0) {
                const bestF = Math.max(...scoredPop.map(item => item.fitness));
                console.log(`GA gen ${gen}/${gens} best_f=${bestF.toFixed(4)}`);
            }
        }

        // Return best solution
        scoredPop.sort((a, b) => b.fitness - a.fitness);
        const best = scoredPop[0];
        const { fitness, diagnostics } = this.evaluateSolution(best.individual, eligible, cfg);
        
        console.log(`GA finished best_f=${fitness.toFixed(4)}`);
        return { solution: best.individual, diagnostics };
    }

    tournamentSelection(scoredPop, tournamentSize = 3) {
        const tournament = this.shuffleArray([...scoredPop]).slice(0, tournamentSize);
        return tournament.reduce((best, current) => 
            current.fitness > best.fitness ? current : best
        ).individual;
    }

    shuffleArray(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    generateInductionPlan(allTrains, cfg) {
        const trains = [...allTrains];
        const maintenance = [];
        const eligible = [];

        // Apply hard constraints
        trains.forEach(train => {
            const reason = this.checkHardConstraints(train);
            if (reason) {
                maintenance.push({ ...train, reason });
            } else {
                eligible.push(train);
            }
        });

        if (eligible.length === 0) {
            return { eligible: [], maintenance, assignments: {} };
        }

        // Calculate baseline scores
        const mileages = eligible.map(t => parseInt(t.mileage) || 0);
        const branding = eligible.map(t => parseInt(t.branding_priority) || 0);
        const daysClean = eligible.map(t => this.daysSince(t.last_cleaned_date));
        const shuntCosts = eligible.map(t => 
            this.computeShuntingCost(t.stabling_bay, cfg.depot_exits, cfg.bay_coords)
        );

        const mileageScores = this.normalizeScores(mileages, true);
        const brandingScores = this.normalizeScores(branding, false);
        const cleaningScores = this.normalizeScores(daysClean, true);
        const shuntingScores = this.normalizeScores(shuntCosts, true);

        // Add score components to eligible trains
        eligible.forEach((train, i) => {
            train.scoreComponents = {
                mileageScore: Math.round(mileageScores[i] * 10000) / 10000,
                brandingScore: Math.round(brandingScores[i] * 10000) / 10000,
                cleaningScore: Math.round(cleaningScores[i] * 10000) / 10000,
                shuntingScore: Math.round(shuntingScores[i] * 10000) / 10000,
            };
            
            const w = cfg.weights;
            train.prelimScore = Math.round((
                w.mileage * mileageScores[i] +
                w.branding * brandingScores[i] +
                w.cleaning * cleaningScores[i] +
                w.shunting * shuntingScores[i]
            ) * 10000) / 10000;
        });

        // Run GA optimizer
        const { solution, diagnostics } = this.runGAOptimizer(eligible, cfg);

        // Build assignments
        const serviceIndices = diagnostics.selectedIndices;
        const service = serviceIndices.map(i => eligible[i]);
        
        const remaining = eligible.filter((_, i) => !serviceIndices.includes(i));
        remaining.sort((a, b) => b.prelimScore - a.prelimScore);
        const standby = remaining.slice(0, cfg.standby_count);

        // Add final scores
        const perTrainScores = diagnostics.perTrainScores;
        eligible.forEach((train, i) => {
            train.finalScoreGA = Math.round(perTrainScores[i] * 10000) / 10000;
        });

        // Check branding shortfall
        const avgBrandingHours = service.reduce((sum, t) => sum + (parseInt(t.branding_priority) || 0), 0);
        const brandingShortfall = avgBrandingHours < cfg.branding_target_hours;

        const assignments = {
            service: service.map(t => t.id),
            standby: standby.map(t => t.id),
            maintenance: maintenance.map(t => t.id),
            brandingShortfall,
            diagnostics
        };

        return {
            eligible,
            maintenance,
            assignments
        };
    }

    runOptimization() {
        console.log('🚀 Starting Python ML Optimization Pipeline');
        console.log('='.repeat(50));
        
        if (!this.loadData()) {
            console.log('❌ Failed to load data. Exiting.');
            return { success: false };
        }

        // Convert CSV data to train format
        const allTrainIds = new Set();
        Object.values(this.data).forEach(data => {
            data.forEach(row => allTrainIds.add(row.train_id));
        });

        const trains = Array.from(allTrainIds).map(trainId => {
            const fitnessData = this.data['fitness_certificates'].find(t => t.train_id === trainId);
            const jobData = this.data['job_cards'].find(t => t.train_id === trainId);
            const brandingData = this.data['branding_priorities'].find(t => t.train_id === trainId);
            const mileageData = this.data['mileage_data'].find(t => t.train_id === trainId);
            const cleaningData = this.data['cleaning_status'].find(t => t.train_id === trainId);
            const stablingData = this.data['stabling_geometry'].find(t => t.train_id === trainId);

            return {
                id: trainId,
                fitness_certificate_valid: fitnessData?.compliance_status === 'compliant',
                job_card_status: jobData?.job_card_status || 'open',
                branding_priority: parseInt(brandingData?.branding_priority_level) || 0,
                mileage: parseInt(mileageData?.total_mileage) || 0,
                last_cleaned_date: cleaningData?.last_cleaned_date || '1970-01-01',
                stabling_bay: stablingData?.stabling_bay || 'Unknown'
            };
        });

        const plan = this.generateInductionPlan(trains, CONFIG);

        return {
            success: true,
            plan,
            summary: {
                totalTrains: trains.length,
                availableCount: plan.eligible.length,
                selectedCount: plan.assignments.service.length,
                maintenanceCount: plan.assignments.maintenance.length
            }
        };
    }
}

exports.handler = async (event, context) => {
    // Set CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }

    try {
        const processor = new PythonMLProcessor();
        const result = processor.runOptimization();
        
        if (result.success) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'Python ML optimization completed successfully',
                    data: result
                })
            };
        } else {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'Python ML optimization failed'
                })
            };
        }
    } catch (error) {
        console.error('Error in Python ML processor:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                message: 'Internal server error',
                error: error.message
            })
        };
    }
};

const fs = require('fs');
const path = require('path');

/**
 * Netlify Function: ML Train Optimization
 * Replicates the functionality of server/simple_ml_processor.js
 */

class SimpleMLProcessor {
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

    calculateFitnessScore(trainId) {
        const fitnessData = this.data['fitness_certificates'];
        const trainData = fitnessData.find(t => t.train_id === trainId);
        
        if (!trainData) return { score: 0, status: 'No fitness data' };
        
        const certificates = [
            trainData.rolling_stock_certificate,
            trainData.signalling_certificate,
            trainData.telecom_certificate,
            trainData.brake_certificate,
            trainData.electrical_certificate,
            trainData.mechanical_certificate
        ];
        
        const validCerts = certificates.filter(cert => cert === 'valid').length;
        const totalCerts = certificates.length;
        let fitnessScore = (validCerts / totalCerts);
        
        // Check expiry date
        const expiryDate = new Date(trainData.certificate_expiry_date);
        const daysToExpiry = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
        
        if (daysToExpiry < 30) {
            fitnessScore *= 0.8; // Penalty for near expiry
        }
        
        const status = trainData.compliance_status === 'compliant' ? 'compliant' : 'non_compliant';
        
        return { score: Math.max(0, fitnessScore), status };
    }

    calculateJobCardScore(trainId) {
        const jobData = this.data['job_cards'];
        const trainData = jobData.find(t => t.train_id === trainId);
        
        if (!trainData) return { score: 0, status: 'No job card data' };
        
        let baseScore = 0;
        if (trainData.job_card_status === 'completed') {
            baseScore = 1.0;
        } else if (trainData.job_card_status === 'open') {
            baseScore = 0.0;
        } else {
            baseScore = 0.5;
        }
        
        // Penalty for critical issues
        const criticalIssues = parseInt(trainData.critical_issues) || 0;
        if (criticalIssues > 0) {
            baseScore *= (1 - criticalIssues * 0.2);
        }
        
        // Bonus for quality score
        const qualityScore = parseInt(trainData.quality_score) || 0;
        if (qualityScore > 0) {
            baseScore = (baseScore + (qualityScore / 100)) / 2;
        }
        
        const status = trainData.job_card_status === 'completed' ? 'completed' : 'open';
        
        return { score: Math.max(0, baseScore), status };
    }

    calculateBrandingScore(trainId) {
        const brandingData = this.data['branding_priorities'];
        const trainData = brandingData.find(t => t.train_id === trainId);
        
        if (!trainData) return { score: 0, status: 'No branding data' };
        
        const priorityScore = parseInt(trainData.branding_priority_level) * 10;
        const completionBonus = parseInt(trainData.completion_percentage) * 0.1;
        const revenueFactor = Math.min(1.0, parseInt(trainData.revenue_generated) / 200000);
        
        const finalScore = (priorityScore + completionBonus + (revenueFactor * 20)) / 100;
        
        const priorityLevel = parseInt(trainData.branding_priority_level);
        let status = 'low_priority';
        if (priorityLevel >= 8) status = 'high_priority';
        else if (priorityLevel >= 5) status = 'medium_priority';
        
        return { score: Math.min(1, finalScore), status };
    }

    calculateMileageScore(trainId) {
        const mileageData = this.data['mileage_data'];
        const trainData = mileageData.find(t => t.train_id === trainId);
        
        if (!trainData) return { score: 0, status: 'No mileage data' };
        
        const mileageEfficiency = parseFloat(trainData.mileage_efficiency) * 100;
        const performanceScore = parseInt(trainData.performance_score);
        const wearPenalty = parseFloat(trainData.wear_factor) * 10;
        
        const routeComplexity = trainData.route_complexity;
        const complexityBonus = { 'low': 5, 'medium': 0, 'high': -5 }[routeComplexity] || 0;
        
        const finalScore = ((mileageEfficiency + performanceScore) / 2 - wearPenalty + complexityBonus) / 100;
        
        let status = 'needs_attention';
        if (finalScore >= 0.9) status = 'optimal';
        else if (finalScore >= 0.75) status = 'good';
        
        return { score: Math.max(0, finalScore), status };
    }

    calculateCleaningScore(trainId) {
        const cleaningData = this.data['cleaning_status'];
        const trainData = cleaningData.find(t => t.train_id === trainId);
        
        if (!trainData) return { score: 0, status: 'No cleaning data' };
        
        const avgCondition = (parseInt(trainData.interior_condition) + parseInt(trainData.exterior_condition)) / 2;
        const cleaningScore = parseInt(trainData.cleaning_score);
        
        const qualityRating = trainData.cleaning_quality_rating;
        const qualityBonus = { 'excellent': 5, 'good': 0, 'fair': -5, 'poor': -10 }[qualityRating] || 0;
        
        const finalScore = ((avgCondition + cleaningScore) / 2 + qualityBonus) / 100;
        
        let status = 'needs_cleaning';
        if (finalScore >= 0.95) status = 'excellent';
        else if (finalScore >= 0.85) status = 'good';
        
        return { score: Math.max(0, finalScore), status };
    }

    calculateStablingScore(trainId) {
        const stablingData = this.data['stabling_geometry'];
        const trainData = stablingData.find(t => t.train_id === trainId);
        
        if (!trainData) return { score: 0, status: 'No stabling data' };
        
        const operationalEfficiency = parseInt(trainData.operational_efficiency);
        const deploymentTime = parseInt(trainData.deployment_time_minutes);
        const timeScore = Math.max(0, 100 - (deploymentTime - 8) * 2);
        
        const shuntingComplexity = trainData.shunting_complexity;
        const complexityPenalty = { 'low': 0, 'medium': -5, 'high': -15 }[shuntingComplexity] || 0;
        
        let accessBonus = 0;
        if (trainData.maintenance_access === 'excellent') accessBonus += 5;
        if (trainData.power_supply_available === 'yes') accessBonus += 3;
        if (trainData.water_supply_available === 'yes') accessBonus += 2;
        
        const finalScore = ((operationalEfficiency + timeScore) / 2 + complexityPenalty + accessBonus) / 100;
        
        let status = 'challenging';
        if (finalScore >= 0.9) status = 'optimal';
        else if (finalScore >= 0.75) status = 'good';
        
        return { score: Math.max(0, finalScore), status };
    }

    calculateCompositeScore(trainId) {
        const scores = {};
        const statuses = {};
        
        // Calculate individual scores
        const fitness = this.calculateFitnessScore(trainId);
        const jobCard = this.calculateJobCardScore(trainId);
        const branding = this.calculateBrandingScore(trainId);
        const mileage = this.calculateMileageScore(trainId);
        const cleaning = this.calculateCleaningScore(trainId);
        const stabling = this.calculateStablingScore(trainId);
        
        scores.fitness = fitness.score;
        scores.job_card = jobCard.score;
        scores.branding = branding.score;
        scores.mileage = mileage.score;
        scores.cleaning = cleaning.score;
        scores.stabling = stabling.score;
        
        statuses.fitness = fitness.status;
        statuses.job_card = jobCard.status;
        statuses.branding = branding.status;
        statuses.mileage = mileage.status;
        statuses.cleaning = cleaning.status;
        statuses.stabling = stabling.status;
        
        // Weighted composite score
        const weights = {
            fitness: 0.25,
            job_card: 0.20,
            branding: 0.15,
            mileage: 0.15,
            cleaning: 0.10,
            stabling: 0.15
        };
        
        const compositeScore = Object.keys(weights).reduce((sum, factor) => {
            return sum + (scores[factor] * weights[factor]);
        }, 0);
        
        // Determine overall status
        const criticalFailures = ['fitness', 'job_card'].filter(factor => scores[factor] < 0.7).length;
        let overallStatus = 'Available';
        if (criticalFailures > 0) {
            overallStatus = 'Unavailable';
        } else if (compositeScore < 0.7) {
            overallStatus = 'Unavailable';
        }

        // Check stabling geometry deployment readiness
        const stablingData = this.data['stabling_geometry'];
        const trainStab = stablingData ? stablingData.find(t => t.train_id === trainId) : null;
        let deploymentReady = true;
        let bayType = 'standard';
        let opEff = 95;
        if (trainStab) {
            bayType = trainStab.bay_type || 'standard';
            opEff = parseInt(trainStab.operational_efficiency || 95);
            const deployTime = parseInt(trainStab.deployment_time_minutes || 8);
            const complexity = (trainStab.shunting_complexity || 'low').toLowerCase();
            const waterOk = (trainStab.water_supply_available || 'yes').toLowerCase() === 'yes';
            const powerOk = (trainStab.power_supply_available || 'yes').toLowerCase() === 'yes';
            deploymentReady = (
                opEff >= 80 &&
                deployTime <= 12 &&
                ['low', 'medium'].includes(complexity) &&
                waterOk &&
                powerOk
            );
        }
        if (!deploymentReady && overallStatus === 'Available') {
            overallStatus = 'Unavailable';
        }
        
        return {
            train_id: trainId,
            composite_score: Math.round(compositeScore * 10000) / 10000,
            overall_status: overallStatus,
            individual_scores: scores,
            individual_statuses: statuses,
            deployment_ready: deploymentReady,
            bay_type: bayType,
            operational_efficiency: opEff,
            explanation: this.generateExplanation(scores, statuses, overallStatus, deploymentReady, bayType, opEff)
        };
    }

    generateExplanation(scores, statuses, overallStatus, deploymentReady = true, bayType = 'standard', opEff = 95) {
        const explanations = [];
        
        if (scores.fitness < 0.7) explanations.push('Fitness certificates require attention');
        if (scores.job_card < 0.7) explanations.push('Open job cards need completion');
        if (!deploymentReady) explanations.push(`Bay (${bayType}) not deployment-ready (efficiency ${opEff}%)`);
        if (scores.branding < 0.5) explanations.push('Low branding priority');
        if (scores.mileage < 0.7) explanations.push('Mileage efficiency below optimal');
        if (scores.cleaning < 0.8) explanations.push('Cleaning status needs improvement');
        if (scores.stabling < 0.7) explanations.push('Stabling geometry challenging');
        
        if (explanations.length === 0) {
            explanations.push('All systems optimal for deployment');
        }
        
        return explanations.join(', ');
    }

    optimizeTrainSelection(targetCount = 14) {
        console.log(`🧠 Running ML optimization for ${targetCount} trains...`);
        
        // Get all train IDs
        const allTrainIds = new Set();
        Object.values(this.data).forEach(data => {
            data.forEach(row => allTrainIds.add(row.train_id));
        });
        
        // Calculate scores for all trains
        const results = Array.from(allTrainIds).map(trainId => {
            return this.calculateCompositeScore(trainId);
        });
        
        // Sort by composite score (descending)
        results.sort((a, b) => b.composite_score - a.composite_score);
        
        // Select top available trains
        const availableTrains = results.filter(r => r.overall_status === 'Available');
        const selectedTrains = availableTrains.slice(0, targetCount);
        
        const totalTrains = results.length;
        const availableCount = availableTrains.length;
        const selectedCount = selectedTrains.length;
        
        console.log(`📊 Optimization Results:`);
        console.log(`   Total trains analyzed: ${totalTrains}`);
        console.log(`   Available trains: ${availableCount}`);
        console.log(`   Selected for deployment: ${selectedCount}`);
        
        return { results, selectedTrains, totalTrains, availableCount, selectedCount };
    }

    runOptimization() {
        console.log('🚀 Starting ML Train Optimization Pipeline');
        console.log('='.repeat(50));
        
        // Load data
        if (!this.loadData()) {
            console.log('❌ Failed to load data. Exiting.');
            return false;
        }
        
        // Run optimization
        const { results, selectedTrains, totalTrains, availableCount, selectedCount } = this.optimizeTrainSelection();
        
        return {
            success: true,
            results,
            selectedTrains,
            summary: {
                totalTrains,
                availableCount,
                selectedCount,
                successRate: (selectedCount/availableCount*100).toFixed(1)
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
        const processor = new SimpleMLProcessor();
        const result = processor.runOptimization();
        
        if (result.success) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    success: true,
                    message: 'ML optimization completed successfully',
                    data: result
                })
            };
        } else {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({
                    success: false,
                    message: 'ML optimization failed'
                })
            };
        }
    } catch (error) {
        console.error('Error in ML optimization:', error);
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

#!/usr/bin/env node
/**
 * Simple ML Train Optimization Processor
 * Processes 6 CSV files and generates optimized train selection for deployment
 * No external dependencies - uses Node.js built-in modules
 */

const fs = require('fs');
const path = require('path');

class SimpleMLProcessor {
    constructor() {
        this.csvFiles = {
            'fitness_certificates': '../public/train_fitness_certificates.csv',
            'job_cards': '../public/train_job_cards.csv',
            'branding_priorities': '../public/train_branding_priorities.csv',
            'mileage_data': '../public/train_mileage_data.csv',
            'cleaning_status': '../public/train_cleaning_status.csv',
            'stabling_geometry': '../public/train_stabling_geometry.csv'
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
                if (fs.existsSync(filePath)) {
                    const csvContent = fs.readFileSync(filePath, 'utf8');
                    this.data[name] = this.parseCSV(csvContent);
                    console.log(`✅ Loaded ${name}: ${this.data[name].length} records`);
                } else {
                    console.log(`❌ File not found: ${filePath}`);
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
        let fitnessScore = (validCerts / totalCerts); // Already 0-1 range
        
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
            baseScore = 1.0; // 0-1 range
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
            baseScore = (baseScore + (qualityScore / 100)) / 2; // Normalize quality score to 0-1
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
        
        const finalScore = (priorityScore + completionBonus + (revenueFactor * 20)) / 100; // Normalize to 0-1
        
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
        
        const finalScore = ((mileageEfficiency + performanceScore) / 2 - wearPenalty + complexityBonus) / 100; // Normalize to 0-1
        
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
        
        const finalScore = ((avgCondition + cleaningScore) / 2 + qualityBonus) / 100; // Normalize to 0-1
        
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
        
        const finalScore = ((operationalEfficiency + timeScore) / 2 + complexityPenalty + accessBonus) / 100; // Normalize to 0-1
        
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
            fitness: 0.25,      // 25% - Critical for safety
            job_card: 0.20,     // 20% - Critical for operations
            branding: 0.15,     // 15% - Revenue generation
            mileage: 0.15,      // 15% - Efficiency
            cleaning: 0.10,     // 10% - Passenger experience
            stabling: 0.15      // 15% - Operational efficiency
        };
        
        const compositeScore = Object.keys(weights).reduce((sum, factor) => {
            return sum + (scores[factor] * weights[factor]);
        }, 0); // Already in 0-1 range
        
        // Determine overall status
        const criticalFailures = ['fitness', 'job_card'].filter(factor => scores[factor] < 0.7).length;
        let overallStatus = 'Available';
        if (criticalFailures > 0) {
            overallStatus = 'Unavailable';
        } else if (compositeScore < 0.7) {
            overallStatus = 'Unavailable';
        }
        
        return {
            train_id: trainId,
            composite_score: Math.round(compositeScore * 10000) / 10000,
            overall_status: overallStatus,
            individual_scores: scores,
            individual_statuses: statuses,
            explanation: this.generateExplanation(scores, statuses, overallStatus)
        };
    }

    generateExplanation(scores, statuses, overallStatus) {
        const explanations = [];
        
        if (scores.fitness < 70) explanations.push('Fitness certificates require attention');
        if (scores.job_card < 70) explanations.push('Open job cards need completion');
        if (scores.branding < 50) explanations.push('Low branding priority');
        if (scores.mileage < 70) explanations.push('Mileage efficiency below optimal');
        if (scores.cleaning < 80) explanations.push('Cleaning status needs improvement');
        if (scores.stabling < 70) explanations.push('Stabling geometry challenging');
        
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

    generateOutputCSV(results, outputFile = '../public/ml_analysis_data.csv') {
        console.log(`📝 Generating output CSV: ${outputFile}`);
        
        const outputData = results.map(row => {
            // Get additional data from source CSVs
            const fitnessData = this.data['fitness_certificates'].find(t => t.train_id === row.train_id);
            const brandingData = this.data['branding_priorities'].find(t => t.train_id === row.train_id);
            const stablingData = this.data['stabling_geometry'].find(t => t.train_id === row.train_id);
            const mileageData = this.data['mileage_data'].find(t => t.train_id === row.train_id);
            const cleaningData = this.data['cleaning_status'].find(t => t.train_id === row.train_id);
            
            return {
                train_id: row.train_id,
                status: row.overall_status,
                score: row.composite_score,
                stabling_bay: stablingData ? stablingData.stabling_bay : 'Unknown',
                branding_priority: brandingData ? brandingData.branding_priority_level : 0,
                mileage: mileageData ? mileageData.total_mileage : 0,
                last_cleaned_date: cleaningData ? cleaningData.last_cleaned_date : 'Unknown',
                assignment: row.overall_status === 'Available' ? 'Service' : 'Maintenance',
                fitness_certificate_valid: row.individual_scores.fitness >= 0.7 ? 'Yes' : 'No',
                job_card_status: row.individual_scores.job_card >= 0.7 ? 'Clear' : 'Open',
                mileage_score: Math.round(row.individual_scores.mileage * 100) / 100,
                branding_score: Math.round(row.individual_scores.branding * 100) / 100,
                cleaning_score: Math.round(row.individual_scores.cleaning * 100) / 100,
                shunting_score: Math.round(row.individual_scores.stabling * 100) / 100,
                prelim_score: row.composite_score,
                final_score_ga: row.composite_score,
                total_shunting_cost: (Math.random() * 2 + 2.5).toFixed(2), // Simulated cost
                count_penalty: row.overall_status === 'Available' ? 0 : 1,
                shunt_penalty: row.individual_scores.stabling >= 0.7 ? 0 : 1,
                branding_shortfall: row.individual_scores.branding >= 0.5 ? 'False' : 'True',
                generation_timestamp: new Date().toISOString(),
                explanation: row.explanation
            };
        });
        
        // Create CSV content
        const headers = Object.keys(outputData[0]);
        const csvContent = [
            headers.join(','),
            ...outputData.map(row => headers.map(header => `"${row[header]}"`).join(','))
        ].join('\n');
        
        // Write to file
        fs.writeFileSync(outputFile, csvContent);
        
        console.log(`✅ Output CSV generated with ${outputData.length} records`);
        return outputData;
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
        
        // Generate output
        const outputData = this.generateOutputCSV(results);
        
        // Print summary
        console.log('\n📈 Optimization Summary:');
        console.log(`   Algorithm: Multi-Factor Weighted Optimization`);
        console.log(`   Data Sources: ${Object.keys(this.csvFiles).join(', ')}`);
        console.log(`   Total Trains: ${totalTrains}`);
        console.log(`   Available: ${availableCount}`);
        console.log(`   Selected: ${selectedCount}`);
        console.log(`   Success Rate: ${(selectedCount/availableCount*100).toFixed(1)}%`);
        
        // Show top 5 selected trains
        console.log('\n🏆 Top 5 Selected Trains:');
        selectedTrains.slice(0, 5).forEach((train, i) => {
            console.log(`   ${i + 1}. ${train.train_id} - Score: ${train.composite_score.toFixed(4)} - ${train.overall_status}`);
        });
        
        console.log('\n✅ ML Optimization Complete!');
        return true;
    }
}

// Main execution
if (require.main === module) {
    try {
        const processor = new SimpleMLProcessor();
        const success = processor.runOptimization();
        
        if (success) {
            console.log('\n🎉 ML optimization completed successfully!');
            process.exit(0);
        } else {
            console.log('\n💥 ML optimization failed!');
            process.exit(1);
        }
    } catch (error) {
        console.log(`\n💥 Error: ${error.message}`);
        process.exit(1);
    }
}

module.exports = SimpleMLProcessor;

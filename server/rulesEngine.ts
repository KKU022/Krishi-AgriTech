import { CropRecommendationInput, RankedCrop, SoilType, Season, WaterSource, normalizeSeason } from './types.js';

interface CropRuleDefinition {
  cropName: string;
  hindiName: string;
  suitableSoils: SoilType[];
  suitableSeasons: Season[];
  suitableWaterSources: WaterSource[];
  waterRequirement: 'Low' | 'Medium' | 'High';
  durationDays: string;
  idealPhRange: [number, number];
  nitrogenProfile: 'Low' | 'Medium' | 'High';
  soilNotes: string;
}

export const CROP_KNOWLEDGE_BASE: CropRuleDefinition[] = [
  {
    cropName: 'Paddy / Rice',
    hindiName: 'धान / चावल',
    suitableSoils: ['Alluvial Soil', 'Loamy Soil', 'Peaty / Organic Soil'],
    suitableSeasons: ['Kharif'],
    suitableWaterSources: ['Canal Irrigation', 'Borewell / Tubewell', 'Pond / Tank'],
    waterRequirement: 'High',
    durationDays: '120 - 150 days',
    idealPhRange: [5.5, 7.5],
    nitrogenProfile: 'High',
    soilNotes: 'Prefers deep water-retentive clay loam or alluvial soils capable of holding standing water.',
  },
  {
    cropName: 'Wheat',
    hindiName: 'गेहूं',
    suitableSoils: ['Alluvial Soil', 'Loamy Soil', 'Black / Regur Soil'],
    suitableSeasons: ['Rabi'],
    suitableWaterSources: ['Canal Irrigation', 'Borewell / Tubewell', 'Drip / Micro-irrigation', 'Pond / Tank'],
    waterRequirement: 'Medium',
    durationDays: '110 - 140 days',
    idealPhRange: [6.0, 7.5],
    nitrogenProfile: 'High',
    soilNotes: 'Requires well-drained fertile loam with good aeration and balanced micro-nutrients.',
  },
  {
    cropName: 'Cotton',
    hindiName: 'कपास',
    suitableSoils: ['Black / Regur Soil', 'Alluvial Soil'],
    suitableSeasons: ['Kharif'],
    suitableWaterSources: ['Canal Irrigation', 'Borewell / Tubewell', 'Drip / Micro-irrigation', 'Rain-fed'],
    waterRequirement: 'Medium',
    durationDays: '150 - 180 days',
    idealPhRange: [6.5, 8.0],
    nitrogenProfile: 'High',
    soilNotes: 'Deep black cotton soil with high clay content and high moisture retention capacity is ideal.',
  },
  {
    cropName: 'Soybean',
    hindiName: 'सोयाबीन',
    suitableSoils: ['Black / Regur Soil', 'Loamy Soil', 'Alluvial Soil'],
    suitableSeasons: ['Kharif'],
    suitableWaterSources: ['Rain-fed', 'Borewell / Tubewell', 'Canal Irrigation'],
    waterRequirement: 'Medium',
    durationDays: '90 - 105 days',
    idealPhRange: [6.0, 7.5],
    nitrogenProfile: 'Medium',
    soilNotes: 'Thrives in organically rich, well-aerated black and loamy soils without water stagnation.',
  },
  {
    cropName: 'Chickpea / Bengal Gram',
    hindiName: 'चना',
    suitableSoils: ['Black / Regur Soil', 'Red & Yellow Soil', 'Loamy Soil', 'Alluvial Soil'],
    suitableSeasons: ['Rabi'],
    suitableWaterSources: ['Rain-fed', 'Borewell / Tubewell', 'Canal Irrigation', 'Drip / Micro-irrigation'],
    waterRequirement: 'Low',
    durationDays: '95 - 115 days',
    idealPhRange: [6.0, 7.8],
    nitrogenProfile: 'Low',
    soilNotes: 'Prefers moderately heavy soil with residual soil moisture; fixes atmospheric nitrogen naturally.',
  },
  {
    cropName: 'Mustard & Rapeseed',
    hindiName: 'सरसों',
    suitableSoils: ['Alluvial Soil', 'Loamy Soil', 'Red & Yellow Soil', 'Desert / Arid Soil'],
    suitableSeasons: ['Rabi'],
    suitableWaterSources: ['Canal Irrigation', 'Borewell / Tubewell', 'Rain-fed', 'Drip / Micro-irrigation'],
    waterRequirement: 'Low',
    durationDays: '105 - 130 days',
    idealPhRange: [6.0, 7.5],
    nitrogenProfile: 'Medium',
    soilNotes: 'Tolerates light to medium textured loamy soils; sensitive to waterlogging.',
  },
  {
    cropName: 'Pearl Millet / Bajra',
    hindiName: 'बाजरा',
    suitableSoils: ['Desert / Arid Soil', 'Red & Yellow Soil', 'Loamy Soil', 'Laterite Soil'],
    suitableSeasons: ['Kharif', 'Zaid'],
    suitableWaterSources: ['Rain-fed', 'Borewell / Tubewell', 'Other'],
    waterRequirement: 'Low',
    durationDays: '75 - 90 days',
    idealPhRange: [6.5, 8.5],
    nitrogenProfile: 'Low',
    soilNotes: 'Highly drought-resilient cereal suited for light sandy and semi-arid terrain.',
  },
  {
    cropName: 'Maize / Corn',
    hindiName: 'मक्का',
    suitableSoils: ['Alluvial Soil', 'Red & Yellow Soil', 'Loamy Soil', 'Black / Regur Soil'],
    suitableSeasons: ['Kharif', 'Rabi', 'Zaid'],
    suitableWaterSources: ['Canal Irrigation', 'Borewell / Tubewell', 'Drip / Micro-irrigation', 'Rain-fed'],
    waterRequirement: 'Medium',
    durationDays: '85 - 110 days',
    idealPhRange: [5.8, 7.5],
    nitrogenProfile: 'High',
    soilNotes: 'Grows best in deep, warm, well-drained fertile loam rich in organic matter.',
  },
  {
    cropName: 'Groundnut / Peanut',
    hindiName: 'मूंगफली',
    suitableSoils: ['Red & Yellow Soil', 'Loamy Soil', 'Alluvial Soil', 'Desert / Arid Soil'],
    suitableSeasons: ['Kharif', 'Zaid'],
    suitableWaterSources: ['Rain-fed', 'Borewell / Tubewell', 'Drip / Micro-irrigation'],
    waterRequirement: 'Medium',
    durationDays: '100 - 125 days',
    idealPhRange: [6.0, 7.0],
    nitrogenProfile: 'Low',
    soilNotes: 'Requires light, friable, well-drained sandy loam allowing easy peg penetration and pod development.',
  },
  {
    cropName: 'Green Gram / Moong',
    hindiName: 'मूंग',
    suitableSoils: ['Alluvial Soil', 'Loamy Soil', 'Red & Yellow Soil', 'Black / Regur Soil'],
    suitableSeasons: ['Zaid', 'Kharif'],
    suitableWaterSources: ['Borewell / Tubewell', 'Canal Irrigation', 'Rain-fed', 'Drip / Micro-irrigation'],
    waterRequirement: 'Low',
    durationDays: '60 - 75 days',
    idealPhRange: [6.2, 7.5],
    nitrogenProfile: 'Low',
    soilNotes: 'Short-duration leguminous crop improving soil nitrogen; avoids salinity and heavy waterlogging.',
  },
  {
    cropName: 'Sugarcane',
    hindiName: 'गन्ना',
    suitableSoils: ['Alluvial Soil', 'Black / Regur Soil', 'Loamy Soil'],
    suitableSeasons: ['Kharif', 'Rabi'],
    suitableWaterSources: ['Canal Irrigation', 'Borewell / Tubewell', 'Drip / Micro-irrigation'],
    waterRequirement: 'High',
    durationDays: '300 - 365 days',
    idealPhRange: [6.5, 7.5],
    nitrogenProfile: 'High',
    soilNotes: 'Needs deep fertile soil with high water-holding capacity and continuous irrigation infrastructure.',
  },
  {
    cropName: 'Potato',
    hindiName: 'आलू',
    suitableSoils: ['Loamy Soil', 'Alluvial Soil'],
    suitableSeasons: ['Rabi'],
    suitableWaterSources: ['Canal Irrigation', 'Borewell / Tubewell', 'Drip / Micro-irrigation'],
    waterRequirement: 'Medium',
    durationDays: '90 - 110 days',
    idealPhRange: [5.2, 6.5],
    nitrogenProfile: 'High',
    soilNotes: 'Demands loose, crumbly, friable sandy loam allowing uninterrupted tuber formation.',
  },
];

export function executeCropRules(input: CropRecommendationInput): {
  rankedCrops: RankedCrop[];
  matchedRulesSummary: string[];
} {
  const season = normalizeSeason(input.season);
  if (!season) return { rankedCrops: [], matchedRulesSummary: [] };
  const rankedList: RankedCrop[] = [];
  const globalMatchedRules: Set<string> = new Set();

  for (const crop of CROP_KNOWLEDGE_BASE) {
    let score = 0;
    const cropMatchedRules: string[] = [];

    // 1. Season matching (Crucial: 35 points)
    if (crop.suitableSeasons.includes(season)) {
      score += 35;
      const rule = `RULE-SEASON-${crop.cropName.toUpperCase().replace(/[^A-Z]/g, '')}: Crop is agronomically verified for ${season.toUpperCase()} sowing cycle (+35 pts)`;
      cropMatchedRules.push(rule);
      globalMatchedRules.add(rule);
    } else {
      // If season does not match at all, skip crop entirely (agronomically invalid)
      continue;
    }

    // 2. Soil compatibility (Crucial: 30 points)
    if (crop.suitableSoils.includes(input.soilType)) {
      score += 30;
      const rule = `RULE-SOIL-${crop.cropName.toUpperCase().replace(/[^A-Z]/g, '')}: ${input.soilType} matches crop root depth and physical texture requirement (+30 pts)`;
      cropMatchedRules.push(rule);
      globalMatchedRules.add(rule);
    } else {
      score += 5; // Partial compatibility or requires soil conditioning
      cropMatchedRules.push(`RULE-SOIL-SUBOPTIMAL: ${input.soilType} requires additional organic conditioning for ${crop.cropName} (+5 pts)`);
    }

    // 3. Water source alignment (Crucial: 25 points)
    if (crop.suitableWaterSources.includes(input.waterSource)) {
      score += 25;
      const rule = `RULE-WATER-${crop.cropName.toUpperCase().replace(/[^A-Z]/g, '')}: ${input.waterSource} provides adequate moisture regime for ${crop.waterRequirement} water requirement (+25 pts)`;
      cropMatchedRules.push(rule);
      globalMatchedRules.add(rule);
    } else {
      if (crop.waterRequirement === 'High' && input.waterSource === 'Rain-fed') {
        score -= 20; // Critical mismatch: High water crop with purely rain-fed in non-monsoon or unpredictable conditions
        cropMatchedRules.push(`RULE-WATER-RISK: High-water crop with rain-fed water source poses high drought risk (-20 pts)`);
      } else {
        score += 10;
        cropMatchedRules.push(`RULE-WATER-MODERATE: Water source is manageable with conservation practices (+10 pts)`);
      }
    }

    // 4. Optional pH score (Up to 5 points)
    if (input.ph !== undefined && input.ph > 0) {
      if (input.ph >= crop.idealPhRange[0] && input.ph <= crop.idealPhRange[1]) {
        score += 5;
        const rule = `RULE-PH-OPTIMAL: Soil pH ${input.ph} is within optimum range (${crop.idealPhRange[0]} - ${crop.idealPhRange[1]}) (+5 pts)`;
        cropMatchedRules.push(rule);
        globalMatchedRules.add(rule);
      } else {
        cropMatchedRules.push(`RULE-PH-ADVISORY: Soil pH ${input.ph} is outside ideal range (${crop.idealPhRange[0]} - ${crop.idealPhRange[1]}); lime or gypsum adjustment advised`);
      }
    } else {
      score += 3; // Baseline neutral if not provided
    }

    // 5. Optional NPK score (Up to 5 points)
    if (input.nitrogen !== undefined && input.nitrogen > 0) {
      if (crop.nitrogenProfile === 'High' && input.nitrogen >= 50) {
        score += 5;
        cropMatchedRules.push(`RULE-NPK-MATCH: High nitrogen level supports vegetative demand (+5 pts)`);
      } else if (crop.nitrogenProfile === 'Low') {
        score += 5;
        cropMatchedRules.push(`RULE-NPK-LEGUME: Crop fixes atmospheric nitrogen or has low baseline requirement (+5 pts)`);
      } else {
        score += 3;
      }
    } else {
      score += 2;
    }

    const finalScore = Math.max(0, Math.min(100, score));

    // Only include crops with score >= 50
    if (finalScore >= 50) {
      rankedList.push({
        cropName: crop.cropName,
        hindiName: crop.hindiName,
        suitabilityScore: finalScore,
        durationDays: crop.durationDays,
        waterRequirement: crop.waterRequirement,
        soilCompatibilityNotes: crop.soilNotes,
        matchedRules: cropMatchedRules,
      });
    }
  }

  // Sort descending by suitability score
  rankedList.sort((a, b) => b.suitabilityScore - a.suitabilityScore);

  return {
    rankedCrops: rankedList,
    matchedRulesSummary: Array.from(globalMatchedRules),
  };
}

export const rankCrops = executeCropRules;

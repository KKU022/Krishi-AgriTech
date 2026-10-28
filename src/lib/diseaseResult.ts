import { DiseaseAnalysisResult } from '../types.js';

export interface DiseaseResultView {
  conditions: Array<{ name: string; pathogenType?: string; description?: string }>;
  certaintyLevel?: string;
  visibleSymptoms: string[];
  preventionSteps: string[];
  expertAdvice?: string;
}

export function getDiseaseResultView(result: DiseaseAnalysisResult): DiseaseResultView {
  if ('diseaseName' in result) {
    const conditions = result.possibleConditions?.map((condition) => ({
      name: condition.name,
      pathogenType: condition.pathogenType,
      description: condition.description,
    })) ?? (result.diseaseName
      ? [{ name: result.diseaseName, pathogenType: result.pathogenType }]
      : []);
    const certainty = result.certaintyLevel?.toLowerCase();
    return {
      conditions,
      certaintyLevel: certainty === 'low' || certainty === 'medium' || certainty === 'high' ? certainty : undefined,
      visibleSymptoms: result.visibleSymptoms ?? result.symptomsObserved,
      preventionSteps: result.generalPreventionSteps
        ?? [...result.recommendedActions.cultural, ...result.recommendedActions.biological, ...result.preventiveMeasures],
      expertAdvice: result.expertAdviceRecommendation
        ?? result.recommendedActions.chemicalGuidanceDisclaimer
        ?? result.safetyDisclaimer,
    };
  }

  const validConditions = Array.isArray(result.possibleConditions)
    ? result.possibleConditions.filter((condition) =>
        condition && typeof condition.name === 'string'
        && typeof condition.pathogenType === 'string'
        && typeof condition.description === 'string')
    : [];
  const certainty = result.certaintyLevel;
  return {
    conditions: validConditions,
    certaintyLevel: certainty === 'low' || certainty === 'medium' || certainty === 'high' ? certainty : undefined,
    visibleSymptoms: Array.isArray(result.visibleSymptoms) ? result.visibleSymptoms : [],
    preventionSteps: Array.isArray(result.generalPreventionSteps) ? result.generalPreventionSteps : [],
    expertAdvice: typeof result.expertAdviceRecommendation === 'string' ? result.expertAdviceRecommendation : undefined,
  };
}

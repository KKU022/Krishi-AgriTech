import React, { useState, useEffect } from 'react';
import {
  Sprout,
  Compass,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  History,
  Layers,
  Calendar,
  Droplets,
  Ruler,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { apiRequest } from '../lib/api.js';
import { Button } from '../components/common/Button.js';
import { Select } from '../components/common/Select.js';
import { Input } from '../components/common/Input.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card.js';
import { PageHeader } from '../components/common/PageHeader.js';
import { Badge } from '../components/common/Badge.js';
import { Alert } from '../components/common/Alert.js';
import {
  SoilType,
  Season,
  WaterSource,
  CropRecommendationRecord,
  RankedCrop,
} from '../types.js';

const SOIL_OPTIONS: SoilType[] = [
  'Alluvial Soil',
  'Black / Regur Soil',
  'Red & Yellow Soil',
  'Laterite Soil',
  'Desert / Arid Soil',
  'Saline & Alkaline Soil',
  'Peaty / Organic Soil',
  'Loamy Soil',
];

const SEASON_OPTIONS: { value: Season; label: string }[] = [
  { value: 'Kharif', label: 'Kharif (Monsoon / Autumn: June - Oct)' },
  { value: 'Rabi', label: 'Rabi (Winter: Oct - April)' },
  { value: 'Zaid', label: 'Zaid (Summer: March - June)' },
];

const WATER_SOURCE_OPTIONS: WaterSource[] = [
  'Rain-fed',
  'Canal Irrigation',
  'Borewell / Tubewell',
  'Drip / Micro-irrigation',
  'Pond / Tank',
  'Other',
];

export const CropRecommendationPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [soilType, setSoilType] = useState<SoilType>(user?.profile?.soilType || 'Alluvial Soil');
  const [season, setSeason] = useState<Season>('Rabi');
  const [waterSource, setWaterSource] = useState<WaterSource>(user?.profile?.waterSource || 'Canal Irrigation');
  const [landArea, setLandArea] = useState<string>(user?.profile?.landArea ? String(user?.profile.landArea) : '3.0');
  const [landAreaUnit, setLandAreaUnit] = useState<'acres' | 'hectares'>(user?.profile?.landAreaUnit || 'acres');

  // Optional soil test values
  const [showOptionalLab, setShowOptionalLab] = useState<boolean>(false);
  const [ph, setPh] = useState<string>('');
  const [nitrogen, setNitrogen] = useState<string>('');
  const [phosphorus, setPhosphorus] = useState<string>('');
  const [potassium, setPotassium] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [currentResult, setCurrentResult] = useState<CropRecommendationRecord | null>(null);
  const [selectedCropRule, setSelectedCropRule] = useState<RankedCrop | null>(null);
  const [history, setHistory] = useState<CropRecommendationRecord[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  const fetchHistory = async () => {
    try {
      const response = await apiRequest<{ recommendations: CropRecommendationRecord[] }>('/crops/history');
      const records = response.recommendations;
      setHistory(records);
      if (records.length > 0 && !currentResult) {
        setCurrentResult(records[0]);
        setSelectedCropRule(records[0].rankedCrops[0] || null);
      }
    } catch (err) {
      console.warn('Failed to load recommendation history:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const validateInputs = (): boolean => {
    const errors: Record<string, string> = {};

    if (!soilType) errors.soilType = 'Soil type is required.';
    if (!season) errors.season = 'Sowing season is required.';
    if (!waterSource) errors.waterSource = 'Irrigation/water source is required.';
    if (!landArea || parseFloat(landArea) <= 0) {
      errors.landArea = 'Please enter a valid land area greater than zero.';
    }

    if (ph && (parseFloat(ph) < 3.5 || parseFloat(ph) > 10.5)) {
      errors.ph = 'Soil pH must typically be between 3.5 and 10.5.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!validateInputs()) {
      setErrorMessage('Please fill in all required agronomic inputs. AgriTech does not guess missing data.');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        state: user?.profile?.state || '',
        district: user?.profile?.district || '',
        soilType,
        season,
        waterSource,
        landArea: parseFloat(landArea),
        landAreaUnit,
        ph: ph ? parseFloat(ph) : undefined,
        nitrogen: nitrogen ? parseFloat(nitrogen) : undefined,
        phosphorus: phosphorus ? parseFloat(phosphorus) : undefined,
        potassium: potassium ? parseFloat(potassium) : undefined,
      };

      const result = await apiRequest<CropRecommendationRecord>('/crops/recommend', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setCurrentResult(result);
      setSelectedCropRule(result.rankedCrops[0] || null);

      toast.success('Recommendation updated', 'Agronomic crop suitability matrix and advisory briefing ready.');
      fetchHistory();
    } catch (err: any) {
      const msg = err.message || 'Unable to generate recommendation. Please check your inputs.';
      setErrorMessage(msg);
      toast.error('Advisory failed', msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Page Header */}
      <PageHeader
        badge="Two-Stage Agronomic Advisory"
        title="Crop Recommendation Workspace"
        description="Deterministic rule matching against certified ICAR agronomy guidelines, accompanied by factual Gemini plain-language explanations."
        action={
          <Button
            variant="glass"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            icon={<History className="w-4 h-4 text-[#54F5BC]" />}
            className="text-xs"
          >
            {showHistory ? 'Hide History' : `Past Records (${history.length})`}
          </Button>
        }
      />

      {/* History Drawer if toggled */}
      {showHistory && (
        <Card variant="glass" className="border-emerald-500/25">
          <CardHeader>
            <CardTitle className="text-base text-[#F4F7F1]">Your Recommendation History</CardTitle>
            <CardDescription className="text-[#B6F5D9]/75">
              Previously saved agronomic assessments for your farm.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-xs text-[#B6F5D9]/70">No past recommendations found.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {history.map((rec) => (
                  <button
                    key={rec.id}
                    onClick={() => {
                      setCurrentResult(rec);
                      setSelectedCropRule(rec.rankedCrops[0] || null);
                      setShowHistory(false);
                    }}
                    className={`p-3 rounded-xl border text-left text-xs space-y-1 transition-all cursor-pointer ${
                      currentResult?.id === rec.id
                        ? 'border-[#00B879] bg-[#00B879]/15 text-[#F4F7F1] font-medium shadow-[0_0_15px_rgba(0,184,121,0.2)]'
                        : 'border-emerald-500/20 bg-black/40 hover:border-emerald-400/40 text-[#B6F5D9]'
                    }`}
                  >
                    <div className="font-bold text-[#F4F7F1] flex justify-between">
                      <span>{rec.rankedCrops[0]?.cropName || 'Advisory'}</span>
                      <span className="text-[#54F5BC] font-extrabold">{rec.rankedCrops[0]?.suitabilityScore}%</span>
                    </div>
                    <div className="text-[#B6F5D9]/70 text-[11px]">
                      {new Date(rec.timestamp).toLocaleDateString()} · {rec.inputs.season?.toUpperCase() || 'Season unavailable'} · {rec.inputs.soilType}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main 2-Column Responsive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* INPUT WIZARD FORM (COL 5) */}
        <div className="lg:col-span-5">
          <Card variant="glass" className="space-y-5">
            <CardHeader className="pb-3 border-b border-emerald-500/20">
              <CardTitle className="text-lg">Parametric Farm Inputs</CardTitle>
              <CardDescription>
                Deterministic algorithms evaluate these parameters without guessing missing values.
              </CardDescription>
            </CardHeader>

            {errorMessage && (
              <Alert variant="error" className="text-xs">
                {errorMessage}
              </Alert>
            )}

            <form onSubmit={handleGenerate} className="space-y-4">
              <Select
                label="Soil Texture / Classification"
                value={soilType}
                onChange={(e) => setSoilType(e.target.value as SoilType)}
                options={SOIL_OPTIONS.map((s) => ({ value: s, label: s }))}
                error={fieldErrors.soilType}
                required
              />

              <Select
                label="Target Sowing Season"
                value={season}
                onChange={(e) => setSeason(e.target.value as Season)}
                options={SEASON_OPTIONS}
                error={fieldErrors.season}
                required
              />

              <Select
                label="Primary Irrigation Infrastructure"
                value={waterSource}
                onChange={(e) => setWaterSource(e.target.value as WaterSource)}
                options={WATER_SOURCE_OPTIONS.map((w) => ({ value: w, label: w }))}
                error={fieldErrors.waterSource}
                required
              />

              <div className="grid grid-cols-3 gap-2 items-end">
                <div className="col-span-2">
                  <Input
                    label="Land Holding Size"
                    type="number"
                    step="0.1"
                    min="0.1"
                    placeholder="e.g. 3.0"
                    value={landArea}
                    onChange={(e) => setLandArea(e.target.value)}
                    error={fieldErrors.landArea}
                    required
                  />
                </div>
                <div>
                  <Select
                    label="Unit"
                    value={landAreaUnit}
                    onChange={(e) => setLandAreaUnit(e.target.value as 'acres' | 'hectares')}
                    options={[
                      { value: 'acres', label: 'Acres' },
                      { value: 'hectares', label: 'Hectares' },
                    ]}
                  />
                </div>
              </div>

              {/* Collapsible Soil Health Card Values */}
              <div className="pt-2 border-t border-emerald-500/20">
                <button
                  type="button"
                  onClick={() => setShowOptionalLab(!showOptionalLab)}
                  className="flex items-center justify-between w-full text-xs font-semibold text-[#B6F5D9] hover:text-[#54F5BC] py-1 cursor-pointer transition-colors"
                >
                  <span>Optional Soil Health Card Values (pH, N, P, K)</span>
                  {showOptionalLab ? <ChevronUp className="w-4 h-4 text-[#54F5BC]" /> : <ChevronDown className="w-4 h-4 text-[#54F5BC]" />}
                </button>

                {showOptionalLab && (
                  <div className="mt-3 p-3 bg-black/40 rounded-xl border border-emerald-500/20 space-y-3">
                    <p className="text-[11px] text-[#B6F5D9]/70 leading-relaxed">
                      If you have tested your soil through the government Soil Health Card scheme, enter your values to fine-tune matching.
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        label="Soil pH"
                        type="number"
                        step="0.1"
                        placeholder="e.g. 6.8"
                        value={ph}
                        onChange={(e) => setPh(e.target.value)}
                        error={fieldErrors.ph}
                      />
                      <Input
                        label="Nitrogen (kg/ha)"
                        type="number"
                        placeholder="e.g. 240"
                        value={nitrogen}
                        onChange={(e) => setNitrogen(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        label="Phosphorus (kg/ha)"
                        type="number"
                        placeholder="e.g. 18"
                        value={phosphorus}
                        onChange={(e) => setPhosphorus(e.target.value)}
                      />
                      <Input
                        label="Potassium (kg/ha)"
                        type="number"
                        placeholder="e.g. 190"
                        value={potassium}
                        onChange={(e) => setPotassium(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full justify-center shadow-md font-semibold"
                isLoading={isLoading}
              >
                Execute Agronomic Rules Engine
              </Button>
            </form>
          </Card>
        </div>

        {/* RESULTS & WHY THIS RECOMMENDATION PANEL (COL 7) */}
        <div className="lg:col-span-7 space-y-6">
          {!currentResult ? (
            <Card variant="glass" className="text-center py-16 px-6 border-dashed border-emerald-500/25 bg-black/30">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-[#54F5BC] flex items-center justify-center mx-auto mb-3 shadow-[0_0_15px_rgba(84,245,188,0.2)]">
                <Sprout className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#F4F7F1]">Awaiting Farm Inputs</h3>
              <p className="text-xs sm:text-sm text-[#B6F5D9]/80 max-w-md mx-auto mt-1 leading-relaxed">
                Select your soil type, season, and irrigation infrastructure on the left to trigger the deterministic crop suitability engine.
              </p>
            </Card>
          ) : (
            <>
              {/* Highlighted #1 Top Crop Candidate */}
              {currentResult.rankedCrops.length > 0 && (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0D3022]/95 via-[#071B13]/90 to-[#0D3022]/95 text-white border border-emerald-500/35 shadow-[0_12px_35px_rgba(0,0,0,0.45)] space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-[#54F5BC]/20 text-[#54F5BC] border border-[#54F5BC]/30 uppercase tracking-wider">
                      Highest Agronomic Fit · Ranked #1
                    </span>
                    <span className="text-2xl font-black text-[#54F5BC]">
                      {currentResult.rankedCrops[0].suitabilityScore}% Match
                    </span>
                  </div>

                  <div>
                    <h2 className="text-2xl font-extrabold tracking-tight text-[#F4F7F1]">
                      {currentResult.rankedCrops[0].cropName}
                    </h2>
                    <p className="text-xs text-[#B6F5D9]/75 mt-0.5">
                      {currentResult.rankedCrops[0].hindiName} · {currentResult.rankedCrops[0].durationDays}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-emerald-500/20 text-xs">
                    <div className="p-2.5 rounded-xl bg-white/5 border border-emerald-500/20 backdrop-blur-xs">
                      <div className="text-[10px] text-[#B6F5D9]/70 uppercase">Season Cycle</div>
                      <div className="font-bold capitalize text-[#F4F7F1]">{currentResult.inputs.season}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/5 border border-emerald-500/20 backdrop-blur-xs">
                      <div className="text-[10px] text-[#B6F5D9]/70 uppercase">Water Need</div>
                      <div className="font-bold text-[#F4F7F1]">{currentResult.rankedCrops[0].waterRequirement}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/5 border border-emerald-500/20 backdrop-blur-xs col-span-2 sm:col-span-1">
                      <div className="text-[10px] text-[#B6F5D9]/70 uppercase">Soil Match</div>
                      <div className="font-bold truncate text-[#F4F7F1]">{currentResult.inputs.soilType}</div>
                    </div>
                  </div>

                  <p className="text-xs text-[#F4F7F1] leading-relaxed bg-black/40 p-3 rounded-xl border border-emerald-500/20">
                    {currentResult.rankedCrops[0].soilCompatibilityNotes}
                  </p>
                </div>
              )}

              {/* Ranked Candidate Crops Comparison List */}
              <Card variant="glass">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase text-[#54F5BC]">
                          Candidate Comparison
                        </span>
                        <span className="text-xs text-emerald-500/40">·</span>
                        <span className="text-xs text-[#B6F5D9]/60">
                          {new Date(currentResult.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <CardTitle className="text-lg mt-1">
                        All Eligible Crops ({currentResult.rankedCrops.length})
                      </CardTitle>
                    </div>
                  </div>
                  <CardDescription>
                    Select any crop below to review its specific matched audit rules and soil compatibility.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  {currentResult.rankedCrops.map((crop, idx) => {
                    const isSelected = selectedCropRule?.cropName === crop.cropName;
                    return (
                      <div
                        key={crop.cropName}
                        onClick={() => setSelectedCropRule(crop)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#00B879] bg-[#00B879]/15 shadow-[0_0_20px_rgba(0,184,121,0.15)] ring-1 ring-[#00B879]/40'
                            : 'border-emerald-500/20 bg-black/35 hover:border-emerald-400/40 hover:bg-black/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded-lg bg-white/10 text-[#54F5BC] font-bold text-xs flex items-center justify-center border border-emerald-500/20">
                              #{idx + 1}
                            </span>
                            <div>
                              <div className="text-sm sm:text-base font-bold text-[#F4F7F1] flex items-center gap-2">
                                <span>{crop.cropName}</span>
                                <span className="text-xs font-normal text-[#B6F5D9]/70">({crop.hindiName})</span>
                              </div>
                              <div className="text-xs text-[#B6F5D9]/75 mt-0.5 flex flex-wrap items-center gap-1.5">
                                <span>Duration: <strong className="text-[#F4F7F1]">{crop.durationDays}</strong></span>
                                <span className="text-emerald-500/30">·</span>
                                <span>Water: <strong className="text-[#F4F7F1]">{crop.waterRequirement}</strong></span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-base sm:text-lg font-black text-[#54F5BC]">
                              {crop.suitabilityScore}%
                            </div>
                            <span className="text-[10px] uppercase font-bold text-[#B6F5D9]/50 tracking-wider">
                              Suitability
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="mt-3 pt-3 border-t border-emerald-500/20 text-xs text-[#B6F5D9] space-y-1.5 animate-in fade-in duration-150">
                            <div className="font-semibold text-[#54F5BC]">
                              Soil Compatibility Notes:
                            </div>
                            <p className="leading-relaxed bg-black/50 p-2.5 rounded-xl border border-emerald-500/20 text-[#F4F7F1]">
                              {crop.soilCompatibilityNotes}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Matched Rules Audit Log */}
              <Card variant="glass" className="border-t-2 border-t-[#00B879]">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#54F5BC]" />
                    <CardTitle className="text-base text-[#F4F7F1]">
                      Why This Recommendation? (Matched Rules Audit)
                    </CardTitle>
                  </div>
                  <CardDescription className="text-[#B6F5D9]/75">
                    Deterministic agronomic rule codes evaluated for {selectedCropRule?.cropName || 'candidate'}.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(selectedCropRule?.matchedRules || currentResult.matchedRulesSummary).map((rule, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-black/40 border border-emerald-500/20 text-xs text-[#F4F7F1] flex items-start gap-2 shadow-2xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#54F5BC] shrink-0 mt-0.5" />
                      <span className="font-mono text-[#54F5BC] leading-relaxed text-[11px]">{rule}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Gemini Factual Briefing */}
              <Card variant="glass" className="border-emerald-500/30 bg-[#0D3022]/60">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#54F5BC]" />
                    <CardTitle className="text-base text-[#F4F7F1]">
                      Agronomic Plain-Language Briefing
                    </CardTitle>
                  </div>
                  <CardDescription className="text-[#B6F5D9]/80 text-xs">
                    Synthesized from matched rules only. Strictly no invented yields or speculative market prices.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-xs sm:text-sm text-[#F4F7F1] leading-relaxed whitespace-pre-line bg-black/45 p-4 rounded-xl border border-emerald-500/25 shadow-2xs">
                    {currentResult.geminiExplanation}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

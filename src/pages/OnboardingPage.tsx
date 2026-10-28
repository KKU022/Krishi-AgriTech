import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe,
  MapPin,
  Ruler,
  Layers,
  Droplets,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  SkipForward,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { Button } from '../components/common/Button.js';
import { Input } from '../components/common/Input.js';
import { Select } from '../components/common/Select.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/common/Card.js';
import { Alert } from '../components/common/Alert.js';
import { SoilType, WaterSource, Language } from '../types.js';

const INDIAN_STATES_DISTRICTS: Record<string, string[]> = {
  Punjab: ['Ludhiana', 'Amritsar', 'Bathinda', 'Jalandhar', 'Patiala', 'Sangrur', 'Ferozepur'],
  Haryana: ['Karnal', 'Rohtak', 'Hisar', 'Ambala', 'Sirsa', 'Kurukshetra', 'Sonipat'],
  'Uttar Pradesh': ['Lucknow', 'Varanasi', 'Agra', 'Meerut', 'Kanpur', 'Prayagraj', 'Bareilly', 'Aligarh'],
  'Madhya Pradesh': ['Bhopal', 'Indore', 'Ujjain', 'Jabalpur', 'Gwalior', 'Sagar', 'Dewas'],
  Maharashtra: ['Pune', 'Nashik', 'Aurangabad', 'Nagpur', 'Kolhapur', 'Solapur', 'Ahmednagar'],
  Rajasthan: ['Jaipur', 'Kota', 'Jodhpur', 'Bikaner', 'Sri Ganganagar', 'Alwar', 'Bharatpur'],
  Gujarat: ['Ahmedabad', 'Rajkot', 'Surat', 'Anand', 'Vadodara', 'Mehsana', 'Junagadh'],
  Bihar: ['Patna', 'Gaya', 'Muzaffarpur', 'Bhagalpur', 'Darbhanga', 'Samastipur'],
  'West Bengal': ['Purba Bardhaman', 'Hooghly', 'Murshidabad', 'Nadia', 'Malda'],
  'Andhra Pradesh': ['Vijayawada', 'Guntur', 'Kurnool', 'Visakhapatnam', 'West Godavari'],
  Telangana: ['Warangal', 'Karimnagar', 'Nizamabad', 'Nalgonda', 'Khammam'],
  Karnataka: ['Mandya', 'Belagavi', 'Davanagere', 'Mysuru', 'Dharwad', 'Tumakuru'],
  'Tamil Nadu': ['Thanjavur', 'Madurai', 'Coimbatore', 'Tiruchirappalli', 'Salem'],
  Other: ['District Center', 'Regional Sub-division'],
};

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

const WATER_SOURCE_OPTIONS: WaterSource[] = [
  'Rain-fed',
  'Canal Irrigation',
  'Borewell / Tubewell',
  'Drip / Micro-irrigation',
  'Pond / Tank',
  'Other',
];

const INTEREST_OPTIONS = [
  'Cereals & Grains (Wheat, Rice, Maize)',
  'Pulses (Chana, Moong, Urad)',
  'Oilseeds (Mustard, Soybean, Groundnut)',
  'Commercial Crops (Cotton, Sugarcane)',
  'Vegetable & Horticulture Farming',
  'Organic & Natural Farming',
  'Micro-irrigation & Water Conservation',
];

export const OnboardingPage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<number>(user?.profile?.onboardingStep || 1);
  const [language, setLanguage] = useState<Language>(user?.profile?.language || 'en');
  const [state, setState] = useState<string>(user?.profile?.state || 'Punjab');
  const [district, setDistrict] = useState<string>(user?.profile?.district || 'Ludhiana');
  const [landArea, setLandArea] = useState<string>(user?.profile?.landArea ? String(user?.profile.landArea) : '3.5');
  const [landAreaUnit, setLandAreaUnit] = useState<'acres' | 'hectares'>(user?.profile?.landAreaUnit || 'acres');
  const [soilType, setSoilType] = useState<SoilType>(user?.profile?.soilType || 'Alluvial Soil');
  const [waterSource, setWaterSource] = useState<WaterSource>(user?.profile?.waterSource || 'Canal Irrigation');
  const [interests, setInterests] = useState<string[]>(
    user?.profile?.farmingInterests || ['Cereals & Grains (Wheat, Rice, Maize)']
  );

  const [error, setError] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const availableDistricts = INDIAN_STATES_DISTRICTS[state] || INDIAN_STATES_DISTRICTS['Other'];

  const toggleInterest = (item: string) => {
    setInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const saveProgress = async (nextStep: number, isFinal = false) => {
    setIsSaving(true);
    setError('');

    try {
      await updateProfile({
        language,
        state,
        district,
        landArea: landArea ? parseFloat(landArea) : undefined,
        landAreaUnit,
        soilType,
        waterSource,
        farmingInterests: interests,
        onboardingStep: nextStep,
        onboardingCompleted: isFinal,
      });

      if (isFinal) {
        toast.success('Onboarding completed', 'Your farm profile has been saved. Welcome to AgriTech!');
        navigate('/dashboard');
      } else {
        toast.info(`Step ${step} saved`, 'Your farm parameters were recorded.');
        setStep(nextStep);
      }
    } catch (err: any) {
      const msg = err.message || 'Failed to save progress. Please retry.';
      setError(msg);
      toast.error('Save failed', msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      saveProgress(2);
    } else if (step === 2) {
      if (!state.trim() || !district.trim()) {
        setError('State and District are required to calibrate regional crop and weather models.');
        return;
      }
      saveProgress(3);
    } else if (step === 3) {
      saveProgress(4);
    } else if (step === 4) {
      saveProgress(5);
    } else if (step === 5) {
      saveProgress(5, true);
    }
  };

  const handleSkip = () => {
    if (step === 1 || step === 2) return;
    if (step < 5) {
      saveProgress(step + 1);
    } else {
      saveProgress(5, true);
    }
  };

  const stepTitles = [
    'Language',
    'Location',
    'Land Size',
    'Soil Type',
    'Water & Focus',
  ];

  return (
    <div className="min-h-[85vh] py-8 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto">
      {/* 5-Step Visual Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-semibold text-[#B6F5D9] uppercase tracking-wider mb-2">
          <span>Step {step} of 5 · {stepTitles[step - 1]}</span>
          <span className="text-[#54F5BC] font-bold">{Math.round((step / 5) * 100)}% Complete</span>
        </div>
        <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
          <div
            className="bg-[#00B879] h-full transition-all duration-300 shadow-[0_0_10px_rgba(0,184,121,0.5)]"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>

        {/* Step indicator pills */}
        <div className="flex justify-between mt-3 px-1">
          {stepTitles.map((t, idx) => {
            const num = idx + 1;
            const isCompleted = num < step;
            const isCurrent = num === step;
            return (
              <div key={t} className="flex flex-col items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCompleted
                      ? 'bg-[#00B879] text-[#071B13]'
                      : isCurrent
                      ? 'bg-[#54F5BC] text-[#071B13] ring-2 ring-[#00B879] shadow-[0_0_10px_rgba(84,245,188,0.4)]'
                      : 'bg-white/10 text-[#B6F5D9]/50 border border-emerald-500/10'
                  }`}
                >
                  {isCompleted ? '✓' : num}
                </div>
                <span className="hidden sm:inline-block text-[10px] text-[#B6F5D9]/70 mt-1">
                  {t}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <Card variant="glass" className="shadow-lg border-emerald-500/25">
        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        {/* STEP 1: LANGUAGE (REQUIRED) */}
        {step === 1 && (
          <div className="space-y-6">
            <CardHeader>
              <div className="w-10 h-10 rounded-xl bg-[#00B879]/20 border border-[#00B879]/30 text-[#54F5BC] flex items-center justify-center mb-2">
                <Globe className="w-5 h-5" />
              </div>
              <CardTitle className="text-[#F4F7F1]">Select Preferred Advisory Language</CardTitle>
              <CardDescription className="text-[#B6F5D9]/75">
                AgriTech will deliver crop explanations, disease analyses, and assistant advice in your chosen language. (Required)
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`p-5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    language === 'en'
                      ? 'border-[#00B879] bg-[#00B879]/15 text-[#F4F7F1] shadow-[0_0_15px_rgba(0,184,121,0.2)]'
                      : 'border-emerald-500/20 bg-black/40 hover:border-emerald-400/40 text-[#B6F5D9]'
                  }`}
                >
                  <div className="font-bold text-lg text-[#F4F7F1]">English</div>
                  <div className="text-xs text-[#B6F5D9]/70 mt-1">
                    Standard agronomic terms, measurements, and weather notifications in English.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setLanguage('hi')}
                  className={`p-5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    language === 'hi'
                      ? 'border-[#00B879] bg-[#00B879]/15 text-[#F4F7F1] shadow-[0_0_15px_rgba(0,184,121,0.2)]'
                      : 'border-emerald-500/20 bg-black/40 hover:border-emerald-400/40 text-[#B6F5D9]'
                  }`}
                >
                  <div className="font-bold text-lg text-[#F4F7F1]">हिंदी (Hindi)</div>
                  <div className="text-xs text-[#B6F5D9]/70 mt-1">
                    फसल सलाह, रोग निदान और मौसम की जानकारी सरल हिंदी में।
                  </div>
                </button>
              </div>
            </CardContent>
          </div>
        )}

        {/* STEP 2: LOCATION (REQUIRED) */}
        {step === 2 && (
          <div className="space-y-6">
            <CardHeader>
              <div className="w-10 h-10 rounded-xl bg-[#00B879]/20 border border-[#00B879]/30 text-[#54F5BC] flex items-center justify-center mb-2">
                <MapPin className="w-5 h-5" />
              </div>
              <CardTitle className="text-[#F4F7F1]">Where is Your Farm Located?</CardTitle>
              <CardDescription className="text-[#B6F5D9]/75">
                Location calibrates regional sowing calendars and connects to the nearest Open-Meteo microclimate telemetry station. (Required)
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <Select
                  label="State"
                  value={state}
                  onChange={(e) => {
                    const newState = e.target.value;
                    setState(newState);
                    setDistrict(INDIAN_STATES_DISTRICTS[newState]?.[0] || 'District Center');
                  }}
                  options={Object.keys(INDIAN_STATES_DISTRICTS).map((s) => ({ value: s, label: s }))}
                  required
                />

                <Select
                  label="District"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  options={availableDistricts.map((d) => ({ value: d, label: d }))}
                  required
                />
              </div>
            </CardContent>
          </div>
        )}

        {/* STEP 3: LAND AREA (SKIPPABLE) */}
        {step === 3 && (
          <div className="space-y-6">
            <CardHeader>
              <div className="w-10 h-10 rounded-xl bg-[#00B879]/20 border border-[#00B879]/30 text-[#54F5BC] flex items-center justify-center mb-2">
                <Ruler className="w-5 h-5" />
              </div>
              <CardTitle className="text-[#F4F7F1]">What is Your Operational Land Area?</CardTitle>
              <CardDescription className="text-[#B6F5D9]/75">
                Helps calculate input requirements and scale feasibility. You can skip this step or modify it anytime.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div className="sm:col-span-2">
                  <Input
                    label="Land Holding Size"
                    type="number"
                    step="0.1"
                    min="0.1"
                    placeholder="e.g. 4.5"
                    value={landArea}
                    onChange={(e) => setLandArea(e.target.value)}
                  />
                </div>
                <div>
                  <Select
                    label="Unit"
                    value={landAreaUnit}
                    onChange={(e) => setLandAreaUnit(e.target.value as 'acres' | 'hectares')}
                    options={[
                      { value: 'acres', label: 'Acres (एकड़)' },
                      { value: 'hectares', label: 'Hectares (हेक्टेयर)' },
                    ]}
                  />
                </div>
              </div>
            </CardContent>
          </div>
        )}

        {/* STEP 4: SOIL TYPE (SKIPPABLE) */}
        {step === 4 && (
          <div className="space-y-6">
            <CardHeader>
              <div className="w-10 h-10 rounded-xl bg-[#00B879]/20 border border-[#00B879]/30 text-[#54F5BC] flex items-center justify-center mb-2">
                <Layers className="w-5 h-5" />
              </div>
              <CardTitle className="text-[#F4F7F1]">Primary Soil Classification</CardTitle>
              <CardDescription className="text-[#B6F5D9]/75">
                Soil texture informs crop root anchorage, water retention, and fertilizer leaching risks.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SOIL_OPTIONS.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setSoilType(st)}
                    className={`p-3.5 rounded-xl border text-left text-sm font-medium transition-all cursor-pointer ${
                      soilType === st
                        ? 'border-[#00B879] bg-[#00B879]/15 text-[#F4F7F1] font-semibold shadow-[0_0_12px_rgba(0,184,121,0.2)]'
                        : 'border-emerald-500/20 bg-black/40 hover:border-emerald-400/40 text-[#B6F5D9]'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </CardContent>
          </div>
        )}

        {/* STEP 5: WATER SOURCE & INTERESTS (SKIPPABLE) */}
        {step === 5 && (
          <div className="space-y-6">
            <CardHeader>
              <div className="w-10 h-10 rounded-xl bg-[#00B879]/20 border border-[#00B879]/30 text-[#54F5BC] flex items-center justify-center mb-2">
                <Droplets className="w-5 h-5" />
              </div>
              <CardTitle className="text-[#F4F7F1]">Water Source & Farming Focus</CardTitle>
              <CardDescription className="text-[#B6F5D9]/75">
                Ensures we only recommend crops matching your irrigation capacity.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-[#B6F5D9] mb-2">
                  Primary Irrigation / Water Source
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {WATER_SOURCE_OPTIONS.map((ws) => (
                    <button
                      key={ws}
                      type="button"
                      onClick={() => setWaterSource(ws)}
                      className={`p-3 rounded-xl border text-left text-sm font-medium transition-all cursor-pointer ${
                        waterSource === ws
                          ? 'border-[#00B879] bg-[#00B879]/15 text-[#F4F7F1] font-semibold shadow-[0_0_12px_rgba(0,184,121,0.2)]'
                          : 'border-emerald-500/20 bg-black/40 text-[#B6F5D9] hover:border-emerald-400/40'
                      }`}
                    >
                      {ws}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#B6F5D9] mb-2">
                  Key Farming Interests (Select all that apply)
                </label>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_OPTIONS.map((item) => {
                    const isSelected = interests.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleInterest(item)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#00B879] text-[#071B13] font-bold border-[#00B879] shadow-xs'
                            : 'bg-black/40 text-[#B6F5D9] border-emerald-500/20 hover:border-emerald-400/40'
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </div>
        )}

        <CardFooter className="flex items-center justify-between">
          <div>
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setStep(step - 1)}
                disabled={isSaving}
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step >= 3 && (
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={handleSkip}
                disabled={isSaving}
                title="Skip this step and proceed"
              >
                <SkipForward className="w-4 h-4 mr-1" /> Skip
              </Button>
            )}

            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleNext}
              isLoading={isSaving}
            >
              {step === 5 ? 'Complete Onboarding' : 'Save & Continue'}
              {step < 5 && <ArrowRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

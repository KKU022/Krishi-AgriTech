import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  MapPin,
  Globe,
  Ruler,
  Layers,
  Droplets,
  Save,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/common/Card.js';
import { PageHeader } from '../components/common/PageHeader.js';
import { Button } from '../components/common/Button.js';
import { Input } from '../components/common/Input.js';
import { Select } from '../components/common/Select.js';
import { Alert } from '../components/common/Alert.js';
import { Modal } from '../components/common/Modal.js';
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
  'West Bengal': ['Purba Bardhaman', 'Hooghly', 'Murshintabad', 'Nadia', 'Malda'],
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

export const ProfilePage: React.FC = () => {
  const { user, updateProfile, deleteAccount } = useAuth();
  const navigate = useNavigate();

  const [language, setLanguage] = useState<Language>(user?.profile?.language || 'en');
  const [state, setState] = useState<string>(user?.profile?.state || 'Punjab');
  const [district, setDistrict] = useState<string>(user?.profile?.district || 'Ludhiana');
  const [landArea, setLandArea] = useState<string>(user?.profile?.landArea ? String(user?.profile.landArea) : '');
  const [landAreaUnit, setLandAreaUnit] = useState<'acres' | 'hectares'>(user?.profile?.landAreaUnit || 'acres');
  const [soilType, setSoilType] = useState<SoilType>(user?.profile?.soilType || 'Alluvial Soil');
  const [waterSource, setWaterSource] = useState<WaterSource>(user?.profile?.waterSource || 'Canal Irrigation');
  const [interests, setInterests] = useState<string[]>(user?.profile?.farmingInterests || []);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const availableDistricts = INDIAN_STATES_DISTRICTS[state] || INDIAN_STATES_DISTRICTS['Other'];

  const toggleInterest = (item: string) => {
    setInterests((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const toast = useToast();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMessage('');

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
      });
      setSaveSuccess(true);
      toast.success('Profile saved', 'Your regional farm parameters and crop preferences have been updated.');
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      const msg = err.message || 'Failed to update farm profile.';
      setErrorMessage(msg);
      toast.error('Profile update failed', msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteData = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount();
      navigate('/');
    } catch (err: any) {
      setErrorMessage('Failed to delete account data.');
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <PageHeader
        badge="Account & Telemetry Preferences"
        title="Farmer Profile & Settings"
        description="Update your agro-climatic profile and manage data retention rights."
      />

      {saveSuccess && (
        <Alert variant="success">
          Your farm profile and regional parameters have been saved successfully!
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="error">
          {errorMessage}
        </Alert>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Account Details Card */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-lg text-[#F4F7F1]">Account Credentials</CardTitle>
            <CardDescription className="text-[#B6F5D9]/75">Primary identification details</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={user?.fullName || ''}
              disabled
              helperText="Managed during account registration"
            />
            <Input
              label="Registered Email"
              value={user?.email || ''}
              disabled
              helperText="Used for session authentication"
            />
          </CardContent>
        </Card>

        {/* Farm & Agronomic Settings */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="text-lg text-[#F4F7F1]">Agronomic Field Parameters</CardTitle>
            <CardDescription className="text-[#B6F5D9]/75">
              These values calibrate the deterministic rules engine and weather microclimate models.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Preferred Language */}
            <div>
              <label className="block text-sm font-semibold text-[#B6F5D9] mb-1.5 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-[#54F5BC]" />
                <span>Preferred Advisory Language</span>
              </label>
              <div className="grid grid-cols-2 gap-3 max-w-sm">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`py-2 px-3 rounded-xl border text-sm font-medium transition-colors cursor-pointer ${
                    language === 'en'
                      ? 'border-[#00B879] bg-[#00B879]/15 text-[#54F5BC] font-bold shadow-[0_0_12px_rgba(0,184,121,0.2)]'
                      : 'border-emerald-500/20 bg-black/40 text-[#B6F5D9] hover:border-emerald-400/40'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('hi')}
                  className={`py-2 px-3 rounded-xl border text-sm font-medium transition-colors cursor-pointer ${
                    language === 'hi'
                      ? 'border-[#00B879] bg-[#00B879]/15 text-[#54F5BC] font-bold shadow-[0_0_12px_rgba(0,184,121,0.2)]'
                      : 'border-emerald-500/20 bg-black/40 text-[#B6F5D9] hover:border-emerald-400/40'
                  }`}
                >
                  हिंदी (Hindi)
                </button>
              </div>
            </div>

            {/* State and District */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            {/* Land Area */}
            <div className="grid grid-cols-3 gap-3 items-end">
              <div className="col-span-2">
                <Input
                  label="Operational Land Area"
                  type="number"
                  step="0.1"
                  min="0.1"
                  placeholder="e.g. 4.0"
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

            {/* Soil Type and Water Source */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Soil Type"
                value={soilType}
                onChange={(e) => setSoilType(e.target.value as SoilType)}
                options={SOIL_OPTIONS.map((s) => ({ value: s, label: s }))}
              />

              <Select
                label="Water Source"
                value={waterSource}
                onChange={(e) => setWaterSource(e.target.value as WaterSource)}
                options={WATER_SOURCE_OPTIONS.map((w) => ({ value: w, label: w }))}
              />
            </div>

            {/* Farming Interests */}
            <div>
              <label className="block text-sm font-semibold text-[#B6F5D9] mb-2">
                Farming Interests & Focus
              </label>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((item) => {
                  const isSelected = interests.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => toggleInterest(item)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#00B879] text-[#071B13] font-bold border-[#00B879]'
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

          <CardFooter>
            <Button type="submit" variant="primary" isLoading={isSaving} icon={<Save className="w-4 h-4" />}>
              Save Profile Changes
            </Button>
          </CardFooter>
        </Card>
      </form>

      {/* DATA PRIVACY & PURGE CARD (STRICT REQUIREMENT) */}
      <Card variant="glass" className="border-rose-500/30 bg-rose-950/20">
        <CardHeader>
          <div className="flex items-center gap-2 text-rose-300">
            <Trash2 className="w-5 h-5 text-rose-400" />
            <CardTitle className="text-lg text-rose-200">Data Privacy & Account Purge</CardTitle>
          </div>
          <CardDescription className="text-rose-300/80">
            Exercise your right to be forgotten. Permanently removes your farmer profile, crop recommendations, leaf scans, and assistant conversations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-rose-200/70 leading-relaxed">
            AgriTech stores data under your user ID only. Once purged, your records cannot be restored.
          </p>
        </CardContent>
        <CardFooter>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
            icon={<Trash2 className="w-4 h-4" />}
          >
            Delete My Data & Account
          </Button>
        </CardFooter>
      </Card>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Permanently Delete All Farm Data?"
        description="This action is irreversible and purges all records immediately."
      >
        <div className="space-y-4">
          <div className="p-3 bg-rose-950/50 rounded-xl border border-rose-500/30 text-xs text-rose-200 flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="text-rose-300">Warning: </strong> All crop recommendation histories, plant disease diagnosis logs, weather configurations, and chat messages associated with <strong>{user?.email}</strong> will be erased from the database.
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-emerald-500/20">
            <Button
              type="button"
              variant="glass"
              size="sm"
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleDeleteData}
              isLoading={isDeleting}
            >
              Confirm & Purge All Data
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

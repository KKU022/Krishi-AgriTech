import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Plus,
  CheckCircle2,
  Trash2,
  Layers,
  Droplets,
  Sprout,
  Compass,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { apiRequest } from '../lib/api.js';
import { Farm } from '../types.js';
import { Card } from '../components/common/Card.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { Modal } from '../components/common/Modal.js';
import { Input } from '../components/common/Input.js';
import { Select } from '../components/common/Select.js';
import { PageHeader } from '../components/common/PageHeader.js';
import { EmptyState } from '../components/common/EmptyState.js';
import { SkeletonCard, SkeletonStat } from '../components/common/Skeleton.js';

export const FarmsPage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { addToast } = useToast();
  const lang = user?.profile?.language || 'en';

  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form State
  const [name, setName] = useState<string>('');
  const [state, setState] = useState<string>(user?.profile?.state || 'Madhya Pradesh');
  const [district, setDistrict] = useState<string>(user?.profile?.district || 'Indore');
  const [size, setSize] = useState<string>('5');
  const [sizeUnit, setSizeUnit] = useState<'acres' | 'hectares'>('acres');
  const [soilType, setSoilType] = useState<string>(user?.profile?.soilType || 'Black Soil (Regur)');
  const [waterSource, setWaterSource] = useState<string>(user?.profile?.waterSource || 'Borewell');
  const [primaryCrops, setPrimaryCrops] = useState<string>('Wheat, Soybean');

  const fetchFarms = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<{ farms: Farm[] }>('/farms');
      setFarms(res.farms || []);
    } catch (err: any) {
      console.warn('Error loading farms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarms();
  }, []);

  const handleSetActive = async (farmId: string) => {
    try {
      await updateProfile({ activeFarmId: farmId });
      addToast({
        title: lang === 'hi' ? 'सक्रिय खेत बदला गया' : 'Active Farm Updated',
        message: lang === 'hi' ? 'अब सभी सिफारिशें और मौसम इस खेत पर आधारित हैं।' : 'Advisories are now synchronized with this parcel.',
        type: 'success',
      });
    } catch {
      addToast({
        title: lang === 'hi' ? 'त्रुटि' : 'Update Failed',
        message: 'Could not switch active farm.',
        type: 'error',
      });
    }
  };

  const handleCreateFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast({ title: 'Validation', message: 'Farm name is required.', type: 'warning' });
      return;
    }

    try {
      setIsSubmitting(true);
      const cropsArray = primaryCrops.split(',').map((c) => c.trim()).filter(Boolean);

      const created = await apiRequest<Farm>('/farms', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          state,
          district,
          size: parseFloat(size) || 1,
          sizeUnit,
          soilType,
          waterSource,
          primaryCrops: cropsArray,
        }),
      });

      addToast({
        title: lang === 'hi' ? 'खेत पंजीकृत किया गया' : 'Farm Parcel Registered',
        message: `${created.name} (${created.size} ${created.sizeUnit}) added to your digital registry.`,
        type: 'success',
      });

      setIsModalOpen(false);
      setName('');
      fetchFarms();
    } catch (err: any) {
      addToast({
        title: 'Error',
        message: err.message || 'Failed to create farm parcel.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFarm = async (farmId: string, farmName: string) => {
    if (!window.confirm(`Are you sure you want to remove parcel "${farmName}"?`)) return;

    try {
      await apiRequest(`/farms/${farmId}`, { method: 'DELETE' });

      addToast({
        title: 'Parcel Removed',
        message: `${farmName} was deleted from records.`,
        type: 'info',
      });

      setFarms((prev) => prev.filter((f) => f.id !== farmId));
    } catch (err: any) {
      addToast({ title: 'Error', message: 'Failed to delete farm parcel.', type: 'error' });
    }
  };

  const totalAcres = farms.reduce((acc, f) => {
    const acres = f.sizeUnit === 'hectares' ? f.size * 2.47105 : f.size;
    return acc + acres;
  }, 0);

  const activeFarmId = user?.profile?.activeFarmId || farms[0]?.id;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Page Header */}
      <PageHeader
        badge={lang === 'hi' ? 'भूमि व जोत प्रबंधन' : 'Multi-Parcel Landholding Registry'}
        title={lang === 'hi' ? 'मेरे खेत व भूखंड' : 'My Farm Parcels'}
        description={
          lang === 'hi'
            ? 'अपने सभी खेतों को पंजीकृत करें और प्रत्येक भूखंड के लिए विशिष्ट फसल योजना व मिट्टी परीक्षण सहेजें।'
            : 'Manage multiple plots, link specific soil profiles, and switch active parcels for tailored advisories.'
        }
        actions={
          <Button
            onClick={() => setIsModalOpen(true)}
            variant="primary"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'hi' ? 'नया खेत जोड़ें' : 'Add Farm Parcel'}</span>
          </Button>
        }
      />

      {/* 2. Aggregate Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading ? (
          <>
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
          </>
        ) : (
          <>
            <Card variant="emerald-glass" padding="md" className="flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#B6F5D9]/80">
                  {lang === 'hi' ? 'कुल पंजीकृत खेत' : 'Registered Plots'}
                </div>
                <div className="text-3xl font-black font-display text-white mt-1.5 tabular-nums tracking-tight">
                  {farms.length}
                </div>
              </div>
              <div className="text-xs text-[#A3B5AA] mt-2">
                {lang === 'hi' ? 'अलग-अलग भूखंड' : 'Distinct agricultural parcels'}
              </div>
            </Card>

            <Card variant="emerald-glass" padding="md" className="flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#B6F5D9]/80">
                  {lang === 'hi' ? 'कुल जोत रकबा' : 'Total Landholding'}
                </div>
                <div className="text-3xl font-black font-display text-[#54F5BC] mt-1.5 tabular-nums tracking-tight">
                  {totalAcres.toFixed(1)} <span className="text-sm font-semibold text-[#A3B5AA]">Acres</span>
                </div>
              </div>
              <div className="text-xs text-[#A3B5AA] mt-2 tabular-nums">
                ≈ {(totalAcres / 2.47105).toFixed(1)} Hectares
              </div>
            </Card>

            <Card variant="emerald-glass" padding="md" className="flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#B6F5D9]/80">
                  {lang === 'hi' ? 'सक्रिय भूखंड' : 'Active Workspace'}
                </div>
                <div className="text-xl font-bold font-display text-white mt-1.5 truncate">
                  {farms.find((f) => f.id === activeFarmId)?.name || (lang === 'hi' ? 'डिफ़ॉल्ट खेत' : 'Primary Parcel')}
                </div>
              </div>
              <div className="text-xs text-[#54F5BC] font-semibold mt-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{lang === 'hi' ? 'सिफारिशों से जुड़ा' : 'Live Syncing Advisories'}</span>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* 3. Farm Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : farms.length === 0 ? (
        <Card variant="emerald-glass" padding="lg">
          <EmptyState
            icon={<Layers className="w-8 h-8 text-[#54F5BC]" />}
            title={lang === 'hi' ? 'कोई खेत पंजीकृत नहीं है' : 'No Farm Parcels Registered Yet'}
            description={
              lang === 'hi'
                ? 'अपनी जोत, मिट्टी का प्रकार और सिंचाई साधन जोड़ें ताकि हम सटीक वैज्ञानिक सलाह दे सकें।'
                : 'Add your primary field plot to track soil health, schedule irrigation, and plan crop rotations.'
            }
            action={
              <Button onClick={() => setIsModalOpen(true)} variant="primary">
                <Plus className="w-4 h-4 mr-1.5" />
                {lang === 'hi' ? 'पहला खेत जोड़ें' : 'Register First Parcel'}
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {farms.map((farm) => {
            const isActive = farm.id === activeFarmId;
            return (
              <Card
                key={farm.id}
                variant={isActive ? 'elevated' : 'spotlight'}
                padding="lg"
                className={`flex flex-col justify-between transition-all duration-300 relative ${
                  isActive ? 'border-[#00B879] ring-2 ring-[#00B879]/30 shadow-[0_0_30px_rgba(0,184,121,0.2)]' : 'hover:border-emerald-500/40'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold font-display text-white tracking-tight">{farm.name}</h3>
                        {isActive && (
                          <Badge variant="accent" size="sm">
                            {lang === 'hi' ? 'सक्रिय' : 'Active'}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[#A3B5AA] mt-1">
                        <MapPin className="w-3.5 h-3.5 text-[#54F5BC]" />
                        <span>
                          {farm.district}, {farm.state}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-black font-display text-[#54F5BC] tabular-nums">
                        {farm.size}{' '}
                        <span className="text-xs font-semibold text-[#A3B5AA] uppercase">{farm.sizeUnit}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 my-4 pt-3 border-t border-white/10 text-xs">
                    <div className="bg-black/35 p-3 rounded-2xl border border-white/10">
                      <span className="text-[#A3B5AA] font-medium block mb-0.5">
                        {lang === 'hi' ? 'मिट्टी का प्रकार' : 'Soil Profile'}
                      </span>
                      <span className="font-semibold text-white">{farm.soilType}</span>
                    </div>

                    <div className="bg-black/35 p-3 rounded-2xl border border-white/10">
                      <span className="text-[#A3B5AA] font-medium block mb-0.5">
                        {lang === 'hi' ? 'सिंचाई साधन' : 'Water Supply'}
                      </span>
                      <span className="font-semibold text-white">{farm.waterSource}</span>
                    </div>
                  </div>

                  {farm.primaryCrops && farm.primaryCrops.length > 0 && (
                    <div className="mb-4">
                      <span className="text-[11px] font-semibold text-[#A3B5AA] uppercase tracking-wider block mb-1.5">
                        {lang === 'hi' ? 'मुख्य फसलें' : 'Primary Crops'}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {farm.primaryCrops.map((crop, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 text-xs font-medium rounded-xl bg-emerald-500/15 text-[#54F5BC] border border-emerald-400/30"
                          >
                            {crop}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  {isActive ? (
                    <span className="text-xs font-semibold text-[#54F5BC] flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{lang === 'hi' ? 'वर्तमान में सक्रिय' : 'Currently Active'}</span>
                    </span>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleSetActive(farm.id)}
                      className="text-xs"
                    >
                      {lang === 'hi' ? 'सक्रिय बनाएं' : 'Set as Active'}
                    </Button>
                  )}

                  <button
                    onClick={() => handleDeleteFarm(farm.id, farm.name)}
                    className="p-2 text-[#A3B5AA] hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
                    title="Delete farm parcel"
                    aria-label={`Delete parcel ${farm.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal: Add New Farm */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={lang === 'hi' ? 'नया खेत पंजीकृत करें' : 'Register New Farm Parcel'}
      >
        <form onSubmit={handleCreateFarm} className="space-y-4 pt-2">
          <Input
            label={lang === 'hi' ? 'खेत का नाम (पहचान)' : 'Parcel Name / Identifier'}
            placeholder="e.g. North Plot - Tube Well Side"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={lang === 'hi' ? 'राज्य' : 'State'}
              value={state}
              onChange={(e) => setState(e.target.value)}
              required
            />
            <Input
              label={lang === 'hi' ? 'ज़िला' : 'District'}
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={lang === 'hi' ? 'रकबा (क्षेत्रफल)' : 'Area Size'}
              type="number"
              step="0.1"
              min="0.1"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              required
            />
            <Select
              label={lang === 'hi' ? 'इकाई' : 'Unit'}
              value={sizeUnit}
              onChange={(e) => setSizeUnit(e.target.value as any)}
              options={[
                { value: 'acres', label: 'Acres (एकड़)' },
                { value: 'hectares', label: 'Hectares (हेक्टेयर)' },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label={lang === 'hi' ? 'मिट्टी का प्रकार' : 'Soil Profile'}
              value={soilType}
              onChange={(e) => setSoilType(e.target.value)}
              options={[
                { value: 'Black Soil (Regur)', label: 'Black Soil (काली मिट्टी)' },
                { value: 'Alluvial Soil', label: 'Alluvial Soil (जलोढ़ मिट्टी)' },
                { value: 'Red and Yellow Soil', label: 'Red & Yellow (लाल मिट्टी)' },
                { value: 'Laterite Soil', label: 'Laterite Soil (लेटराइट)' },
                { value: 'Sandy Loam', label: 'Sandy Loam (बलुई दोमट)' },
                { value: 'Clayey Soil', label: 'Clayey Soil (चिकनी मिट्टी)' },
              ]}
            />

            <Select
              label={lang === 'hi' ? 'सिंचाई साधन' : 'Water Supply'}
              value={waterSource}
              onChange={(e) => setWaterSource(e.target.value)}
              options={[
                { value: 'Borewell', label: 'Borewell (नलकूप)' },
                { value: 'Canal Irrigation', label: 'Canal (नहर)' },
                { value: 'Drip / Micro Irrigation', label: 'Drip System (टपक सिंचाई)' },
                { value: 'Rainfed', label: 'Rainfed (वर्षा आधारित)' },
                { value: 'River / Pond Lift', label: 'River / Farm Pond (तालाब)' },
              ]}
            />
          </div>

          <Input
            label={lang === 'hi' ? 'मुख्य फसलें (अल्पविराम से अलग करें)' : 'Primary Crops (comma separated)'}
            placeholder="e.g. Wheat, Gram, Mustard"
            value={primaryCrops}
            onChange={(e) => setPrimaryCrops(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              {lang === 'hi' ? 'खेत सहेजें' : 'Save Parcel'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

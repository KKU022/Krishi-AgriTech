import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  FlaskConical,
  Plus,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Info,
  Calendar,
  FileText,
  Trash2,
  Activity,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { apiRequest } from '../lib/api.js';
import { SoilTest, Farm } from '../types.js';
import { Button } from '../components/common/Button.js';
import { PageHeader } from '../components/common/PageHeader.js';
import { Badge } from '../components/common/Badge.js';
import { Modal } from '../components/common/Modal.js';
import { Input } from '../components/common/Input.js';
import { Select } from '../components/common/Select.js';

export const SoilHealthPage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const lang = user?.profile?.language || 'en';

  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>('all');
  const [tests, setTests] = useState<SoilTest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form State
  const [farmId, setFarmId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isLabTest, setIsLabTest] = useState<boolean>(true);
  const [labName, setLabName] = useState<string>('Krishi Vigyan Kendra (KVK) Laboratory');
  const [sampleDepthCm, setSampleDepthCm] = useState<string>('15');
  const [ph, setPh] = useState<string>('7.2');
  const [nitrogen, setNitrogen] = useState<string>('240');
  const [nitrogenLevel, setNitrogenLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [phosphorus, setPhosphorus] = useState<string>('18');
  const [phosphorusLevel, setPhosphorusLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [potassium, setPotassium] = useState<string>('260');
  const [potassiumLevel, setPotassiumLevel] = useState<'low' | 'medium' | 'high'>('high');
  const [organicCarbonPercent, setOrganicCarbonPercent] = useState<string>('0.65');
  const [electricalConductivity, setElectricalConductivity] = useState<string>('0.45');
  const [notes, setNotes] = useState<string>('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [farmsRes, testsRes] = await Promise.all([
        apiRequest<{ farms: Farm[] }>('/farms'),
        apiRequest<{ tests: SoilTest[] }>('/soil-tests'),
      ]);
      const loadedFarms = farmsRes.farms || [];
      setFarms(loadedFarms);
      setTests(testsRes.tests || []);

      if (loadedFarms.length > 0 && !farmId) {
        setFarmId(loadedFarms[0].id);
      }
    } catch (err: any) {
      console.warn('Error loading soil health data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!farmId || !date || !ph) {
      addToast({ title: 'Validation', message: 'Farm parcel, date, and pH are required.', type: 'warning' });
      return;
    }

    try {
      setIsSubmitting(true);
      const newTest = await apiRequest<SoilTest>('/soil-tests', {
        method: 'POST',
        body: JSON.stringify({
          farmId,
          date,
          isLabTest,
          labName: isLabTest ? labName : 'On-Field Rapid Kit',
          sampleDepthCm: parseFloat(sampleDepthCm) || 15,
          ph: parseFloat(ph) || 7.0,
          nitrogen: parseFloat(nitrogen) || undefined,
          nitrogenLevel,
          phosphorus: parseFloat(phosphorus) || undefined,
          phosphorusLevel,
          potassium: parseFloat(potassium) || undefined,
          potassiumLevel,
          organicCarbonPercent: parseFloat(organicCarbonPercent) || undefined,
          electricalConductivity: parseFloat(electricalConductivity) || undefined,
          notes,
        }),
      });

      addToast({
        title: lang === 'hi' ? 'मृदा परीक्षण दर्ज किया गया' : 'Soil Test Logged',
        message: `Soil test for ${date} recorded with scientific recommendations.`,
        type: 'success',
      });

      setTests((prev) => [newTest, ...prev]);
      setModalOpen(false);
      setNotes('');
    } catch (err: any) {
      addToast({ title: 'Error', message: 'Failed to record soil health report.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTest = async (id: string) => {
    if (!window.confirm('Delete this soil health record?')) return;
    try {
      await apiRequest(`/soil-tests/${id}`, { method: 'DELETE' });
      setTests((prev) => prev.filter((t) => t.id !== id));
      addToast({ title: 'Removed', message: 'Soil test deleted.', type: 'info' });
    } catch {
      addToast({ title: 'Error', message: 'Failed to delete record.', type: 'error' });
    }
  };

  const filteredTests = tests.filter((t) => selectedFarmId === 'all' || t.farmId === selectedFarmId);
  const latestTest = filteredTests[0];

  const getPhAssessment = (val: number) => {
    if (val < 6.0) return { label: 'Acidic (अम्लीय)', color: 'text-rose-400', bg: 'bg-rose-950/40 border-rose-500/30' };
    if (val > 8.0) return { label: 'Alkaline (क्षारीय)', color: 'text-amber-400', bg: 'bg-amber-950/40 border-amber-500/30' };
    return { label: 'Optimal / Neutral (अनुकूल)', color: 'text-[#54F5BC]', bg: 'bg-emerald-950/40 border-emerald-500/30' };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <PageHeader
        badge={lang === 'hi' ? 'मृदा स्वास्थ्य कार्ड एवं पोषक तत्व विश्लेषण' : 'Soil Health Card & Nutrient Diagnostics'}
        title={lang === 'hi' ? 'मिट्टी की सेहत व NPK स्तर' : 'Soil Health & NPK Tracker'}
        description={
          lang === 'hi'
            ? 'सरकारी प्रयोगशाला (KVK) व क्षेत्रीय मिट्टी परीक्षण रिपोर्ट दर्ज करें और उर्वरक संतुलित करें।'
            : 'Record official laboratory soil test certificates and field kit readings to prevent nutrient depletion.'
        }
        action={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setModalOpen(true)}
            icon={<Plus className="w-4 h-4 text-[#071B13]" />}
          >
            <span>{lang === 'hi' ? 'नया मृदा परीक्षण दर्ज करें' : 'Record Soil Test'}</span>
          </Button>
        }
      />

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0D3022]/70 backdrop-blur-xl p-4 rounded-2xl border border-emerald-500/20">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#B6F5D9] uppercase tracking-wider">
            {lang === 'hi' ? 'खेत का चयन:' : 'Filter Parcel:'}
          </span>
          <select
            value={selectedFarmId}
            onChange={(e) => setSelectedFarmId(e.target.value)}
            className="bg-[#071B13]/90 border border-emerald-500/30 rounded-xl px-3 py-1.5 text-xs font-semibold text-[#F4F7F1] shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#00B879]"
          >
            <option value="all" className="bg-[#071B13] text-[#F4F7F1]">{lang === 'hi' ? 'सभी खेत (समग्र)' : 'All Farm Parcels'}</option>
            {farms.map((f) => (
              <option key={f.id} value={f.id} className="bg-[#071B13] text-[#F4F7F1]">
                {f.name} ({f.size} {f.sizeUnit})
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-[#B6F5D9]/70 font-medium">
          {filteredTests.length} {lang === 'hi' ? 'परीक्षण रिकॉर्ड मिले' : 'soil test record(s) on file'}
        </div>
      </div>

      {/* Featured Latest Soil Card */}
      {latestTest ? (
        <div className="bg-gradient-to-br from-[#0D3022]/90 via-[#071B13]/85 to-[#0D3022]/90 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-emerald-500/30 shadow-[0_16px_40px_rgba(0,0,0,0.5)] relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-emerald-500/20 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#54F5BC]/20 text-[#54F5BC] border border-[#54F5BC]/30">
                  {latestTest.isLabTest ? 'Official Lab Card (सरकारी मान्यता प्राप्त)' : 'Field Rapid Test'}
                </span>
                <span className="text-xs text-[#B6F5D9]/60 font-medium">
                  {latestTest.date} (Sample depth: {latestTest.sampleDepthCm || 15} cm)
                </span>
              </div>
              <h2 className="text-xl font-bold text-[#F4F7F1]">
                {latestTest.labName || 'Regional Agricultural Lab'}
              </h2>
            </div>

            <div className={`px-4 py-2 rounded-2xl border ${getPhAssessment(latestTest.ph).bg} text-center`}>
              <span className="text-[11px] font-bold uppercase tracking-wider block text-[#B6F5D9]/70">
                Soil pH
              </span>
              <span className="text-2xl font-black tracking-tight text-[#F4F7F1]">{latestTest.ph}</span>
              <span className={`text-[11px] font-bold block ${getPhAssessment(latestTest.ph).color}`}>
                {getPhAssessment(latestTest.ph).label}
              </span>
            </div>
          </div>

          {/* Primary Macronutrients Gauge Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
            {/* Nitrogen */}
            <div className="p-4 rounded-2xl bg-black/40 border border-emerald-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#B6F5D9] uppercase">Available Nitrogen (N)</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border ${
                    latestTest.nitrogenLevel === 'low'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : latestTest.nitrogenLevel === 'high'
                      ? 'bg-emerald-500/20 text-[#54F5BC] border-emerald-500/30'
                      : 'bg-amber-500/20 text-[#FFC76A] border-amber-500/30'
                  }`}
                >
                  {latestTest.nitrogenLevel || 'Medium'}
                </span>
              </div>
              <div className="text-2xl font-black text-[#54F5BC]">
                {latestTest.nitrogen || '240'}{' '}
                <span className="text-xs font-semibold text-[#B6F5D9]/70 uppercase">kg/ha</span>
              </div>
              <div className="text-[11px] text-[#B6F5D9]/60 mt-1">
                Standard Benchmark: 280 - 560 kg/ha
              </div>
            </div>

            {/* Phosphorus */}
            <div className="p-4 rounded-2xl bg-black/40 border border-emerald-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#B6F5D9] uppercase">Available Phosphorus (P₂O₅)</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border ${
                    latestTest.phosphorusLevel === 'low'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : latestTest.phosphorusLevel === 'high'
                      ? 'bg-emerald-500/20 text-[#54F5BC] border-emerald-500/30'
                      : 'bg-amber-500/20 text-[#FFC76A] border-amber-500/30'
                  }`}
                >
                  {latestTest.phosphorusLevel || 'Medium'}
                </span>
              </div>
              <div className="text-2xl font-black text-[#54F5BC]">
                {latestTest.phosphorus || '18'}{' '}
                <span className="text-xs font-semibold text-[#B6F5D9]/70 uppercase">kg/ha</span>
              </div>
              <div className="text-[11px] text-[#B6F5D9]/60 mt-1">
                Standard Benchmark: 10 - 25 kg/ha
              </div>
            </div>

            {/* Potassium */}
            <div className="p-4 rounded-2xl bg-black/40 border border-emerald-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#B6F5D9] uppercase">Available Potassium (K₂O)</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border ${
                    latestTest.potassiumLevel === 'low'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : latestTest.potassiumLevel === 'high'
                      ? 'bg-emerald-500/20 text-[#54F5BC] border-emerald-500/30'
                      : 'bg-amber-500/20 text-[#FFC76A] border-amber-500/30'
                  }`}
                >
                  {latestTest.potassiumLevel || 'High'}
                </span>
              </div>
              <div className="text-2xl font-black text-[#54F5BC]">
                {latestTest.potassium || '260'}{' '}
                <span className="text-xs font-semibold text-[#B6F5D9]/70 uppercase">kg/ha</span>
              </div>
              <div className="text-[11px] text-[#B6F5D9]/60 mt-1">
                Standard Benchmark: 110 - 280 kg/ha
              </div>
            </div>
          </div>

          {/* Secondary Parameters */}
          <div className="grid grid-cols-2 gap-4 pb-6 border-b border-emerald-500/20 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-black/35 border border-emerald-500/15">
              <span className="text-[#B6F5D9]/75 font-medium">Organic Carbon (OC %)</span>
              <span className="font-bold text-[#F4F7F1] text-sm">{latestTest.organicCarbonPercent || 0.65}%</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-black/35 border border-emerald-500/15">
              <span className="text-[#B6F5D9]/75 font-medium">Electrical Conductivity (EC)</span>
              <span className="font-bold text-[#F4F7F1] text-sm">
                {latestTest.electricalConductivity || 0.45} dS/m (Normal salinity)
              </span>
            </div>
          </div>

          {/* Automated Scientific Advisory */}
          <div className="mt-6">
            <h3 className="text-sm font-bold text-[#F4F7F1] uppercase tracking-wider flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[#54F5BC]" />
              <span>{lang === 'hi' ? 'वैज्ञानिक उर्वरक व मृदा सुधार सिफारिश' : 'Agronomic Soil Management Recommendations'}</span>
            </h3>

            {latestTest.recommendations && latestTest.recommendations.length > 0 ? (
              <ul className="space-y-2">
                {latestTest.recommendations.map((rec, i) => (
                  <li
                    key={i}
                    className="p-3 rounded-xl bg-black/40 border border-emerald-500/20 text-xs text-[#F4F7F1] flex items-start gap-2.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#54F5BC] shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{rec}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-[#B6F5D9]/70">
                Soil parameters are well within balanced fertility parameters. Maintain organic composting.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-black/35 rounded-2xl p-12 text-center border border-dashed border-emerald-500/25">
          <FlaskConical className="w-12 h-12 text-[#54F5BC]/60 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[#F4F7F1]">
            {lang === 'hi' ? 'कोई मृदा परीक्षण रिकॉर्ड नहीं मिला' : 'No Soil Test Card Registered'}
          </h3>
          <p className="text-xs text-[#B6F5D9]/80 max-w-md mx-auto mt-1 mb-6">
            {lang === 'hi'
              ? 'अपने नजदीकी कृषि विज्ञान केंद्र (KVK) की सॉइल टेस्ट रिपोर्ट या रैपिड किट की रीडिंग दर्ज करें।'
              : 'Add your government Soil Health Card details to unlock targeted fertilizer dosages and prevent wastage.'}
          </p>
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            {lang === 'hi' ? 'पहला टेस्ट रिकॉर्ड करें' : 'Record Soil Test'}
          </Button>
        </div>
      )}

      {/* Historical Test Records Table */}
      {filteredTests.length > 1 && (
        <div className="bg-[#0D3022]/70 backdrop-blur-xl rounded-2xl p-6 border border-emerald-500/20 shadow-2xs">
          <h3 className="font-bold text-base text-[#F4F7F1] mb-4">
            {lang === 'hi' ? 'पूर्व परीक्षण इतिहास' : 'Historical Soil Health Reports'}
          </h3>
          <div className="divide-y divide-emerald-500/15">
            {filteredTests.slice(1).map((test) => (
              <div key={test.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-[#F4F7F1]">{test.date}</div>
                  <div className="text-[#B6F5D9]/70">{test.labName || 'Field Test'} • pH: {test.ph}</div>
                </div>
                <button
                  onClick={() => handleDeleteTest(test.id)}
                  className="text-[#B6F5D9]/60 hover:text-rose-400 p-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Record Soil Test */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={lang === 'hi' ? 'मृदा परीक्षण कार्ड दर्ज करें' : 'Record Soil Health Test Card'}
      >
        <form onSubmit={handleCreateTest} className="space-y-4 pt-2">
          <Select
            label={lang === 'hi' ? 'खेत का चयन' : 'Farm Parcel'}
            value={farmId}
            onChange={(e) => setFarmId(e.target.value)}
            options={farms.map((f) => ({ value: f.id, label: `${f.name} (${f.size} ${f.sizeUnit})` }))}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={lang === 'hi' ? 'परीक्षण की तारीख' : 'Test Date'}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
            <Select
              label={lang === 'hi' ? 'परीक्षण का प्रकार' : 'Verification Source'}
              value={isLabTest ? 'lab' : 'field'}
              onChange={(e) => setIsLabTest(e.target.value === 'lab')}
              options={[
                { value: 'lab', label: 'Official Lab / KVK Card' },
                { value: 'field', label: 'Field Rapid Kit' },
              ]}
            />
          </div>

          {isLabTest && (
            <Input
              label={lang === 'hi' ? 'प्रयोगशाला / केंद्र का नाम' : 'Lab / Testing Center'}
              value={labName}
              onChange={(e) => setLabName(e.target.value)}
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={lang === 'hi' ? 'मृदा pH स्तर (0 - 14)' : 'Soil pH (0 - 14)'}
              type="number"
              step="0.1"
              min="3"
              max="11"
              value={ph}
              onChange={(e) => setPh(e.target.value)}
              required
            />
            <Input
              label={lang === 'hi' ? 'नमूना गहराई (सेमी)' : 'Sample Depth (cm)'}
              type="number"
              value={sampleDepthCm}
              onChange={(e) => setSampleDepthCm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Input
                label="Nitrogen (kg/ha)"
                type="number"
                value={nitrogen}
                onChange={(e) => setNitrogen(e.target.value)}
              />
              <Select
                value={nitrogenLevel}
                onChange={(e) => setNitrogenLevel(e.target.value as any)}
                options={[
                  { value: 'low', label: 'Low (कम)' },
                  { value: 'medium', label: 'Medium (मध्यम)' },
                  { value: 'high', label: 'High (उच्च)' },
                ]}
              />
            </div>

            <div>
              <Input
                label="Phosphorus (kg/ha)"
                type="number"
                value={phosphorus}
                onChange={(e) => setPhosphorus(e.target.value)}
              />
              <Select
                value={phosphorusLevel}
                onChange={(e) => setPhosphorusLevel(e.target.value as any)}
                options={[
                  { value: 'low', label: 'Low (कम)' },
                  { value: 'medium', label: 'Medium (मध्यम)' },
                  { value: 'high', label: 'High (उच्च)' },
                ]}
              />
            </div>

            <div>
              <Input
                label="Potassium (kg/ha)"
                type="number"
                value={potassium}
                onChange={(e) => setPotassium(e.target.value)}
              />
              <Select
                value={potassiumLevel}
                onChange={(e) => setPotassiumLevel(e.target.value as any)}
                options={[
                  { value: 'low', label: 'Low (कम)' },
                  { value: 'medium', label: 'Medium (मध्यम)' },
                  { value: 'high', label: 'High (उच्च)' },
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={lang === 'hi' ? 'जैविक कार्बन (OC %)' : 'Organic Carbon (OC %)'}
              type="number"
              step="0.01"
              value={organicCarbonPercent}
              onChange={(e) => setOrganicCarbonPercent(e.target.value)}
            />
            <Input
              label={lang === 'hi' ? 'विद्युत चालकता (EC dS/m)' : 'Electrical Conductivity (EC dS/m)'}
              type="number"
              step="0.01"
              value={electricalConductivity}
              onChange={(e) => setElectricalConductivity(e.target.value)}
            />
          </div>

          <Input
            label={lang === 'hi' ? 'टिप्पणी / किसान का अवलोकन' : 'Notes / Additional Observations'}
            placeholder="e.g. Zinc application suggested by agronomist"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
            </Button>
            <Button type="submit" className="bg-[#123B2A] text-white" isLoading={isSubmitting}>
              {lang === 'hi' ? 'परीक्षण सहेजें' : 'Save Test'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

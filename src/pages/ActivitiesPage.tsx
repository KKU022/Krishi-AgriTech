import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  Sprout,
  Droplets,
  Scissors,
  Bug,
  Sparkles,
  Layers,
  IndianRupee,
  Trash2,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { apiRequest } from '../lib/api.js';
import { CropPlan, FarmActivity, Farm } from '../types.js';
import { Button } from '../components/common/Button.js';
import { Modal } from '../components/common/Modal.js';
import { Input } from '../components/common/Input.js';
import { Select } from '../components/common/Select.js';
import { PageHeader } from '../components/common/PageHeader.js';

export const ActivitiesPage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const lang = user?.profile?.language || 'en';

  const [activeTab, setActiveTab] = useState<'plans' | 'timeline'>('plans');
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>('all');
  const [plans, setPlans] = useState<CropPlan[]>([]);
  const [activities, setActivities] = useState<FarmActivity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [planModalOpen, setPlanModalOpen] = useState<boolean>(false);
  const [activityModalOpen, setActivityModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // New Plan form
  const [planFarmId, setPlanFarmId] = useState<string>('');
  const [cropName, setCropName] = useState<string>('');
  const [variety, setVariety] = useState<string>('');
  const [season, setSeason] = useState<'Kharif' | 'Rabi' | 'Zaid'>('Rabi');
  const [sowingDate, setSowingDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expectedHarvestDate, setExpectedHarvestDate] = useState<string>('');
  const [targetYield, setTargetYield] = useState<string>('20');
  const [planNotes, setPlanNotes] = useState<string>('');

  // New Activity form
  const [activityFarmId, setActivityFarmId] = useState<string>('');
  const [activityType, setActivityType] = useState<FarmActivity['type']>('irrigation');
  const [activityTitle, setActivityTitle] = useState<string>('');
  const [activityDate, setActivityDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [activityCost, setActivityCost] = useState<string>('');
  const [activityNotes, setActivityNotes] = useState<string>('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [farmsRes, plansRes, actRes] = await Promise.all([
        apiRequest<{ farms: Farm[] }>('/farms'),
        apiRequest<{ plans: CropPlan[] }>('/crop-plans'),
        apiRequest<{ activities: FarmActivity[] }>('/farm-activities'),
      ]);

      const loadedFarms = farmsRes.farms || [];
      setFarms(loadedFarms);
      setPlans(plansRes.plans || []);
      setActivities(actRes.activities || []);

      if (loadedFarms.length > 0 && !planFarmId) {
        setPlanFarmId(loadedFarms[0].id);
        setActivityFarmId(loadedFarms[0].id);
      }
    } catch (err: any) {
      console.warn('Error loading farm activities data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cropName.trim() || !planFarmId) {
      addToast({ title: 'Validation', message: 'Crop name and farm are required.', type: 'warning' });
      return;
    }

    try {
      setIsSubmitting(true);
      const newPlan = await apiRequest<CropPlan>('/crop-plans', {
        method: 'POST',
        body: JSON.stringify({
          farmId: planFarmId,
          cropName: cropName.trim(),
          variety: variety.trim() || 'Standard HYV',
          season,
          sowingDate,
          expectedHarvestDate,
          targetYieldQuintals: parseFloat(targetYield) || 0,
          notes: planNotes,
        }),
      });

      addToast({
        title: lang === 'hi' ? 'फसल योजना जोड़ी गई' : 'Crop Plan Added',
        message: `${newPlan.cropName} (${newPlan.season}) scheduled for cultivation.`,
        type: 'success',
      });

      setPlans((prev) => [newPlan, ...prev]);
      setPlanModalOpen(false);
      setCropName('');
      setVariety('');
    } catch (err: any) {
      addToast({ title: 'Error', message: 'Failed to record crop plan.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityTitle.trim() || !activityFarmId) {
      addToast({ title: 'Validation', message: 'Title and farm parcel are required.', type: 'warning' });
      return;
    }

    try {
      setIsSubmitting(true);
      const newActivity = await apiRequest<FarmActivity>('/farm-activities', {
        method: 'POST',
        body: JSON.stringify({
          farmId: activityFarmId,
          type: activityType,
          title: activityTitle.trim(),
          date: activityDate,
          cost: parseFloat(activityCost) || 0,
          notes: activityNotes,
          completed: true,
        }),
      });

      addToast({
        title: lang === 'hi' ? 'कार्य दर्ज किया गया' : 'Farm Operation Logged',
        message: `${newActivity.title} logged in your timeline.`,
        type: 'success',
      });

      setActivities((prev) => [newActivity, ...prev]);
      setActivityModalOpen(false);
      setActivityTitle('');
      setActivityCost('');
      setActivityNotes('');
    } catch (err: any) {
      addToast({ title: 'Error', message: 'Failed to log farm activity.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleComplete = async (activity: FarmActivity) => {
    try {
      const updated = await apiRequest<FarmActivity>(`/farm-activities/${activity.id}`, {
        method: 'PUT',
        body: JSON.stringify({ completed: !activity.completed }),
      });
      setActivities((prev) => prev.map((a) => (a.id === activity.id ? updated : a)));
      addToast({
        title: updated.completed ? 'Task Completed' : 'Task Reopened',
        message: updated.title,
        type: 'info',
      });
    } catch {
      addToast({ title: 'Error', message: 'Failed to update task status.', type: 'error' });
    }
  };

  const handleDeleteActivity = async (id: string) => {
    try {
      await apiRequest(`/farm-activities/${id}`, { method: 'DELETE' });
      setActivities((prev) => prev.filter((a) => a.id !== id));
      addToast({ title: 'Deleted', message: 'Activity record removed.', type: 'info' });
    } catch {
      addToast({ title: 'Error', message: 'Failed to delete activity.', type: 'error' });
    }
  };

  const filteredPlans = plans.filter((p) => selectedFarmId === 'all' || p.farmId === selectedFarmId);
  const filteredActivities = activities.filter((a) => selectedFarmId === 'all' || a.farmId === selectedFarmId);

  const getActivityIcon = (type: FarmActivity['type']) => {
    switch (type) {
      case 'irrigation':
        return <Droplets className="w-4 h-4 text-sky-600" />;
      case 'sowing':
        return <Sprout className="w-4 h-4 text-emerald-600" />;
      case 'weeding':
        return <Scissors className="w-4 h-4 text-amber-600" />;
      case 'fertilizer':
        return <Sparkles className="w-4 h-4 text-indigo-600" />;
      case 'pest_control':
        return <Bug className="w-4 h-4 text-rose-600" />;
      default:
        return <Layers className="w-4 h-4 text-stone-600" />;
    }
  };

  const totalExpenditure = filteredActivities.reduce((acc, a) => acc + (a.cost || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <PageHeader
        badge={lang === 'hi' ? 'सत्र योजना व कार्यप्रणाली' : 'Cultivation Schedules & Operations Log'}
        title={lang === 'hi' ? 'फसल योजना व दैनिक कार्य' : 'Crop Plans & Activity Log'}
        description={
          lang === 'hi'
            ? 'बुवाई की तारीख, विकास चरण और सिंचाई-उर्वरक लागत का व्यवस्थित हिसाब रखें।'
            : 'Track crop lifecycles from sowing to harvest, log field operations, and monitor operational costs.'
        }
        actions={
          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={() => setPlanModalOpen(true)}
              variant="outline"
              className="flex items-center gap-1.5 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'नई फसल योजना' : 'Plan New Crop'}</span>
            </Button>

            <Button
              onClick={() => setActivityModalOpen(true)}
              variant="primary"
              className="flex items-center gap-1.5 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{lang === 'hi' ? 'कार्य दर्ज करें' : 'Log Operation'}</span>
            </Button>
          </div>
        }
      />

      {/* Filter and Summary Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#071B13]/70 backdrop-blur-xl p-4 rounded-3xl border border-emerald-500/20 text-[#F4F7F1]">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-bold text-[#B6F5D9]/80 uppercase">
            {lang === 'hi' ? 'खेत का चयन:' : 'Filter Parcel:'}
          </span>
          <select
            value={selectedFarmId}
            onChange={(e) => setSelectedFarmId(e.target.value)}
            className="bg-[#071B13] border border-emerald-500/30 rounded-xl px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#00B879]"
          >
            <option value="all" className="bg-[#071B13] text-white">{lang === 'hi' ? 'सभी खेत (समग्र)' : 'All Farm Parcels'}</option>
            {farms.map((f) => (
              <option key={f.id} value={f.id} className="bg-[#071B13] text-white">
                {f.name} ({f.size} {f.sizeUnit})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-[#B6F5D9]/80">
            <span>{lang === 'hi' ? 'सक्रिय फसलें:' : 'Active Plans:'}</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-[#54F5BC] font-bold border border-emerald-400/30">
              {filteredPlans.length}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[#B6F5D9]/80">
            <span>{lang === 'hi' ? 'कुल दर्ज खर्च:' : 'Logged Inputs:'}</span>
            <span className="px-2 py-0.5 rounded-full bg-black/40 text-[#54F5BC] font-mono font-bold flex items-center gap-0.5 border border-white/10">
              <IndianRupee className="w-3 h-3" />
              {totalExpenditure.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 gap-6 text-sm font-bold">
        <button
          onClick={() => setActiveTab('plans')}
          className={`pb-3 relative transition-colors cursor-pointer ${
            activeTab === 'plans' ? 'text-[#54F5BC] border-b-2 border-[#00B879]' : 'text-[#B6F5D9]/60 hover:text-white'
          }`}
        >
          {lang === 'hi' ? 'फसल योजनाएं' : 'Cultivation Schedules'} ({filteredPlans.length})
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`pb-3 relative transition-colors cursor-pointer ${
            activeTab === 'timeline' ? 'text-[#54F5BC] border-b-2 border-[#00B879]' : 'text-[#B6F5D9]/60 hover:text-white'
          }`}
        >
          {lang === 'hi' ? 'कार्य समयरेखा (टाइमलाइन)' : 'Activity Timeline'} ({filteredActivities.length})
        </button>
      </div>

      {/* Tab 1: Cultivation Plans */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          {filteredPlans.length === 0 ? (
            <div className="bg-[#0D3022]/70 backdrop-blur-xl rounded-3xl p-8 text-center border border-dashed border-emerald-500/25">
              <Sprout className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-70" />
              <h4 className="font-bold text-white">
                {lang === 'hi' ? 'कोई फसल योजना नहीं है' : 'No Cultivation Schedules Found'}
              </h4>
              <p className="text-xs text-[#B6F5D9]/80 mt-1 mb-4">
                {lang === 'hi'
                  ? 'आगामी खरीफ या रबी सीजन के लिए लक्ष्य उपज और बुवाई की तारीख निर्धारित करें।'
                  : 'Set sowing dates, harvest targets, and seed varieties for the current season.'}
              </p>
              <Button size="sm" onClick={() => setPlanModalOpen(true)} variant="primary">
                <Plus className="w-4 h-4 mr-1" />
                {lang === 'hi' ? 'फसल योजना बनाएं' : 'Create Cultivation Schedule'}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPlans.map((plan) => {
                const farm = farms.find((f) => f.id === plan.farmId);
                return (
                  <div
                    key={plan.id}
                    className="bg-[#0D3022]/75 backdrop-blur-xl rounded-3xl p-5 border border-emerald-500/25 shadow-lg hover:border-emerald-400/40 transition-all flex flex-col justify-between text-[#F4F7F1]"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-lg bg-emerald-500/20 text-[#54F5BC] border border-emerald-400/30 uppercase">
                          {plan.season} Season
                        </span>
                        <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-lg bg-black/40 text-emerald-200 border border-white/10 capitalize">
                          {plan.status}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold font-display text-white tracking-tight">{plan.cropName}</h3>
                      <div className="text-xs text-[#B6F5D9]/80 font-medium">
                        Variety: <span className="text-white font-semibold">{plan.variety}</span>
                      </div>

                      <div className="text-xs text-[#54F5BC] font-semibold mt-1">
                        Plot: {farm?.name || 'Assigned Parcel'}
                      </div>

                      <div className="grid grid-cols-2 gap-2 my-3 pt-3 border-t border-white/10 text-xs">
                        <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                          <span className="text-[#A3B5AA] block text-[10px]">Sowing Date</span>
                          <span className="font-semibold text-white">{plan.sowingDate}</span>
                        </div>
                        <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                          <span className="text-[#A3B5AA] block text-[10px]">Est. Harvest</span>
                          <span className="font-semibold text-white">{plan.expectedHarvestDate || 'Flexible'}</span>
                        </div>
                      </div>

                      {plan.targetYieldQuintals && (
                        <div className="bg-emerald-950/40 border border-emerald-500/25 p-2.5 rounded-xl text-xs mb-3">
                          <span className="text-[#A3B5AA] block text-[10px]">Target Yield</span>
                          <span className="font-bold text-[#54F5BC]">
                            {plan.targetYieldQuintals} Quintals / Farm
                          </span>
                        </div>
                      )}

                      {plan.notes && (
                        <p className="text-xs text-[#B6F5D9]/90 italic bg-black/40 p-2.5 rounded-xl border border-white/10">
                          &quot;{plan.notes}&quot;
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-[#A3B5AA]">
                      <span>Logged {new Date(plan.createdAt).toLocaleDateString()}</span>
                      <button
                        onClick={async () => {
                          if (window.confirm('Delete this crop plan?')) {
                            await apiRequest(`/crop-plans/${plan.id}`, { method: 'DELETE' });
                            setPlans((prev) => prev.filter((p) => p.id !== plan.id));
                          }
                        }}
                        className="text-[#A3B5AA] hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-950/40 transition-colors"
                        title="Delete crop plan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Activity Timeline */}
      {activeTab === 'timeline' && (
        <div className="bg-[#0D3022]/75 backdrop-blur-2xl rounded-3xl p-6 border border-emerald-500/25 shadow-xl space-y-4 text-[#F4F7F1]">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-8 text-[#A3B5AA]">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">
                {lang === 'hi' ? 'कोई कार्य दर्ज नहीं है।' : 'No operations recorded for the selected filter.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {filteredActivities.map((act) => {
                const farm = farms.find((f) => f.id === act.farmId);
                return (
                  <div key={act.id} className="py-3 flex items-start justify-between gap-4 group">
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleToggleComplete(act)}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-colors mt-0.5 cursor-pointer ${
                          act.completed
                            ? 'bg-[#00B879] border-[#00B879] text-[#071B13]'
                            : 'border-white/20 hover:border-[#00B879] bg-black/40'
                        }`}
                        title="Toggle completion"
                      >
                        {act.completed && <Check className="w-4 h-4 stroke-[3]" />}
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="p-1 rounded-lg bg-emerald-500/15 text-[#54F5BC]">{getActivityIcon(act.type)}</span>
                          <span
                            className={`font-bold text-sm tracking-tight ${
                              act.completed ? 'line-through text-[#A3B5AA]' : 'text-white'
                            }`}
                          >
                            {act.title}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 text-emerald-200 uppercase font-semibold">
                            {act.type.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-[#A3B5AA] mt-1">
                          <span>{act.date}</span>
                          <span>•</span>
                          <span>{farm?.name || 'Field Parcel'}</span>
                          {act.cost && act.cost > 0 && (
                            <>
                              <span>•</span>
                              <span className="font-semibold text-[#54F5BC] font-mono">
                                ₹{act.cost.toLocaleString('en-IN')}
                              </span>
                            </>
                          )}
                        </div>

                        {act.notes && (
                          <p className="text-xs text-[#B6F5D9]/90 mt-1.5 bg-black/35 px-3 py-1.5 rounded-xl border border-white/5">
                            {act.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteActivity(act.id)}
                      className="p-1.5 text-[#A3B5AA] hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg hover:bg-rose-950/40"
                      title="Delete activity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal: Add Crop Plan */}
      <Modal
        isOpen={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
        title={lang === 'hi' ? 'नई फसल योजना दर्ज करें' : 'Schedule New Crop Cultivation'}
      >
        <form onSubmit={handleCreatePlan} className="space-y-4 pt-2">
          <Select
            label={lang === 'hi' ? 'खेत का चयन' : 'Target Farm Parcel'}
            value={planFarmId}
            onChange={(e) => setPlanFarmId(e.target.value)}
            options={farms.map((f) => ({ value: f.id, label: `${f.name} (${f.size} ${f.sizeUnit})` }))}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={lang === 'hi' ? 'फसल का नाम' : 'Crop Name'}
              placeholder="e.g. Wheat / Mustard / Gram"
              value={cropName}
              onChange={(e) => setCropName(e.target.value)}
              required
            />
            <Input
              label={lang === 'hi' ? 'किस्म / वैरायटी' : 'Variety / Hybrid'}
              placeholder="e.g. Sharbati / HD-2967"
              value={variety}
              onChange={(e) => setVariety(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Select
              label={lang === 'hi' ? 'सत्र' : 'Season'}
              value={season}
              onChange={(e) => setSeason(e.target.value as any)}
              options={[
                { value: 'Rabi', label: 'Rabi (रबी)' },
                { value: 'Kharif', label: 'Kharif (खरीफ)' },
                { value: 'Zaid', label: 'Zaid (जायद)' },
              ]}
            />
            <Input
              label={lang === 'hi' ? 'बुवाई तिथि' : 'Sowing Date'}
              type="date"
              value={sowingDate}
              onChange={(e) => setSowingDate(e.target.value)}
              required
            />
            <Input
              label={lang === 'hi' ? 'अनुमानित कटाई' : 'Est. Harvest'}
              type="date"
              value={expectedHarvestDate}
              onChange={(e) => setExpectedHarvestDate(e.target.value)}
            />
          </div>

          <Input
            label={lang === 'hi' ? 'लक्ष्य उपज (क्विंटल)' : 'Target Yield (Quintals)'}
            type="number"
            value={targetYield}
            onChange={(e) => setTargetYield(e.target.value)}
          />

          <Input
            label={lang === 'hi' ? 'टिप्पणी / विशेष निर्देश' : 'Notes / Seed Treatment'}
            placeholder="e.g. Seed treated with Trichoderma, 50kg/acre seed rate"
            value={planNotes}
            onChange={(e) => setPlanNotes(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
            <Button type="button" variant="outline" onClick={() => setPlanModalOpen(false)}>
              {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
            </Button>
            <Button type="submit" className="bg-[#123B2A] text-white" isLoading={isSubmitting}>
              {lang === 'hi' ? 'योजना सहेजें' : 'Save Plan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Log Activity */}
      <Modal
        isOpen={activityModalOpen}
        onClose={() => setActivityModalOpen(false)}
        title={lang === 'hi' ? 'खेत कार्य दर्ज करें' : 'Record Farm Operation'}
      >
        <form onSubmit={handleCreateActivity} className="space-y-4 pt-2">
          <Select
            label={lang === 'hi' ? 'खेत का चयन' : 'Target Farm Parcel'}
            value={activityFarmId}
            onChange={(e) => setActivityFarmId(e.target.value)}
            options={farms.map((f) => ({ value: f.id, label: `${f.name} (${f.size} ${f.sizeUnit})` }))}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label={lang === 'hi' ? 'कार्य का प्रकार' : 'Operation Type'}
              value={activityType}
              onChange={(e) => setActivityType(e.target.value as any)}
              options={[
                { value: 'irrigation', label: 'Irrigation (सिंचाई)' },
                { value: 'sowing', label: 'Sowing / Transplanting (बुवाई)' },
                { value: 'fertilizer', label: 'Fertilizer Application (खाद)' },
                { value: 'pest_control', label: 'Pest Scouting / Spray (कीट प्रबंधन)' },
                { value: 'weeding', label: 'Weeding / Interculture (निराई-गुड़ाई)' },
                { value: 'harvesting', label: 'Harvesting (कटाई)' },
                { value: 'soil_testing', label: 'Soil Sampling (मिट्टी नमूना)' },
                { value: 'other', label: 'General Maintenance (अन्य)' },
              ]}
            />
            <Input
              label={lang === 'hi' ? 'कार्य का शीर्षक' : 'Task Title'}
              placeholder="e.g. 2nd Irrigation (4 hours drip)"
              value={activityTitle}
              onChange={(e) => setActivityTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={lang === 'hi' ? 'तारीख' : 'Execution Date'}
              type="date"
              value={activityDate}
              onChange={(e) => setActivityDate(e.target.value)}
              required
            />
            <Input
              label={lang === 'hi' ? 'खर्च / लागत (₹)' : 'Input Cost (₹ INR)'}
              type="number"
              placeholder="0"
              value={activityCost}
              onChange={(e) => setActivityCost(e.target.value)}
            />
          </div>

          <Input
            label={lang === 'hi' ? 'विवरण' : 'Observations / Notes'}
            placeholder="e.g. Applied PSB biofertilizer with compost"
            value={activityNotes}
            onChange={(e) => setActivityNotes(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
            <Button type="button" variant="outline" onClick={() => setActivityModalOpen(false)}>
              {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
            </Button>
            <Button type="submit" className="bg-[#123B2A] text-white" isLoading={isSubmitting}>
              {lang === 'hi' ? 'कार्य सहेजें' : 'Log Activity'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

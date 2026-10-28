import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  PhoneCall,
  UserCheck,
  Send,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { apiRequest } from '../lib/api.js';
import { Consultation } from '../types.js';
import { Button } from '../components/common/Button.js';
import { PageHeader } from '../components/common/PageHeader.js';
import { Badge } from '../components/common/Badge.js';
import { Modal } from '../components/common/Modal.js';
import { Input } from '../components/common/Input.js';
import { Select } from '../components/common/Select.js';

export const ConsultationsPage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const lang = user?.profile?.language || 'en';

  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form State
  const [crop, setCrop] = useState<string>('');
  const [category, setCategory] = useState<Consultation['category']>('crop_disease');
  const [urgency, setUrgency] = useState<Consultation['urgency']>('routine');
  const [question, setQuestion] = useState<string>('');
  const [phone, setPhone] = useState<string>('');

  const loadConsultations = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<{ consultations: Consultation[] }>('/consultations');
      setConsultations(res.consultations || []);
    } catch (err: any) {
      console.warn('Error loading consultations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConsultations();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crop.trim() || !question.trim()) {
      addToast({ title: 'Validation', message: 'Crop name and question details are required.', type: 'warning' });
      return;
    }

    try {
      setIsSubmitting(true);
      const newConsultation = await apiRequest<Consultation>('/consultations', {
        method: 'POST',
        body: JSON.stringify({
          crop: crop.trim(),
          category,
          urgency,
          question: question.trim(),
          farmerPhone: phone.trim(),
          farmerName: user?.fullName || 'Farmer',
          state: user?.profile?.state || 'Madhya Pradesh',
          district: user?.profile?.district || 'Indore',
        }),
      });

      addToast({
        title: lang === 'hi' ? 'सलाह अनुरोध दर्ज किया गया' : 'Inquiry Queued for Agronomist',
        message: 'Your inquiry has been placed in the certified agricultural advisory queue.',
        type: 'success',
      });

      setConsultations((prev) => [newConsultation, ...prev]);
      setModalOpen(false);
      setCrop('');
      setQuestion('');
    } catch (err: any) {
      addToast({ title: 'Error', message: 'Failed to submit consultation query.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: Consultation['status']) => {
    switch (status) {
      case 'resolved':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Advisory Provided</span>
          </span>
        );
      case 'under_review':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Assigned to Specialist</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Inquiry Queued</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <PageHeader
        badge={lang === 'hi' ? 'विशेषज्ञ कृषि परामर्श कतार' : 'Certified Agronomist Advisory Queue'}
        title={lang === 'hi' ? 'कृषि विशेषज्ञ सलाह' : 'Expert Consultation'}
        description={
          lang === 'hi'
            ? 'फसल रोग, पोषक तत्व कमी या सिंचाई समस्याओं पर कृषि विशेषज्ञों से सत्यापित मार्गदर्शन प्राप्त करें।'
            : 'Submit complex field challenges to our agronomist network and track response status transparently.'
        }
        action={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setModalOpen(true)}
            icon={<Plus className="w-4 h-4 text-[#071B13]" />}
          >
            <span>{lang === 'hi' ? 'नया प्रश्न पूछें' : 'Request Consultation'}</span>
          </Button>
        }
      />

      {/* Emergency Helpline Callout */}
      <div className="bg-[#FFC76A]/10 border border-[#FFC76A]/30 backdrop-blur-md rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#F4F7F1]">
        <div className="flex items-center gap-2.5">
          <PhoneCall className="w-5 h-5 text-[#FFC76A] shrink-0" />
          <div>
            <span className="font-bold text-[#FFC76A]">Need Immediate Emergency Advice? </span>
            <span>
              Call the Government of India Kisan Call Center (Toll Free:{' '}
              <a href="tel:18001801551" className="font-bold underline text-[#54F5BC]">
                1800-180-1551
              </a>
              ) available 6:00 AM to 10:00 PM in all regional languages.
            </span>
          </div>
        </div>
      </div>

      {/* Consultation Requests List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : consultations.length === 0 ? (
        <div className="bg-black/35 rounded-2xl p-12 text-center border border-dashed border-emerald-500/25">
          <MessageSquare className="w-12 h-12 text-[#54F5BC]/60 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[#F4F7F1]">
            {lang === 'hi' ? 'कोई परामर्श अनुरोध नहीं है' : 'No Consultation Requests Yet'}
          </h3>
          <p className="text-xs text-[#B6F5D9]/80 max-w-md mx-auto mt-1 mb-6">
            {lang === 'hi'
              ? 'क्या आपकी फसल में कोई कीट या असामान्य लक्षण दिख रहे हैं? हमारे कृषि वैज्ञानिक से सीधे पूछें।'
              : 'Have an unidentifiable pest, wilting crop, or soil concern? Submit an inquiry for agronomic review.'}
          </p>
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            {lang === 'hi' ? 'पहला अनुरोध दर्ज करें' : 'Submit Consultation Request'}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {consultations.map((c) => (
            <div
              key={c.id}
              className="bg-[#0D3022]/70 backdrop-blur-xl rounded-2xl p-6 border border-emerald-500/20 shadow-2xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-emerald-500/20">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-[#F4F7F1]">{c.crop}</span>
                  <span className="text-emerald-500/30">•</span>
                  <span className="text-xs font-semibold text-[#B6F5D9] capitalize">
                    {c.category.replace('_', ' ')}
                  </span>
                  <span className="text-emerald-500/30">•</span>
                  <span className="text-xs text-[#B6F5D9]/60">
                    Logged {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {c.urgency === 'urgent' && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase">
                      Urgent
                    </span>
                  )}
                  {getStatusBadge(c.status)}
                </div>
              </div>

              {/* Farmer's Inquiry */}
              <div className="text-sm text-[#F4F7F1] leading-relaxed bg-black/40 p-4 rounded-xl border border-emerald-500/15">
                <span className="font-bold text-xs uppercase tracking-wider text-[#54F5BC] block mb-1">
                  Farmer Question / Observed Symptoms
                </span>
                {c.question}
              </div>

              {/* Agronomist's Response */}
              {c.expertResponse ? (
                <div className="bg-[#00B879]/15 border border-[#00B879]/30 rounded-xl p-4 text-xs text-[#F4F7F1] space-y-2">
                  <div className="flex items-center justify-between font-bold text-[#54F5BC] border-b border-emerald-500/20 pb-2">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#54F5BC]" />
                      <span>Agronomist Recommendation ({c.assignedExpert || 'Agricultural Specialist'})</span>
                    </span>
                    <span className="text-[11px] font-normal text-[#B6F5D9]/70">
                      Responded {c.respondedAt ? new Date(c.respondedAt).toLocaleDateString() : 'Recently'}
                    </span>
                  </div>
                  <p className="leading-relaxed whitespace-pre-wrap">{c.expertResponse}</p>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-[#B6F5D9]/70 italic bg-black/30 p-3 rounded-xl border border-emerald-500/15">
                  <Clock className="w-4 h-4 text-[#FFC76A] shrink-0" />
                  <span>
                    Your inquiry is queued with our agricultural advisory panel. Responses typically appear within 24–48 hours after field review.
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal: Request Consultation */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={lang === 'hi' ? 'विशेषज्ञ कृषि सलाह अनुरोध' : 'Submit Consultation Request'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={lang === 'hi' ? 'प्रभावित फसल' : 'Crop / Plant'}
              placeholder="e.g. Wheat / Mustard / Cotton"
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
              required
            />
            <Select
              label={lang === 'hi' ? 'श्रेणी' : 'Category'}
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              options={[
                { value: 'crop_disease', label: 'Disease & Pest Outbreak' },
                { value: 'soil_fertility', label: 'Soil Health & Deficiencies' },
                { value: 'water_irrigation', label: 'Irrigation & Moisture Stress' },
                { value: 'market_advisory', label: 'Market & Post-Harvest' },
                { value: 'government_scheme', label: 'Govt Subsidies & Schemes' },
                { value: 'general', label: 'General Agronomy' },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label={lang === 'hi' ? 'प्राथमिकता / तात्कालिकता' : 'Urgency Level'}
              value={urgency}
              onChange={(e) => setUrgency(e.target.value as any)}
              options={[
                { value: 'routine', label: 'Routine (सामान्य - 24 to 48 hrs)' },
                { value: 'urgent', label: 'Urgent (त्वरित - Active Infestation)' },
                { value: 'critical', label: 'Critical (गंभीर नुकसान)' },
              ]}
            />
            <Input
              label={lang === 'hi' ? 'फोन नंबर (वैकल्पिक संपर्क)' : 'Contact Phone (Optional)'}
              placeholder="10-digit mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#B6F5D9] uppercase tracking-wider mb-1.5">
              {lang === 'hi' ? 'समस्या का विस्तृत विवरण' : 'Detailed Field Symptoms & Observation'}
            </label>
            <textarea
              rows={4}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Describe color changes, wilting, leaf spotting, insect presence, sowing date, and any recent fertilizers or irrigation applied..."
              className="w-full rounded-xl border border-emerald-500/30 bg-[#071B13]/80 p-3 text-xs text-[#F4F7F1] placeholder:text-[#B6F5D9]/40 focus:outline-none focus:ring-2 focus:ring-[#00B879]"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-emerald-500/20">
            <Button type="button" variant="glass" onClick={() => setModalOpen(false)}>
              {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {lang === 'hi' ? 'अनुरोध भेजें' : 'Submit Inquiry'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

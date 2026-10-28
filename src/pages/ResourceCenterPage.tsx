import React, { useState } from 'react';
import {
  BookOpen,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Search,
  FileText,
  Landmark,
  ShieldCheck,
  ChevronRight,
  Info,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card.js';
import { PageHeader } from '../components/common/PageHeader.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { Tabs } from '../components/common/Tabs.js';
import { Modal } from '../components/common/Modal.js';
import { CuratedGuide, GovernmentScheme } from '../types.js';

const curatedGuides: CuratedGuide[] = [
  { id: 'soil-health-card', title: 'Soil Health Card and soil testing services', category: 'Soil health', readingTime: '5 min', readTime: 'Official portal', summary: 'Use the Government of India Soil Health Card portal to find soil testing services, track samples, and access your soil health card.', bullets: ['Locate a soil testing laboratory through the portal.', 'Check the status of a soil sample.', 'Use measured soil test results when planning nutrient management.'], officialSource: 'https://soilhealth.dac.gov.in/' },
  { id: 'imd-agromet', title: 'District agrometeorological advisories', category: 'Weather and crop planning', readingTime: '4 min', readTime: 'Official service', summary: 'Read current district and state agrometeorological bulletins from the India Meteorological Department.', bullets: ['Select your state or district bulletin.', 'Check the bulletin date and forecast period.', 'Use local conditions and expert advice when making field decisions.'], officialSource: 'https://mausam.imd.gov.in/responsive/agromet_adv_ser_state_current.php' },
  { id: 'kvk-extension', title: 'Find Krishi Vigyan Kendra extension support', category: 'Expert support', readingTime: '3 min', readTime: 'ICAR information', summary: 'Learn about district-level KVK training, farm demonstrations, and agricultural extension services.', bullets: ['Find the KVK serving your district.', 'Check the centre for training and demonstration information.', 'Ask local experts to confirm advice for your crop and conditions.'], officialSource: 'https://www.icar.gov.in/en/krishi-vigyan-kendras-kvks' },
];

const officialSchemes: GovernmentScheme[] = [
  { id: 'pm-kisan', title: 'PM-KISAN Samman Nidhi', name: 'PM-KISAN Samman Nidhi', hindiTitle: 'प्रधानमंत्री किसान सम्मान निधि', ministry: 'Ministry of Agriculture and Farmers Welfare', benefit: 'See the official portal for current scheme details and farmer services.', eligibility: 'Check current eligibility criteria on the official portal.', applicationMode: 'Official website', officialUrl: 'https://pmkisan.gov.in/', officialPortalUrl: 'https://pmkisan.gov.in/', category: 'Income support', verified: true, verificationStatus: 'Official portal checked 27 Oct 2026', summary: 'Official scheme portal for registration services, status checks, and current guidance.' },
  { id: 'pmfby', title: 'Pradhan Mantri Fasal Bima Yojana', name: 'Pradhan Mantri Fasal Bima Yojana', hindiTitle: 'प्रधानमंत्री फसल बीमा योजना', ministry: 'Ministry of Agriculture and Farmers Welfare', benefit: 'See the official portal for current crop insurance services and guidance.', eligibility: 'Coverage depends on notified crops and current scheme rules; check official details.', applicationMode: 'Official website', officialUrl: 'https://pmfby.gov.in/', officialPortalUrl: 'https://pmfby.gov.in/', category: 'Crop insurance', verified: true, verificationStatus: 'Official portal checked 27 Oct 2026', summary: 'Official crop insurance portal for policy services, status, and current notifications.' },
  { id: 'soil-health-card', title: 'Soil Health Card Scheme', name: 'Soil Health Card Scheme', hindiTitle: 'मृदा स्वास्थ्य कार्ड योजना', ministry: 'Department of Agriculture and Farmers Welfare', benefit: 'Use the official portal to find soil testing services and soil card information.', eligibility: 'Check current services and procedures on the official portal.', applicationMode: 'Official website and local soil testing services', officialUrl: 'https://soilhealth.dac.gov.in/', officialPortalUrl: 'https://soilhealth.dac.gov.in/', category: 'Soil testing', verified: true, verificationStatus: 'Official portal checked 27 Oct 2026', summary: 'Official portal for soil sample tracking, soil cards, and soil testing laboratory information.' },
];
export const ResourceCenterPage: React.FC = () => {
  const [guides] = useState<CuratedGuide[]>(curatedGuides);
  const [schemes] = useState<GovernmentScheme[]>(officialSchemes);
  const [activeTab, setActiveTab] = useState<string>('guides');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGuide, setSelectedGuide] = useState<CuratedGuide | null>(null);

  const filteredGuides = guides.filter(
    (g) =>
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header */}
      <PageHeader
        badge="Agronomic Knowledge & Portal Links"
        title="Curated Resource Center"
        description="Curated scientific farming guides and verified links to official Ministry portals. No invented deadlines or eligibility promises."
      />

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'guides', label: 'Agricultural Educational Guides', icon: <FileText className="w-4 h-4" />, badge: guides.length },
          { id: 'schemes', label: 'Official Government Schemes', icon: <Landmark className="w-4 h-4" />, badge: schemes.length },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* GUIDES TAB */}
      {activeTab === 'guides' && (
        <div className="space-y-6">
          <div className="flex items-center max-w-md bg-[#071B13]/80 border border-emerald-500/30 rounded-xl px-3.5 py-2.5 shadow-2xs">
            <Search className="w-4 h-4 text-[#54F5BC] mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search guides by title or agronomy topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs sm:text-sm text-[#F4F7F1] placeholder:text-[#B6F5D9]/50 focus:outline-none bg-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGuides.map((guide) => (
              <Card
                key={guide.id}
                variant="glass"
                className="flex flex-col justify-between hover:border-[#00B879] transition-all group cursor-pointer"
                onClick={() => setSelectedGuide(guide)}
              >
                <div>
                  <div className="flex items-center justify-between mb-3 text-xs">
                    <span className="font-semibold text-[#54F5BC] uppercase tracking-wider text-[11px]">
                      {guide.category}
                    </span>
                    <span className="text-[#B6F5D9]/60">{guide.readTime}</span>
                  </div>
                  <h3 className="text-base font-bold text-[#F4F7F1] group-hover:text-[#54F5BC] transition-colors leading-snug">
                    {guide.title}
                  </h3>
                  <p className="text-xs text-[#B6F5D9]/80 mt-2 leading-relaxed line-clamp-3">
                    {guide.summary}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-emerald-500/20 flex items-center justify-between text-xs font-semibold text-[#54F5BC]">
                  <span>Read Guide</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* GOVERNMENT SCHEMES TAB */}
      {activeTab === 'schemes' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-[#FFC76A]/10 border border-[#FFC76A]/30 text-xs text-[#F4F7F1] leading-relaxed">
            <strong className="text-[#FFC76A]">Verification Policy: </strong> Scheme information is linked directly to official central portals. We label items with exact verification dates only when confirmed against the official domain, or mark them &quot;Unverified — check the official portal&quot;. We do not accept applications or disburse funds.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {schemes.map((scheme) => (
              <Card key={scheme.id} variant="glass" className="border-t-2 border-t-[#00B879] space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Badge variant={scheme.verified ? 'accent' : 'warning'} className="mb-2">
                      {scheme.verificationStatus}
                    </Badge>
                    <h3 className="text-base sm:text-lg font-bold text-[#F4F7F1] leading-tight">
                      {scheme.name}
                    </h3>
                  </div>
                  <div className="p-2 rounded-xl bg-white/10 text-[#54F5BC] shrink-0 border border-emerald-500/20">
                    <Landmark className="w-5 h-5" />
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-[#B6F5D9]/80 leading-relaxed">
                  {scheme.summary}
                </p>

                <div className="pt-3 border-t border-emerald-500/20 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-[#B6F5D9]/60 font-mono truncate max-w-[180px]">
                    {scheme.officialPortalUrl}
                  </span>
                  <a
                    href={scheme.officialPortalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00B879] hover:bg-[#54F5BC] text-[#071B13] text-xs font-bold shadow-2xs transition-colors shrink-0"
                  >
                    <span>Visit Official Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Guide Details Modal */}
      <Modal
        isOpen={Boolean(selectedGuide)}
        onClose={() => setSelectedGuide(null)}
        title={selectedGuide?.title || 'Farming Guide'}
        description={`Category: ${selectedGuide?.category} · ${selectedGuide?.readTime}`}
      >
        <div className="space-y-4 text-xs sm:text-sm text-[#F4F7F1] leading-relaxed">
          <p className="text-[#B6F5D9]/90">{selectedGuide?.summary}</p>
          <div className="p-4 bg-black/40 rounded-xl border border-emerald-500/20 text-xs space-y-2">
            <h5 className="font-bold text-[#54F5BC]">Key Field Recommendations:</h5>
            <ul className="list-disc list-inside space-y-1 text-[#B6F5D9]/80">
              {selectedGuide?.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
            </ul>
          </div>
          {selectedGuide?.officialSource && <a href={selectedGuide.officialSource} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#54F5BC] font-semibold underline">Open official source <ExternalLink className="w-3 h-3" /></a>}
          <div className="text-right pt-2">
            <Button size="sm" variant="glass" onClick={() => setSelectedGuide(null)}>
              Close Guide
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

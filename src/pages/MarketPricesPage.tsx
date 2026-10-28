import React, { useState } from 'react';
import {
  TrendingUp,
  Search,
  AlertTriangle,
  Calendar,
  Layers,
} from 'lucide-react';
import { Card } from '../components/common/Card.js';
import { PageHeader } from '../components/common/PageHeader.js';
import { Badge } from '../components/common/Badge.js';
import { CommodityPrice } from '../types.js';

export const MarketPricesPage: React.FC = () => {
  const [commodities] = useState<CommodityPrice[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [unitMode, setUnitMode] = useState<'Quintal' | 'Kg'>('Quintal');

  const filtered = commodities.filter((c) => {
    const matchesSearch =
      c.commodity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.market.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const formatPrice = (pricePerQuintal: number | undefined) => {
    if (pricePerQuintal === undefined || !Number.isFinite(pricePerQuintal)) return 'Price unavailable';
    if (unitMode === 'Kg') {
      return `₹${(pricePerQuintal / 100).toFixed(1)} / kg`;
    }
    return `₹${pricePerQuintal} / quintal`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header */}
      <PageHeader
        badge="Reference Benchmarks"
        title="Mandi Benchmark Records"
        description="No live or sample price feed is connected. Use official market sources for current rates."
        action={<Badge variant="warning">No connected price feed</Badge>}
      />

      {/* Market data availability notice */}
      <div className="p-4 rounded-2xl bg-[#FFC76A]/10 border border-[#FFC76A]/30 flex items-start gap-3 backdrop-blur-md">
        <AlertTriangle className="w-5 h-5 text-[#FFC76A] shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-[#F4F7F1] leading-relaxed">
          <strong className="font-bold text-[#FFC76A]">Price feed unavailable: </strong>
          AgriTech is not connected to a live mandi price source. No rates are shown as current or representative. Check your local mandi or the official e-NAM portal.
        </div>
      </div>

      {/* Search, Filter & Unit Switcher Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center flex-1 max-w-md bg-[#071B13]/80 border border-emerald-500/30 rounded-xl px-3.5 py-2.5 shadow-2xs">
          <Search className="w-4 h-4 text-[#54F5BC] mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search by crop (e.g. Wheat, Mustard) or mandi location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs sm:text-sm text-[#F4F7F1] placeholder:text-[#B6F5D9]/50 focus:outline-none bg-transparent"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <span className="text-xs font-semibold text-[#B6F5D9]">Display Unit:</span>
          <div className="inline-flex rounded-xl border border-emerald-500/20 p-1 bg-black/40">
            <button
              type="button"
              onClick={() => setUnitMode('Quintal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                unitMode === 'Quintal'
                  ? 'bg-[#00B879] text-[#071B13] font-bold shadow-[0_0_12px_rgba(0,184,121,0.3)]'
                  : 'text-[#B6F5D9]/70 hover:text-[#F4F7F1]'
              }`}
            >
              Quintal (100 kg)
            </button>
            <button
              type="button"
              onClick={() => setUnitMode('Kg')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                unitMode === 'Kg'
                  ? 'bg-[#00B879] text-[#071B13] font-bold shadow-[0_0_12px_rgba(0,184,121,0.3)]'
                  : 'text-[#B6F5D9]/70 hover:text-[#F4F7F1]'
              }`}
            >
              Per Kilogram (Kg)
            </button>
          </div>
        </div>
      </div>

      {/* Sample Price Table */}
      <Card variant="glass" className="p-0 overflow-hidden border-emerald-500/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-[#F4F7F1]">
            <thead className="bg-black/50 border-b border-emerald-500/20 text-xs uppercase font-bold text-[#54F5BC] tracking-wider">
              <tr>
                <th scope="col" className="px-5 py-3.5">Commodity</th>
                <th scope="col" className="px-5 py-3.5">Mandi Market</th>
                <th scope="col" className="px-5 py-3.5">Indicative Range ({unitMode})</th>
                <th scope="col" className="px-5 py-3.5">Reference Date</th>
                <th scope="col" className="px-5 py-3.5 text-right">Data Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-500/15 bg-transparent">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-[#F4F7F1] whitespace-nowrap">
                    {item.commodity}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-[#B6F5D9]/70">
                    {item.market}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="font-semibold text-[#54F5BC]">
                      {formatPrice(item.samplePriceMin)}
                    </span>
                    <span className="text-[#B6F5D9]/40 mx-1.5">—</span>
                    <span className="font-semibold text-[#54F5BC]">
                      {formatPrice(item.samplePriceMax)}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-xs text-[#B6F5D9]/60">
                    {item.sampleDate || 'Date unavailable'}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-right">
                    <Badge variant="warning">Sample Data</Badge>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-[#B6F5D9]/70">
                    No price records are connected. Check <a className="underline font-semibold text-[#54F5BC]" href="https://enam.gov.in/web/" target="_blank" rel="noopener noreferrer">the official e-NAM portal</a> or your local mandi for current rates.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

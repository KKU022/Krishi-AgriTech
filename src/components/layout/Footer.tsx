import React from 'react';
import { ShieldAlert, ExternalLink, Sprout } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#07180F] text-[#CCD7D0] border-t border-[#19221D]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand & Capstone Notice */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#0D281A] border border-emerald-500/30 flex items-center justify-center text-white shadow-xs">
                <Sprout className="w-5 h-5 text-emerald-300" />
              </div>
              <span className="text-xl font-bold font-display text-white tracking-tight">
                AgriTech <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#0D281A] text-emerald-300 border border-emerald-500/20">Bharat</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#A3B5AA] max-w-md leading-relaxed">
              A modern digital farming platform combining deterministic ICAR agronomy rules, Open-Meteo microclimate telemetry, and Google Gemini assistance for Indian farmers.
            </p>
            <div className="text-xs text-[#55665D] pt-1">
              &copy; {new Date().getFullYear()} AgriTech Bharat. Designed for smallholder and progressive farmers across India.
            </div>
          </div>

          {/* Official Portals */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 font-display">
              Official Indian Ag Portals
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-[#CCD7D0]">
              <li>
                <a
                  href="https://pmkisan.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white inline-flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-sm"
                >
                  PM-KISAN Portal <ExternalLink className="w-3 h-3 text-[#A3B5AA]" />
                </a>
              </li>
              <li>
                <a
                  href="https://pmfby.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white inline-flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-sm"
                >
                  PMFBY Crop Insurance <ExternalLink className="w-3 h-3 text-[#A3B5AA]" />
                </a>
              </li>
              <li>
                <a
                  href="https://soilhealth.dac.gov.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white inline-flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-sm"
                >
                  Soil Health Card Portal <ExternalLink className="w-3 h-3 text-[#A3B5AA]" />
                </a>
              </li>
              <li>
                <a
                  href="https://icar.org.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white inline-flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-sm"
                >
                  ICAR Research Network <ExternalLink className="w-3 h-3 text-[#A3B5AA]" />
                </a>
              </li>
            </ul>
          </div>

          {/* Advisory Guardrails */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-3 font-display">
              Ethics & Transparency
            </h4>
            <p className="text-xs text-[#A3B5AA] leading-relaxed">
              All plant leaf diagnoses are preliminary visual indicators and not a lab culture. Farmers must follow the product label instructions and verify with their local Krishi Vigyan Kendra (KVK) before chemical intervention.
            </p>
          </div>
        </div>

        {/* What AgriTech Does Not Do Box */}
        <div className="p-4 rounded-2xl bg-[#0D281A]/60 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center gap-3 text-xs text-[#CCD7D0]">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="leading-relaxed">
            <strong className="text-white font-semibold">What AgriTech Does Not Do: </strong>
            AgriTech does not guarantee crop yields, forecast speculative market auction rates, or disburse government subsidies. We provide educational recommendations and direct links to official Ministry portals.
          </div>
        </div>
      </div>
    </footer>
  );
};

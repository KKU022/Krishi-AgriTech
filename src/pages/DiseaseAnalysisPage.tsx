import React, { useState, useRef, useEffect } from 'react';
import {
  ScanLine,
  Upload,
  Camera,
  FileImage,
  AlertTriangle,
  CheckCircle2,
  X,
  History,
  ShieldAlert,
  Info,
  Loader2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useToast } from '../context/ToastContext.js';
import { apiRequest } from '../lib/api.js';
import { validateAndStripImageExif, ProcessedImage } from '../lib/imageProcessor.js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card.js';
import { PageHeader } from '../components/common/PageHeader.js';
import { Button } from '../components/common/Button.js';
import { Badge } from '../components/common/Badge.js';
import { Input } from '../components/common/Input.js';
import { Alert } from '../components/common/Alert.js';
import { DiseaseAnalysisRecord } from '../types.js';
import { getDiseaseResultView } from '../lib/diseaseResult.js';
import { formatTimestamp } from '../lib/dateTime.js';

export const DiseaseAnalysisPage: React.FC = () => {
  const toast = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [processedImage, setProcessedImage] = useState<ProcessedImage | null>(null);
  const [cropHint, setCropHint] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const [currentResult, setCurrentResult] = useState<DiseaseAnalysisRecord | null>(null);
  const [history, setHistory] = useState<DiseaseAnalysisRecord[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  const fetchHistory = async () => {
    try {
      const response = await apiRequest<{ analyses: DiseaseAnalysisRecord[] }>('/disease/history');
      const records = response.analyses;
      setHistory(records);
      if (records.length > 0 && !currentResult) {
        setCurrentResult(records[0]);
      }
    } catch (err) {
      console.warn('Failed to load disease history:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleProcessFile = async (file: File) => {
    setErrorMessage('');
    setIsProcessingFile(true);
    try {
      const processed = await validateAndStripImageExif(file);
      setProcessedImage(processed);
      toast.info('Image prepared', `EXIF stripped on device · ${(processed.sizeBytes / 1024).toFixed(0)} KB.`);
    } catch (err: any) {
      const msg = err.message || 'Failed to process image file.';
      setErrorMessage(msg);
      toast.error('Image error', msg);
      setProcessedImage(null);
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleProcessFile(file);
    if (e.target) e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleAnalyze = async () => {
    if (!processedImage) {
      setErrorMessage('Please select or capture a plant photo first.');
      return;
    }

    setErrorMessage('');
    setIsAnalyzing(true);

    try {
      const result = await apiRequest<DiseaseAnalysisRecord>('/disease/analyze', {
        method: 'POST',
        body: JSON.stringify({
          imageBase64: processedImage.dataUri,
          cropHint: cropHint.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      setCurrentResult(result);

      toast.success('Analysis complete', 'Pathology assessment and IPM management protocol generated.');
      fetchHistory();
    } catch (err: any) {
      const msg = err.message || 'Diagnostic analysis could not be completed. Please retry with a clearer photo.';
      setErrorMessage(msg);
      toast.error('Analysis failed', msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearSelection = () => {
    setProcessedImage(null);
    setErrorMessage('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header */}
      <PageHeader
        badge="Structured Visual Diagnostics"
        title="Plant Disease & Leaf Pathology Screening"
        description="Privacy-first plant pathology: EXIF metadata is stripped on your device before analysis. Never stored as raw images."
        action={
          <Button
            variant="glass"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            icon={<History className="w-4 h-4 text-[#54F5BC]" />}
            className="text-xs"
          >
            {showHistory ? 'Hide History' : `Past Analyses (${history.length})`}
          </Button>
        }
      />

      {/* Prominent Disclaimer Banner (STRICT REQUIREMENT) */}
      <div className="p-4 rounded-2xl bg-[#FFC76A]/10 border border-[#FFC76A]/30 backdrop-blur-md flex items-start gap-3 shadow-[0_4px_20px_rgba(255,199,106,0.08)]">
        <ShieldAlert className="w-5 h-5 text-[#FFC76A] shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-[#F4F7F1] leading-relaxed">
          <strong className="font-bold text-[#FFC76A]">Important Agronomic Notice: </strong>
          Preliminary guidance from an image. Not a confirmed laboratory diagnosis. Consult your local Krishi Vigyan Kendra (KVK) or block agricultural officer before purchasing or applying chemical sprays.
        </div>
      </div>

      {/* History Drawer if toggled */}
      {showHistory && (
        <Card variant="glass" className="border-emerald-500/25">
          <CardHeader>
            <CardTitle className="text-base text-[#F4F7F1]">Past Plant Diagnostics</CardTitle>
            <CardDescription className="text-[#B6F5D9]/75">Structured symptoms and recommendations saved without images.</CardDescription>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-xs text-[#B6F5D9]/70">No past plant analyses recorded yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {history.map((rec) => (
                  <button
                    key={rec.id}
                    onClick={() => {
                      setCurrentResult(rec);
                      setShowHistory(false);
                    }}
                    className={`p-3 rounded-xl border text-left text-xs space-y-1 transition-all cursor-pointer ${
                      currentResult?.id === rec.id
                        ? 'border-[#FFC76A] bg-[#FFC76A]/15 text-[#F4F7F1] font-medium shadow-[0_0_15px_rgba(255,199,106,0.2)]'
                        : 'border-emerald-500/20 bg-black/40 hover:border-emerald-400/40 text-[#B6F5D9]'
                    }`}
                  >
                    <div className="font-bold text-[#F4F7F1] flex justify-between">
                      <span className="truncate">{getDiseaseResultView(rec.result).conditions[0]?.name || 'No condition findings'}</span>
                      <span className="capitalize text-[#FFC76A] font-bold">{getDiseaseResultView(rec.result).certaintyLevel || 'Unavailable'}</span>
                    </div>
                    <div className="text-[#B6F5D9]/70 text-[11px] truncate">
                      {formatTimestamp(rec.timestamp, { dateStyle: 'medium' })} · {rec.cropHint || 'Unspecified crop'}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Grid: Upload (Left) and Results (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Upload Column */}
        <div className="lg:col-span-5 space-y-6">
          <Card variant="glass">
            <CardHeader>
              <CardTitle className="text-lg">Upload Plant Photo</CardTitle>
              <CardDescription>
                Accepted: JPEG, PNG, or WebP (max 5 MB). Clear focus on affected leaves produces the most accurate observations.
              </CardDescription>
            </CardHeader>

            {errorMessage && (
              <Alert variant="error" className="mb-4 text-xs">
                {errorMessage}
              </Alert>
            )}

            {/* Hidden file inputs */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />

            {!processedImage ? (
              <div className="space-y-4">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-[#00B879] bg-[#00B879]/15 shadow-[0_0_20px_rgba(0,184,121,0.2)]'
                      : 'border-emerald-500/30 hover:border-[#54F5BC] bg-black/40 hover:bg-black/60'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3 text-[#54F5BC] shadow-2xs">
                    {isProcessingFile ? (
                      <Loader2 className="w-6 h-6 animate-spin text-[#00B879]" />
                    ) : (
                      <Upload className="w-6 h-6 text-[#54F5BC]" />
                    )}
                  </div>
                  <div className="font-bold text-[#F4F7F1] text-sm">
                    {isProcessingFile ? 'Stripping EXIF & Validating...' : 'Drag & Drop or Click to Upload'}
                  </div>
                  <p className="text-xs text-[#B6F5D9]/75 mt-1">
                    JPEG, PNG, or WebP up to 5 MB
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="glass"
                    className="w-full justify-center text-xs text-[#F4F7F1]"
                    onClick={() => cameraInputRef.current?.click()}
                    icon={<Camera className="w-4 h-4 text-[#54F5BC]" />}
                  >
                    Open Camera
                  </Button>
                  <Button
                    type="button"
                    variant="glass"
                    className="w-full justify-center text-xs text-[#F4F7F1]"
                    onClick={() => fileInputRef.current?.click()}
                    icon={<FileImage className="w-4 h-4 text-[#B6F5D9]" />}
                  >
                    Browse Files
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden border border-emerald-500/25 bg-black/60 flex items-center justify-center max-h-72">
                  <img
                    src={processedImage.dataUri}
                    alt="Processed sanitized plant leaf"
                    className="object-contain max-h-72 w-full"
                  />
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="absolute top-2 right-2 p-1.5 bg-black/80 text-[#F4F7F1] rounded-full hover:bg-black cursor-pointer border border-emerald-500/30"
                    title="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-black/80 text-[#B6F5D9] text-[10px] font-mono border border-emerald-500/20">
                    EXIF Stripped · {(processedImage.sizeBytes / 1024).toFixed(0)} KB
                  </div>
                </div>

                <Input
                  label="Crop or Plant Name (Optional)"
                  placeholder="e.g. Paddy / Rice, Tomato, Cotton, Wheat"
                  value={cropHint}
                  onChange={(e) => setCropHint(e.target.value)}
                  helperText="Specifying the crop helps narrow pathogen candidates."
                />

                <Input
                  label="Field Observations / Notes (Optional)"
                  placeholder="e.g. Lesions appeared 3 days ago after continuous rain"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />

                <Button
                  type="button"
                  variant="primary"
                  className="w-full justify-center shadow-md font-semibold"
                  onClick={handleAnalyze}
                  isLoading={isAnalyzing}
                >
                  Run Plant Pathology Analysis
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Diagnostic Results Column */}
        <div className="lg:col-span-7 space-y-6">
          {!currentResult ? (
            <Card variant="glass" className="text-center py-16 px-6 border-dashed border-emerald-500/25 bg-black/30">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-[#FFC76A] flex items-center justify-center mx-auto mb-3 shadow-[0_0_15px_rgba(255,199,106,0.2)]">
                <ScanLine className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#F4F7F1]">Awaiting Plant Photo</h3>
              <p className="text-xs sm:text-sm text-[#B6F5D9]/80 max-w-md mx-auto mt-1 leading-relaxed">
                Capture or upload an affected leaf on the left. The engine will screen visual symptoms and return structured IPM management guidance.
              </p>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Primary Diagnostic Card */}
              <Card variant="glass" className="border-t-2 border-t-[#FFC76A]">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            getDiseaseResultView(currentResult.result).certaintyLevel === 'high'
                              ? 'accent'
                              : getDiseaseResultView(currentResult.result).certaintyLevel === 'medium'
                              ? 'warning'
                              : 'neutral'
                          }
                        >
                          {getDiseaseResultView(currentResult.result).certaintyLevel?.toUpperCase() || 'CERTAINTY UNAVAILABLE'}
                        </Badge>
                        <span className="text-xs text-[#B6F5D9]/60">
                          {formatTimestamp(currentResult.timestamp, { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                      </div>
                      <CardTitle className="text-xl mt-1.5 text-[#F4F7F1]">
                        {getDiseaseResultView(currentResult.result).conditions[0]?.name || 'No condition findings returned'}
                      </CardTitle>
                    </div>
                    {currentResult.cropHint && (
                      <Badge variant="forest">{currentResult.cropHint}</Badge>
                    )}
                  </div>
                  <CardDescription className="text-[#B6F5D9]/75">
                    Structured agronomic evaluation parsed and validated on the server.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Possible Conditions */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#B6F5D9] mb-2">
                      Possible Conditions Identified
                    </h4>
                    <div className="space-y-2.5">
                      {getDiseaseResultView(currentResult.result).conditions.length === 0 && <p className="text-xs text-[#B6F5D9]/60">No possible conditions were returned.</p>}
                      {getDiseaseResultView(currentResult.result).conditions.map((cond, i) => (
                        <div
                          key={i}
                          className="p-3.5 rounded-xl border border-emerald-500/20 bg-black/40 space-y-1 shadow-2xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#F4F7F1] text-sm">
                              {cond.name}
                            </span>
                            <Badge variant="neutral">{cond.pathogenType || 'Not specified'}</Badge>
                          </div>
                          <p className="text-xs text-[#B6F5D9]/80 leading-relaxed">
                            {cond.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Visible Symptoms */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#B6F5D9] mb-2">
                      Visible Symptoms Observed
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {getDiseaseResultView(currentResult.result).visibleSymptoms.length === 0 && <p className="text-xs text-[#B6F5D9]/60">No visible symptoms were returned.</p>}
                      {getDiseaseResultView(currentResult.result).visibleSymptoms.map((sym, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md bg-white/10 text-[#F4F7F1] border border-emerald-500/25"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#54F5BC]" />
                          {sym}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* General Prevention Steps */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#B6F5D9] mb-2">
                      Cultural & Preventive Integrated Pest Management (IPM)
                    </h4>
                    <ul className="space-y-2 text-xs text-[#F4F7F1]">
                      {getDiseaseResultView(currentResult.result).preventionSteps.length === 0 && <li className="text-[#B6F5D9]/60">No prevention guidance was returned.</li>}
                      {getDiseaseResultView(currentResult.result).preventionSteps.map((step, i) => (
                        <li key={i} className="flex items-start gap-2 bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/25">
                          <CheckCircle2 className="w-4 h-4 text-[#54F5BC] shrink-0 mt-0.5" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Expert Advice Note */}
                  <div className="p-3.5 rounded-xl bg-[#FFC76A]/10 border border-[#FFC76A]/30 text-xs text-[#F4F7F1] flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-[#FFC76A] shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold block mb-0.5 text-[#FFC76A]">Recommended Next Action:</strong>
                      {getDiseaseResultView(currentResult.result).expertAdvice || 'No additional recommendation was returned.'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  X,
  FileSpreadsheet,
  FileText,
  Plus,
  Trash2,
  ShieldCheck,
  Droplets,
  Sprout,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  Search,
} from 'lucide-react';
import {
  PhytosanitaryRecord,
  FertilizationRecord,
  loadPhytosanitaryRecords,
  savePhytosanitaryRecord,
  deletePhytosanitaryRecord,
  loadFertilizationRecords,
  saveFertilizationRecord,
  deleteFertilizationRecord,
} from '../lib/fieldbook/fieldBookStore';
import {
  exportFieldBookExcel,
  exportFieldBookPdf,
  FieldBookExportParams,
} from '../lib/fieldbook/fieldBookExporter';
import { Language, translations } from '../lib/i18n';

interface FieldBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  farmName: string;
  parcelName: string;
  cropName: string;
  companyName?: string;
  taxId?: string;
  cadastralAddress?: string;
  agronomistName?: string;
  licenseNumber?: string;
  customLogoUrl?: string;
  lang?: Language;
  theme?: 'dark' | 'light';
  initialPhytoPrefill?: Partial<PhytosanitaryRecord> | null;
  initialFertPrefill?: Partial<FertilizationRecord> | null;
}

export const FieldBookModal: React.FC<FieldBookModalProps> = ({
  isOpen,
  onClose,
  farmName,
  parcelName,
  cropName,
  companyName = 'Finagra, S.A. (Herdade do Esporão)',
  taxId = 'PT 500 123 456',
  cadastralAddress = 'Apartado 157, 7200-999 Reguengos de Monsaraz',
  agronomistName = 'Eng. Agrónomo Miguel Silva',
  licenseNumber = 'OE-AGR-49120',
  customLogoUrl,
  lang = 'pt',
  theme = 'dark',
  initialPhytoPrefill,
  initialFertPrefill,
}) => {
  const isLight = theme === 'light';
  const isEn = lang === 'en';

  const [activeTab, setActiveTab] = useState<'phyto' | 'fert'>('phyto');
  const [phytoRecords, setPhytoRecords] = useState<PhytosanitaryRecord[]>([]);
  const [fertRecords, setFertRecords] = useState<FertilizationRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParcelFilter, setSelectedParcelFilter] = useState('ALL');

  // Form toggles
  const [showAddPhyto, setShowAddPhyto] = useState(false);
  const [showAddFert, setShowAddFert] = useState(false);

  // Phyto Form State
  const [pDate, setPDate] = useState(new Date().toISOString().slice(0, 10));
  const [pParcel, setPParcel] = useState(parcelName);
  const [pCrop, setPCrop] = useState(cropName);
  const [pProduct, setPProduct] = useState('');
  const [pApv, setPApv] = useState('');
  const [pSubstance, setPSubstance] = useState('');
  const [pDose, setPDose] = useState<number>(2.0);
  const [pUnit, setPUnit] = useState<'l/ha' | 'kg/ha'>('kg/ha');
  const [pSprayVol, setPSprayVol] = useState<number>(400);
  const [pTarget, setPTarget] = useState('');
  const [pSafetyDays, setPSafetyDays] = useState<number>(14);
  const [pApplicator, setPApplicator] = useState('João Carlos Ferreira');
  const [pCard, setPCard] = useState('APL-EVR-89412');
  const [pNotes, setPNotes] = useState('');

  // Fert Form State
  const [fDate, setFDate] = useState(new Date().toISOString().slice(0, 10));
  const [fParcel, setFParcel] = useState(parcelName);
  const [fCrop, setFCrop] = useState(cropName);
  const [fType, setFType] = useState<'mineral' | 'organico' | 'fertirrega' | 'foliar'>('mineral');
  const [fProduct, setFProduct] = useState('CAN-27 (Nitrato de Amónio Calcário)');
  const [fRate, setFRate] = useState<number>(150);
  const [fN, setFN] = useState<number>(40.5);
  const [fP, setFP] = useState<number>(0);
  const [fK, setFK] = useState<number>(0);
  const [fVra, setFVra] = useState<boolean>(true);
  const [fNotes, setFNotes] = useState('Aplicação prescrita com base em satélite Sentinel-2.');

  // Load records
  useEffect(() => {
    if (isOpen) {
      setPhytoRecords(loadPhytosanitaryRecords());
      setFertRecords(loadFertilizationRecords());
    }
  }, [isOpen]);

  // Handle incoming pre-fills from external components (e.g. DiseaseRiskWidget)
  useEffect(() => {
    if (initialPhytoPrefill) {
      setActiveTab('phyto');
      setShowAddPhyto(true);
      if (initialPhytoPrefill.commercialProduct) setPProduct(initialPhytoPrefill.commercialProduct);
      if (initialPhytoPrefill.homologationNumber) setPApv(initialPhytoPrefill.homologationNumber);
      if (initialPhytoPrefill.activeSubstance) setPSubstance(initialPhytoPrefill.activeSubstance);
      if (initialPhytoPrefill.targetOrganism) setPTarget(initialPhytoPrefill.targetOrganism);
      if (initialPhytoPrefill.operatorNotes) setPNotes(initialPhytoPrefill.operatorNotes);
      if (initialPhytoPrefill.dose) setPDose(initialPhytoPrefill.dose);
    }
  }, [initialPhytoPrefill]);

  useEffect(() => {
    if (initialFertPrefill) {
      setActiveTab('fert');
      setShowAddFert(true);
      if (initialFertPrefill.commercialProduct) setFProduct(initialFertPrefill.commercialProduct);
      if (initialFertPrefill.rateKgHa) setFRate(initialFertPrefill.rateKgHa);
      if (initialFertPrefill.nutrientUnitsN) setFN(initialFertPrefill.nutrientUnitsN);
      if (initialFertPrefill.technicalNotes) setFNotes(initialFertPrefill.technicalNotes);
    }
  }, [initialFertPrefill]);

  // Distinct parcels for filtering
  const parcelOptions = useMemo(() => {
    const list = new Set<string>();
    phytoRecords.forEach((r) => list.add(r.parcelName));
    fertRecords.forEach((r) => list.add(r.parcelName));
    if (parcelName) list.add(parcelName);
    return Array.from(list);
  }, [phytoRecords, fertRecords, parcelName]);

  // Filtered lists
  const filteredPhyto = useMemo(() => {
    return phytoRecords.filter((r) => {
      const matchParcel = selectedParcelFilter === 'ALL' || r.parcelName === selectedParcelFilter;
      const matchSearch =
        searchTerm === '' ||
        r.commercialProduct.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.activeSubstance.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.targetOrganism.toLowerCase().includes(searchTerm.toLowerCase());
      return matchParcel && matchSearch;
    });
  }, [phytoRecords, selectedParcelFilter, searchTerm]);

  const filteredFert = useMemo(() => {
    return fertRecords.filter((r) => {
      const matchParcel = selectedParcelFilter === 'ALL' || r.parcelName === selectedParcelFilter;
      const matchSearch =
        searchTerm === '' ||
        r.commercialProduct.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.fertilizerType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.technicalNotes && r.technicalNotes.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchParcel && matchSearch;
    });
  }, [fertRecords, selectedParcelFilter, searchTerm]);

  if (!isOpen) return null;

  const handleAddPhytoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const created = savePhytosanitaryRecord({
      date: pDate,
      farmId: 'farm-current',
      parcelName: pParcel,
      crop: pCrop,
      commercialProduct: pProduct,
      homologationNumber: pApv || 'APV n.º pendente',
      activeSubstance: pSubstance,
      dose: Number(pDose),
      unit: pUnit,
      sprayVolumeLHa: Number(pSprayVol),
      targetOrganism: pTarget,
      safetyIntervalDays: Number(pSafetyDays),
      applicatorName: pApplicator,
      applicatorCardNumber: pCard,
      operatorNotes: pNotes,
    });
    setPhytoRecords((prev) => [created, ...prev]);
    setShowAddPhyto(false);
    setPProduct('');
    setPSubstance('');
    setPTarget('');
  };

  const handleAddFertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const created = saveFertilizationRecord({
      date: fDate,
      farmId: 'farm-current',
      parcelName: fParcel,
      crop: fCrop,
      fertilizerType: fType,
      commercialProduct: fProduct,
      rateKgHa: Number(fRate),
      nutrientUnitsN: Number(fN),
      nutrientUnitsP2O5: Number(fP),
      nutrientUnitsK2O: Number(fK),
      vraPrescriptionLinked: fVra,
      technicalNotes: fNotes,
    });
    setFertRecords((prev) => [created, ...prev]);
    setShowAddFert(false);
  };

  const handleDeletePhyto = (id: string) => {
    const updated = deletePhytosanitaryRecord(id);
    setPhytoRecords(updated);
  };

  const handleDeleteFert = (id: string) => {
    const updated = deleteFertilizationRecord(id);
    setFertRecords(updated);
  };

  const exportParams: FieldBookExportParams = {
    phytoRecords,
    fertRecords,
    farmName,
    companyName,
    taxId,
    cadastralAddress,
    agronomistName,
    licenseNumber,
    customLogoUrl,
    lang,
    year: new Date().getFullYear(),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none overflow-y-auto">
      <div
        className={`relative w-full max-w-5xl rounded-3xl border shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto transition-colors ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900'
            : 'bg-[#090d16] border-slate-800 text-slate-100'
        }`}
      >
        {/* Modal Header Bar */}
        <div
          className={`px-6 py-4 border-b flex flex-wrap items-center justify-between gap-3 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/80 border-slate-800'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className={`text-base font-bold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {isEn ? 'Official Digital Field Book' : 'Caderno de Campo Digital Oficial'}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  DGAV / IFAP / PAC 2023-2027
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isEn
                  ? `${farmName} • Regulatory traceability & audit-ready records`
                  : `${farmName} • Rastreabilidade regulamentar e registos para auditoria`}
              </p>
            </div>
          </div>

          {/* Action Export Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => exportFieldBookExcel(exportParams)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/40 text-emerald-400 font-bold text-xs transition-all"
              title={isEn ? 'Export Microsoft Excel .xlsx' : 'Exportar Ficheiro Excel .xlsx'}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>{isEn ? 'Export Excel (.xlsx)' : 'Exportar Excel (.xlsx)'}</span>
            </button>

            <button
              onClick={() => exportFieldBookPdf(exportParams)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs transition-all shadow-md shadow-emerald-600/30"
              title={isEn ? 'Export Official DGAV Audit PDF' : 'Exportar PDF Oficial DGAV / IFAP'}
            >
              <FileText className="w-4 h-4" />
              <span>{isEn ? 'Official DGAV PDF' : 'PDF Oficial DGAV'}</span>
            </button>

            <button
              onClick={onClose}
              className={`p-1.5 rounded-xl border transition-colors ${
                isLight
                  ? 'border-slate-300 text-slate-500 hover:bg-slate-200'
                  : 'border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs & Search Toolbar */}
        <div
          className={`px-6 py-3 border-b flex flex-wrap items-center justify-between gap-3 ${
            isLight ? 'bg-slate-100/70 border-slate-200' : 'bg-slate-950/70 border-slate-800'
          }`}
        >
          {/* Tabs */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('phyto')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 border ${
                activeTab === 'phyto'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                  : isLight
                  ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-200'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                {isEn ? 'Phytosanitary Treatments' : 'Tratamentos Fitossanitários'} ({phytoRecords.length})
              </span>
            </button>

            <button
              onClick={() => setActiveTab('fert')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 border ${
                activeTab === 'fert'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                  : isLight
                  ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-200'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <Droplets className="w-4 h-4" />
              <span>
                {isEn ? 'Fertilization & Nutrients' : 'Fertilizações & Nutrientes'} ({fertRecords.length})
              </span>
            </button>
          </div>

          {/* Filters and Add Buttons */}
          <div className="flex items-center space-x-2.5">
            {/* Parcel dropdown */}
            <select
              value={selectedParcelFilter}
              onChange={(e) => setSelectedParcelFilter(e.target.value)}
              className={`px-2.5 py-1.5 rounded-xl text-xs border focus:outline-none ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-800'
                  : 'bg-slate-900 border-slate-800 text-slate-300'
              }`}
            >
              <option value="ALL">{isEn ? 'All Parcels' : 'Todas as Parcelas'}</option>
              {parcelOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            {/* Quick Search */}
            <div className="relative">
              <input
                type="text"
                placeholder={isEn ? 'Search records...' : 'Pesquisar registo...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-8 pr-3 py-1.5 rounded-xl text-xs border focus:outline-none w-44 ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-800'
                    : 'bg-slate-900 border-slate-800 text-slate-200'
                }`}
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>

            {/* Add Record Button */}
            {activeTab === 'phyto' ? (
              <button
                onClick={() => setShowAddPhyto(!showAddPhyto)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddPhyto ? (isEn ? 'Cancel' : 'Fechar') : isEn ? 'Add Treatment' : 'Novo Tratamento'}</span>
              </button>
            ) : (
              <button
                onClick={() => setShowAddFert(!showAddFert)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddFert ? (isEn ? 'Cancel' : 'Fechar') : isEn ? 'Add Fertilization' : 'Nova Fertilização'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Body Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* TAB 1: PHYTOSANITARY TREATMENTS */}
          {activeTab === 'phyto' && (
            <div className="space-y-4">
              {/* Form Collapsible */}
              {showAddPhyto && (
                <form
                  onSubmit={handleAddPhytoSubmit}
                  className={`p-4 rounded-2xl border space-y-3 animate-in fade-in duration-200 ${
                    isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-900/90 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-800/40 pb-2">
                    <h4 className="text-xs font-bold text-emerald-400 flex items-center space-x-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span>{isEn ? 'Log New Phytosanitary Application' : 'Novo Registo de Tratamento Fitossanitário'}</span>
                    </h4>
                    <span className="text-[10px] text-slate-400">Portaria n.º 229/2013</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">{isEn ? 'Date' : 'Data'}</label>
                      <input
                        type="date"
                        value={pDate}
                        onChange={(e) => setPDate(e.target.value)}
                        required
                        className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">{isEn ? 'Parcel / Plot' : 'Parcela'}</label>
                      <input
                        type="text"
                        value={pParcel}
                        onChange={(e) => setPParcel(e.target.value)}
                        required
                        className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">{isEn ? 'Crop' : 'Cultura'}</label>
                      <input
                        type="text"
                        value={pCrop}
                        onChange={(e) => setPCrop(e.target.value)}
                        required
                        className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">{isEn ? 'Commercial Product' : 'Produto Comercial'}</label>
                      <input
                        type="text"
                        placeholder="Ex: Cuprocol / Flint Max"
                        value={pProduct}
                        onChange={(e) => setPProduct(e.target.value)}
                        required
                        className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">{isEn ? 'APV Homologation No.' : 'Nº APV / Homologação'}</label>
                      <input
                        type="text"
                        placeholder="Ex: APV nº 3624"
                        value={pApv}
                        onChange={(e) => setPApv(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">{isEn ? 'Active Substance' : 'Substância Ativa'}</label>
                      <input
                        type="text"
                        placeholder="Ex: Cobre (50%)"
                        value={pSubstance}
                        onChange={(e) => setPSubstance(e.target.value)}
                        required
                        className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">{isEn ? 'Dose & Unit' : 'Dose e Unidade'}</label>
                      <div className="flex space-x-1.5">
                        <input
                          type="number"
                          step="0.01"
                          value={pDose}
                          onChange={(e) => setPDose(parseFloat(e.target.value) || 0)}
                          required
                          className="w-2/3 px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                        />
                        <select
                          value={pUnit}
                          onChange={(e) => setPUnit(e.target.value as any)}
                          className="w-1/3 px-1.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                        >
                          <option value="kg/ha">kg/ha</option>
                          <option value="l/ha">l/ha</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">{isEn ? 'Spray Volume (l/ha)' : 'Volume Calda (l/ha)'}</label>
                      <input
                        type="number"
                        value={pSprayVol}
                        onChange={(e) => setPSprayVol(parseInt(e.target.value) || 0)}
                        required
                        className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">{isEn ? 'Target Pest / Reason' : 'Inimigo / Justificação'}</label>
                      <input
                        type="text"
                        placeholder="Ex: Míldio (Plasmopara viticola)"
                        value={pTarget}
                        onChange={(e) => setPTarget(e.target.value)}
                        required
                        className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">{isEn ? 'Safety Interval (Days)' : 'Intervalo Segurança (dias)'}</label>
                      <input
                        type="number"
                        value={pSafetyDays}
                        onChange={(e) => setPSafetyDays(parseInt(e.target.value) || 0)}
                        required
                        className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">{isEn ? 'Applicator Name' : 'Nome Aplicador'}</label>
                      <input
                        type="text"
                        value={pApplicator}
                        onChange={(e) => setPApplicator(e.target.value)}
                        required
                        className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">{isEn ? 'Applicator License Card' : 'Nº Cartão de Aplicador'}</label>
                      <input
                        type="text"
                        value={pCard}
                        onChange={(e) => setPCard(e.target.value)}
                        required
                        className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">{isEn ? 'Technical Notes' : 'Observações Técnicas'}</label>
                    <input
                      type="text"
                      placeholder="Ex: Condições climáticas ideais, vento < 7 km/h, bicos antideriva..."
                      value={pNotes}
                      onChange={(e) => setPNotes(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all"
                    >
                      {isEn ? 'Save Application Record' : 'Guardar Registo'}
                    </button>
                  </div>
                </form>
              )}

              {/* Records Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className={`text-[11px] uppercase font-mono ${isLight ? 'bg-slate-100 text-slate-700' : 'bg-slate-900 text-slate-400'}`}>
                    <tr>
                      <th className="p-3">{isEn ? 'Date' : 'Data'}</th>
                      <th className="p-3">{isEn ? 'Parcel' : 'Parcela'}</th>
                      <th className="p-3">{isEn ? 'Product / Substance' : 'Produto / Substância'}</th>
                      <th className="p-3 text-center">{isEn ? 'Dose' : 'Dose'}</th>
                      <th className="p-3 text-center">{isEn ? 'Spray Vol.' : 'Calda'}</th>
                      <th className="p-3">{isEn ? 'Target Pest' : 'Inimigo / Alvo'}</th>
                      <th className="p-3 text-center">{isEn ? 'Safety Int.' : 'I.S.'}</th>
                      <th className="p-3">{isEn ? 'Applicator' : 'Aplicador'}</th>
                      <th className="p-3 text-right">{isEn ? 'Action' : 'Ação'}</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800'}`}>
                    {filteredPhyto.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-8 text-slate-500">
                          {isEn ? 'No phytosanitary records found.' : 'Nenhum registo fitossanitário registado.'}
                        </td>
                      </tr>
                    ) : (
                      filteredPhyto.map((r) => (
                        <tr key={r.id} className={`${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-900/60'} transition-colors`}>
                          <td className="p-3 font-mono font-bold">{r.date}</td>
                          <td className="p-3 font-medium text-emerald-400">{r.parcelName}</td>
                          <td className="p-3">
                            <div className="font-bold">{r.commercialProduct}</div>
                            <div className="text-[10px] text-slate-400">{r.activeSubstance} ({r.homologationNumber})</div>
                          </td>
                          <td className="p-3 text-center font-mono font-bold">{r.dose} {r.unit}</td>
                          <td className="p-3 text-center font-mono">{r.sprayVolumeLHa} l/ha</td>
                          <td className="p-3">{r.targetOrganism}</td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              {r.safetyIntervalDays}d
                            </span>
                          </td>
                          <td className="p-3">
                            <div>{r.applicatorName}</div>
                            <div className="text-[10px] text-slate-400">{r.applicatorCardNumber}</div>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleDeletePhyto(r.id)}
                              className="p-1 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
                              title={isEn ? 'Delete record' : 'Eliminar registo'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: FERTILIZATIONS & NUTRIENTS */}
          {activeTab === 'fert' && (
            <div className="space-y-4">
              {/* Form Collapsible */}
              {showAddFert && (
                <form
                  onSubmit={handleAddFertSubmit}
                  className={`p-4 rounded-2xl border space-y-3 animate-in fade-in duration-200 ${
                    isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-900/90 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-800/40 pb-2">
                    <h4 className="text-xs font-bold text-emerald-400 flex items-center space-x-1.5">
                      <Droplets className="w-4 h-4" />
                      <span>{isEn ? 'Log Fertilization Application' : 'Novo Registo de Fertilização'}</span>
                    </h4>
                    <span className="text-[10px] text-slate-400">Diretiva Nitratos 91/676/CEE</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">{isEn ? 'Date' : 'Data'}</label>
                      <input
                        type="date"
                        value={fDate}
                        onChange={(e) => setFDate(e.target.value)}
                        required
                        className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">{isEn ? 'Parcel' : 'Parcela'}</label>
                      <input
                        type="text"
                        value={fParcel}
                        onChange={(e) => setFParcel(e.target.value)}
                        required
                        className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">{isEn ? 'Fertilizer Type' : 'Tipo Adubo'}</label>
                      <select
                        value={fType}
                        onChange={(e) => setFType(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                      >
                        <option value="mineral">{isEn ? 'Mineral Fertilizer' : 'Adubo Mineral'}</option>
                        <option value="organico">{isEn ? 'Organic Fertilizer' : 'Adubo Orgânico / Estrume'}</option>
                        <option value="fertirrega">{isEn ? 'Fertigation' : 'Fertirrega'}</option>
                        <option value="foliar">{isEn ? 'Foliar Spray' : 'Adubação Foliar'}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">{isEn ? 'Commercial Product' : 'Produto Comercial'}</label>
                      <input
                        type="text"
                        value={fProduct}
                        onChange={(e) => setFProduct(e.target.value)}
                        required
                        className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">{isEn ? 'Rate (kg/ha)' : 'Dose Adubo (kg/ha)'}</label>
                      <input
                        type="number"
                        value={fRate}
                        onChange={(e) => setFRate(parseFloat(e.target.value) || 0)}
                        required
                        className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">{isEn ? 'Pure Nitrogen N (kg/ha)' : 'Azoto N Puro (kg/ha)'}</label>
                      <input
                        type="number"
                        step="0.1"
                        value={fN}
                        onChange={(e) => setFN(parseFloat(e.target.value) || 0)}
                        required
                        className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">{isEn ? 'Phosphate P2O5 (kg/ha)' : 'Fósforo P2O5 (kg/ha)'}</label>
                      <input
                        type="number"
                        step="0.1"
                        value={fP}
                        onChange={(e) => setFP(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">{isEn ? 'Potassium K2O (kg/ha)' : 'Potássio K2O (kg/ha)'}</label>
                      <input
                        type="number"
                        step="0.1"
                        value={fK}
                        onChange={(e) => setFK(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-1">
                    <input
                      type="checkbox"
                      id="fVraCheck"
                      checked={fVra}
                      onChange={(e) => setFVra(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-emerald-500"
                    />
                    <label htmlFor="fVraCheck" className="text-xs font-semibold text-slate-300">
                      {isEn ? 'Directly linked to CropVision Satellite VRA Prescription' : 'Prescrição baseada em taxa variável (VRA) de Satélite CropVision'}
                    </label>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">{isEn ? 'Technical Notes' : 'Observações Técnicas'}</label>
                    <input
                      type="text"
                      value={fNotes}
                      onChange={(e) => setFNotes(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all"
                    >
                      {isEn ? 'Save Fertilization' : 'Guardar Fertilização'}
                    </button>
                  </div>
                </form>
              )}

              {/* Records Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className={`text-[11px] uppercase font-mono ${isLight ? 'bg-slate-100 text-slate-700' : 'bg-slate-900 text-slate-400'}`}>
                    <tr>
                      <th className="p-3">{isEn ? 'Date' : 'Data'}</th>
                      <th className="p-3">{isEn ? 'Parcel' : 'Parcela'}</th>
                      <th className="p-3">{isEn ? 'Type' : 'Tipo'}</th>
                      <th className="p-3">{isEn ? 'Product' : 'Produto'}</th>
                      <th className="p-3 text-right">{isEn ? 'Rate' : 'Dose'}</th>
                      <th className="p-3 text-right">{isEn ? 'Pure N' : 'N Puro'}</th>
                      <th className="p-3 text-right">{isEn ? 'P2O5' : 'P2O5'}</th>
                      <th className="p-3 text-right">{isEn ? 'K2O' : 'K2O'}</th>
                      <th className="p-3 text-center">{isEn ? 'VRA Origin' : 'VRA Satélite'}</th>
                      <th className="p-3 text-right">{isEn ? 'Action' : 'Ação'}</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800'}`}>
                    {filteredFert.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="text-center py-8 text-slate-500">
                          {isEn ? 'No fertilization records found.' : 'Nenhuma fertilização registada.'}
                        </td>
                      </tr>
                    ) : (
                      filteredFert.map((f) => (
                        <tr key={f.id} className={`${isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-900/60'} transition-colors`}>
                          <td className="p-3 font-mono font-bold">{f.date}</td>
                          <td className="p-3 font-medium text-emerald-400">{f.parcelName}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                              {f.fertilizerType}
                            </span>
                          </td>
                          <td className="p-3 font-bold">{f.commercialProduct}</td>
                          <td className="p-3 text-right font-mono">{f.rateKgHa} kg/ha</td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-400">{f.nutrientUnitsN.toFixed(1)} kg/ha</td>
                          <td className="p-3 text-right font-mono">{f.nutrientUnitsP2O5.toFixed(1)}</td>
                          <td className="p-3 text-right font-mono">{f.nutrientUnitsK2O.toFixed(1)}</td>
                          <td className="p-3 text-center">
                            {f.vraPrescriptionLinked ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                {isEn ? 'Sentinel VRA' : 'VRA Satélite'}
                              </span>
                            ) : (
                              <span className="text-slate-500 text-[10px]">
                                {isEn ? 'Standard' : 'Convencional'}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleDeleteFert(f.id)}
                              className="p-1 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
                              title={isEn ? 'Delete record' : 'Eliminar registo'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Bar with Legal Notice */}
        <div
          className={`px-6 py-3 border-t flex flex-wrap items-center justify-between text-[11px] ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950 border-slate-800 text-slate-400'
          }`}
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              {isEn
                ? 'Certified for official DGAV & IFAP on-site inspections and CAP cross-compliance audits.'
                : 'Formato aceite para inspeções oficiais da DGAV, controlos no local do IFAP e auditorias PAC.'}
            </span>
          </div>

          <div className="font-mono text-[10px] text-slate-500">
            {farmName} • {companyName} • NIF: {taxId}
          </div>
        </div>
      </div>
    </div>
  );
};

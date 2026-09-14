'use client';

import React, { useState } from 'react';
import {
  MapPin,
  AlertTriangle,
  Camera,
  X,
  PlusCircle,
  Bug,
  Droplets,
  Sprout,
  ShieldAlert,
} from 'lucide-react';
import {
  ScoutingCategory,
  ScoutingSeverity,
  CATEGORY_LABELS,
  ScoutingRecord,
} from '../lib/scouting/scoutingStore';
import { Language, translations } from '../lib/i18n';

interface ScoutingModalProps {
  isOpen: boolean;
  onClose: () => void;
  lat: number;
  lon: number;
  lang?: Language;
  onSave: (record: Omit<ScoutingRecord, 'id' | 'date'>) => void;
}

export const ScoutingModal: React.FC<ScoutingModalProps> = ({
  isOpen,
  onClose,
  lat,
  lon,
  lang = 'pt',
  onSave,
}) => {
  const [category, setCategory] = useState<ScoutingCategory>('pest_disease');
  const [severity, setSeverity] = useState<ScoutingSeverity>('medium');
  const [notes, setNotes] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | undefined>(undefined);

  const t = translations[lang] || translations.pt;

  if (!isOpen) return null;

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getLocalizedCategoryLabel = (cat: ScoutingCategory) => {
    switch (cat) {
      case 'pest_disease':
        return t.catPest;
      case 'irrigation_leak':
        return t.catLeak;
      case 'nutrient_deficiency':
        return t.catNutrient;
      case 'weeds':
        return t.catWeeds;
      default:
        return CATEGORY_LABELS[cat];
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) return;

    onSave({
      lat,
      lon,
      category,
      categoryLabel: getLocalizedCategoryLabel(category),
      severity,
      notes: notes.trim(),
      photoUrl: photoPreview,
      status: 'open',
    });

    setNotes('');
    setPhotoPreview(undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-md rounded-3xl bg-[#0b101b] border border-slate-800 shadow-2xl p-6 text-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono">
                {t.scoutingTitle}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {t.coordinatesLabel} {lat.toFixed(5)}°, {lon.toFixed(5)}°
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {t.categoryLabel}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ScoutingCategory)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
            >
              <option value="pest_disease">{t.catPest}</option>
              <option value="irrigation_leak">{t.catLeak}</option>
              <option value="nutrient_deficiency">{t.catNutrient}</option>
              <option value="weeds">{t.catWeeds}</option>
            </select>
          </div>

          {/* Severity */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {t.severityLabel}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'critical'] as ScoutingSeverity[]).map((sev) => (
                <button
                  type="button"
                  key={sev}
                  onClick={() => setSeverity(sev)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    severity === sev
                      ? sev === 'critical'
                        ? 'bg-red-600 border-red-400 text-white shadow-lg shadow-red-600/30'
                        : sev === 'medium'
                        ? 'bg-amber-600 border-amber-400 text-white shadow-lg shadow-amber-600/30'
                        : 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-600/30'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {sev === 'critical' ? t.sevCrit : sev === 'medium' ? t.sevMed : t.sevLow}
                </button>
              ))}
            </div>
          </div>

          {/* Agronomist Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {t.notesLabel}
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.notesPlaceholder}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 placeholder-slate-500 resize-none"
              required
            />
          </div>

          {/* Photo upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-sky-400" />
              <span>{t.attachPhoto}</span>
            </label>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoChange}
              className="w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-emerald-400 hover:file:bg-slate-700 cursor-pointer"
            />
            {photoPreview && (
              <div className="mt-2 relative w-24 h-24 rounded-lg overflow-hidden border border-emerald-500/40">
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors flex items-center gap-1.5 shadow-lg shadow-emerald-600/30"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t.recordPinBtn}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

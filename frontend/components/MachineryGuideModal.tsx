'use client';

import React, { useState } from 'react';
import {
  X,
  Tractor,
  HardDrive,
  FolderTree,
  CheckCircle2,
  AlertTriangle,
  Usb,
  HelpCircle,
  FileCode,
  Layers,
  ChevronRight,
  ExternalLink,
  Info
} from 'lucide-react';
import { Language } from '../lib/i18n';

interface MachineryGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: Language;
  theme?: 'dark' | 'light';
}

type TerminalType = 'johndeere' | 'trimble' | 'fendt';

export const MachineryGuideModal: React.FC<MachineryGuideModalProps> = ({
  isOpen,
  onClose,
  lang = 'pt',
  theme = 'dark',
}) => {
  const [selectedTerminal, setSelectedTerminal] = useState<TerminalType>('johndeere');

  if (!isOpen) return null;

  const isPt = lang === 'pt';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl bg-[#090d16] border border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Tractor className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <span>{isPt ? 'Guia de Instalação na Cabine do Trator' : 'In-Cab Tractor Terminal Setup Guide'}</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-400">
                  ISOBUS 11783
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {isPt
                  ? 'Como carregar mapas VRA de taxa variável via Pen USB na John Deere, Trimble ou Fendt'
                  : 'How to load VRA prescription maps via USB drive onto John Deere, Trimble or Fendt consoles'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Terminal Brand Selector Tabs */}
        <div className="p-3 sm:p-4 bg-slate-900/40 border-b border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => setSelectedTerminal('johndeere')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              selectedTerminal === 'johndeere'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <span>John Deere Gen4 (4600 / GS3)</span>
          </button>

          <button
            onClick={() => setSelectedTerminal('trimble')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              selectedTerminal === 'trimble'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
            <span>Trimble GFX-750 / Precision-IQ</span>
          </button>

          <button
            onClick={() => setSelectedTerminal('fendt')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              selectedTerminal === 'fendt'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400" />
            <span>Fendt VarioGuide / CCI ISOBUS</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs leading-relaxed">
          {/* Universal Prerequisites Banner */}
          <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-amber-200 flex items-start gap-3">
            <Usb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-amber-300 text-xs">
                {isPt ? 'Requisito Crítico do Disco USB' : 'Critical USB Drive Requirement'}
              </h4>
              <p className="text-[11px] text-amber-200/90">
                {isPt
                  ? 'A pen USB deve estar formatada obrigatoriamente no sistema de ficheiros FAT32 (consolas de trator não reconhecem NTFS ou exFAT). Capacidade recomendada: 4 GB a 32 GB.'
                  : 'The USB flash drive must be formatted as FAT32 (tractor displays do not read NTFS or exFAT). Recommended size: 4 GB to 32 GB.'}
              </p>
            </div>
          </div>

          {/* JOHN DEERE INSTRUCTIONS */}
          {selectedTerminal === 'johndeere' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-emerald-400" />
                    <span className="font-mono font-bold text-white text-xs">
                      {isPt ? 'Formato Recomendado: ISO-XML TaskData' : 'Recommended Format: ISO-XML TaskData'}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                    ISO 11783-10
                  </span>
                </div>

                {/* Directory Tree Visualization */}
                <div className="p-3 rounded-xl bg-slate-950 font-mono text-[11px] text-slate-300 border border-slate-800/80">
                  <div className="text-slate-400 font-bold mb-1">
                    {isPt ? 'Estrutura de Pastas na Raiz da Pen USB:' : 'USB Drive Root Folder Structure:'}
                  </div>
                  <div className="text-emerald-400">E:\ (Raiz USB)</div>
                  <div className="text-slate-400 pl-4">└── <span className="text-white font-bold">TASKDATA/</span></div>
                  <div className="text-slate-400 pl-8">├── <span className="text-emerald-400 font-bold">TASKDATA.XML</span> <span className="text-slate-500">(Cabeçalho da tarefa, talhão e grelha)</span></div>
                  <div className="text-slate-400 pl-8">└── <span className="text-sky-400 font-bold">TSK00001.BIN</span> <span className="text-slate-500">(Grelha binária de taxa variável)</span></div>
                </div>

                <div className="text-slate-400 text-[11px]">
                  {isPt
                    ? '⚠️ Atenção: O nome da pasta deve ser exatamente TASKDATA (em maiúsculas). Não crie subpastas intermediárias.'
                    : '⚠️ Note: The directory name must strictly be TASKDATA (all uppercase). Do not place inside nested subfolders.'}
                </div>
              </div>

              {/* Step by step for John Deere */}
              <div className="space-y-2.5">
                <h4 className="font-bold text-white text-xs font-mono uppercase tracking-wider">
                  {isPt ? 'Passo a Passo no Ecrã John Deere Gen4 / 4600:' : 'John Deere Gen4 / 4600 In-Cab Workflow:'}
                </h4>
                <ol className="space-y-2">
                  {[
                    isPt
                      ? 'No CropVision, clica no botão "Descarregar ISO-XML (ISOBUS)" e extrai a pasta TASKDATA para a raiz da pen USB.'
                      : 'In CropVision, click "Download ISO-XML (ISOBUS)" and unzip the TASKDATA folder into the USB root directory.',
                    isPt
                      ? 'Insere a pen USB na porta do monitor John Deere CommandCenter (apoio de braço ou coluna lateral).'
                      : 'Insert the USB drive into the John Deere CommandCenter monitor port on the armrest or cab pillar.',
                    isPt
                      ? 'Um popup de deteção de ficheiros USB surgirá no ecrã. Seleciona "Importar Dados" e escolhe a tarefa do talhão.'
                      : 'A USB prompt will appear on the display. Select "Import Data" and choose the imported parcel task.',
                    isPt
                      ? 'Acede à aplicação "Trabalho" -> "Taxa de Aplicação" -> escolhe "Prescrição de Taxa Variável (VRA)".'
                      : 'Go to "Work Setup" -> "Application Rate" -> select "Prescription Rate (VRA)".',
                    isPt
                      ? 'Verifica se a dose alvo (kg N/ha) muda dinamicamente nas zonas 1, 2 e 3 conforme o trator avança no campo.'
                      : 'Verify that the target dose (kg N/ha) shifts dynamically across zones 1, 2, and 3 as the tractor travels.'
                  ].map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold flex items-center justify-center shrink-0 text-[11px]">
                        {idx + 1}
                      </span>
                      <span className="text-slate-300 text-[11px] pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}

          {/* TRIMBLE INSTRUCTIONS */}
          {selectedTerminal === 'trimble' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-sky-400" />
                    <span className="font-mono font-bold text-white text-xs">
                      {isPt ? 'Formato Recomendado: Shapefile ESRI (.zip)' : 'Recommended Format: ESRI Shapefile (.zip)'}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-950 text-sky-400 border border-sky-500/30">
                    SHP + DBF + PRJ
                  </span>
                </div>

                {/* Directory Tree Visualization */}
                <div className="p-3 rounded-xl bg-slate-950 font-mono text-[11px] text-slate-300 border border-slate-800/80">
                  <div className="text-slate-400 font-bold mb-1">
                    {isPt ? 'Estrutura na Pen USB para Trimble Precision-IQ:' : 'USB Structure for Trimble Precision-IQ:'}
                  </div>
                  <div className="text-sky-400">E:\ (Raiz USB)</div>
                  <div className="text-slate-400 pl-4">└── <span className="text-white font-bold">AgGPS/</span></div>
                  <div className="text-slate-400 pl-8">└── <span className="text-white font-bold">Prescriptions/</span></div>
                  <div className="text-slate-400 pl-12">├── <span className="text-sky-400">talhao_vra.shp</span> <span className="text-slate-500">(Geometrias WGS84)</span></div>
                  <div className="text-slate-400 pl-12">├── <span className="text-sky-400">talhao_vra.dbf</span> <span className="text-slate-500">(Doses: N_RATE_KG)</span></div>
                  <div className="text-slate-400 pl-12">├── <span className="text-sky-400">talhao_vra.shx</span></div>
                  <div className="text-slate-400 pl-12">└── <span className="text-sky-400">talhao_vra.prj</span> <span className="text-slate-500">(EPSG:4326)</span></div>
                </div>

                <div className="p-2.5 rounded-lg bg-sky-950/40 border border-sky-500/30 text-[11px] text-sky-300 flex items-center gap-2">
                  <Info className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>
                    {isPt
                      ? 'O CropVision exporta atributos DBF com menos de 10 caracteres (N_RATE_KG, N_TOTAL_KG), prevenindo erros de coluna cortada no Precision-IQ.'
                      : 'CropVision strictly formats DBF field names under 10 chars (N_RATE_KG, N_TOTAL_KG), eliminating column truncation bugs on Precision-IQ.'}
                  </span>
                </div>
              </div>

              {/* Step by step for Trimble */}
              <div className="space-y-2.5">
                <h4 className="font-bold text-white text-xs font-mono uppercase tracking-wider">
                  {isPt ? 'Passo a Passo no Trimble GFX-750 / GFX-350:' : 'Trimble GFX-750 / GFX-350 Workflow:'}
                </h4>
                <ol className="space-y-2">
                  {[
                    isPt
                      ? 'No CropVision, descarrega o ficheiro "Descarregar Shapefile (.zip)" e descompacta os 4 ficheiros na pasta AgGPS/Prescriptions da pen.'
                      : 'In CropVision, click "Download Shapefile (.zip)" and extract the 4 files into the AgGPS/Prescriptions folder on USB.',
                    isPt
                      ? 'No monitor Trimble, abre a aplicação Precision-IQ e vai a Configurações -> Transferência de Dados.'
                      : 'On Trimble display, open Precision-IQ and navigate to Settings -> Data Transfer.',
                    isPt
                      ? 'Seleciona a Pen USB como origem e clica em "Importar Prescrições".'
                      : 'Choose the USB flash drive as source and tap "Import Prescriptions".',
                    isPt
                      ? 'Ao iniciar a tarefa no talhão, seleciona a prescrição importada e mapeia a coluna de taxa para "N_RATE_KG" (kg/ha).'
                      : 'When starting a field run, select the imported prescription and map the target rate column to "N_RATE_KG" (kg/ha).',
                    isPt
                      ? 'Ativa o controlador Field-IQ ou taxa variável ISOBUS e inicia o trabalho.'
                      : 'Engage Field-IQ or ISOBUS variable rate controller and begin application.'
                  ].map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                      <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 font-mono font-bold flex items-center justify-center shrink-0 text-[11px]">
                        {idx + 1}
                      </span>
                      <span className="text-slate-300 text-[11px] pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}

          {/* FENDT & ISOBUS UNIVERSAL */}
          {selectedTerminal === 'fendt' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-teal-400" />
                    <span className="font-mono font-bold text-white text-xs">
                      {isPt ? 'Fendt VarioGuide / CCI 1200 ISOBUS' : 'Fendt VarioGuide / CCI 1200 ISOBUS'}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-teal-950 text-teal-400 border border-teal-500/30">
                    ISO-XML TaskData
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 font-mono text-[11px] text-slate-300 border border-slate-800/80">
                  <div className="text-slate-400 font-bold mb-1">
                    {isPt ? 'Estrutura Universal na Pen USB:' : 'Universal USB Folder Structure:'}
                  </div>
                  <div className="text-teal-400">E:\ (Raiz USB)</div>
                  <div className="text-slate-400 pl-4">└── <span className="text-white font-bold">TASKDATA/</span></div>
                  <div className="text-slate-400 pl-8">└── <span className="text-teal-400 font-bold">TASKDATA.XML</span></div>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {isPt
                    ? 'Compatível diretamente com o gestor de tarefas Fendt Variotronic TI, Claas CEMIS 1200, Amazone Amatron 4 e Kverneland Tellus Pro via ISOBUS Task Controller (TC-BAS / TC-GEO).'
                    : 'Directly compatible with Fendt Variotronic TI, Claas CEMIS 1200, Amazone Amatron 4, and Kverneland Tellus Pro via ISOBUS Task Controller (TC-BAS / TC-GEO).'}
                </p>
              </div>

              {/* Step by step for Fendt */}
              <div className="space-y-2.5">
                <h4 className="font-bold text-white text-xs font-mono uppercase tracking-wider">
                  {isPt ? 'Passo a Passo no Terminal ISOBUS:' : 'Universal ISOBUS Terminal Steps:'}
                </h4>
                <ol className="space-y-2">
                  {[
                    isPt
                      ? 'Copia a pasta TASKDATA extraída do CropVision diretamente para a raiz da pen USB.'
                      : 'Copy the unzipped TASKDATA folder from CropVision directly to the USB drive root.',
                    isPt
                      ? 'Liga a pen ao terminal Fendt Varioterminal ou consola ISOBUS.'
                      : 'Connect the USB drive to the Fendt Varioterminal or ISOBUS console.',
                    isPt
                      ? 'No menu ISOBUS-TC (Task Controller), seleciona "Gestão de Tarefas" -> "Importar Ficheiro ISO-XML".'
                      : 'Under ISOBUS-TC (Task Controller), select "Task Management" -> "Import ISO-XML File".',
                    isPt
                      ? 'Associa o implemento (ex.: adubador de discos Amazone/Bogballe ou pulverizador) à prescrição TC-GEO.'
                      : 'Link the implement (e.g. Amazone/Bogballe fertilizer spreader or sprayer) to the TC-GEO prescription.',
                    isPt
                      ? 'Ativa o modo automático (GPS Rate Control) para ajuste milimétrico das doses por zona.'
                      : 'Engage automatic GPS Rate Control for dynamic zone-by-zone application rates.'
                  ].map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                      <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-400 font-mono font-bold flex items-center justify-center shrink-0 text-[11px]">
                        {idx + 1}
                      </span>
                      <span className="text-slate-300 text-[11px] pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}

          {/* PAC / IFAP Official Compliance Footer Note */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                {isPt
                  ? 'Ficheiros gerados em conformidade com o Caderno de Campo Digital e Portaria n.º 259/2012.'
                  : 'Files generated in compliance with Digital Field Book regulations & official NVZ ceilings.'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-600/30"
          >
            {isPt ? 'Entendido / Concluir' : 'Got it / Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

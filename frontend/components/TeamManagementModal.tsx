'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  UserPlus,
  Trash2,
  CheckCircle2,
  Clock,
  History,
  X,
  Compass,
  Tractor,
  GraduationCap,
  Crown,
  FileSpreadsheet,
  AlertCircle,
  ExternalLink,
  MapPin,
  Download,
} from 'lucide-react';
import {
  TeamMember,
  AuditLog,
  UserRole,
  fetchTeamMembers,
  inviteTeamMember,
  updateTeamMemberRole,
  removeTeamMember,
  fetchAuditLogs,
} from '../lib/team/teamService';
import { Language, translations } from '../lib/i18n';

interface TeamManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  farmId?: string;
  farmName?: string;
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  lang?: Language;
  theme?: 'dark' | 'light';
  currentParcelCoords?: { lat: number; lon: number };
  currentParcelName?: string;
}

export const TeamManagementModal: React.FC<TeamManagementModalProps> = ({
  isOpen,
  onClose,
  farmId = 'farm-esporao',
  farmName = 'Herdade do Esporão',
  activeRole,
  onRoleChange,
  lang = 'pt',
  theme = 'dark',
  currentParcelCoords = { lat: 38.3842, lon: -7.5519 },
  currentParcelName = 'Talhão 1',
}) => {
  const [activeTab, setActiveTab] = useState<'members' | 'audit' | 'operator_view'>('members');
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Invite Form State
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [inviteName, setInviteName] = useState<string>('');
  const [inviteRole, setInviteRole] = useState<UserRole>('agronomist');
  const [invitePhone, setInvitePhone] = useState<string>('');
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  const t = translations[lang] || translations.pt;
  const isLight = theme === 'light';

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      Promise.all([fetchTeamMembers(farmId), fetchAuditLogs(farmId)])
        .then(([m, a]) => {
          setMembers(m);
          setAuditLogs(a);
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, farmId]);

  if (!isOpen) return null;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName) return;

    try {
      const newMember = await inviteTeamMember(farmId, inviteEmail, inviteName, inviteRole, invitePhone);
      setMembers((prev) => [...prev.filter((m) => m.email !== newMember.email), newMember]);
      setInviteSuccess(
        lang === 'en'
          ? `Invitation sent to ${newMember.email} with ${newMember.role.toUpperCase()} role!`
          : `Convite enviado com sucesso para ${newMember.email} com perfil de ${newMember.role.toUpperCase()}!`
      );
      setInviteEmail('');
      setInviteName('');
      setInvitePhone('');
      setTimeout(() => setInviteSuccess(null), 4000);
      fetchAuditLogs(farmId).then(setAuditLogs);
    } catch (err: any) {
      console.error('Failed to invite member:', err);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (confirm(lang === 'en' ? 'Revoke team access for this member?' : 'Revogar acesso deste membro da equipa?')) {
      await removeTeamMember(farmId, memberId);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      fetchAuditLogs(farmId).then(setAuditLogs);
    }
  };

  const handleRoleUpdate = async (memberId: string, newRole: UserRole) => {
    await updateTeamMemberRole(farmId, memberId, newRole);
    setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)));
    fetchAuditLogs(farmId).then(setAuditLogs);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-950/80 border border-purple-500/40 text-purple-300">
            <Crown className="w-3 h-3 text-purple-400" />
            {lang === 'en' ? 'Owner / Admin' : 'Proprietário / Admin'}
          </span>
        );
      case 'agronomist':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-950/80 border border-blue-500/40 text-blue-300">
            <GraduationCap className="w-3 h-3 text-blue-400" />
            {lang === 'en' ? 'Agronomist (VRA/Sign)' : 'Eng. Agrónomo (VRA)'}
          </span>
        );
      case 'operator':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-950/80 border border-amber-500/40 text-amber-300">
            <Tractor className="w-3 h-3 text-amber-400" />
            {lang === 'en' ? 'Machine Operator' : 'Operador de Máquinas'}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div
        className={`relative w-full max-w-3xl rounded-3xl border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transition-colors ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#090d16] border-slate-800 text-slate-200'
        }`}
      >
        {/* MODAL HEADER */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between shrink-0 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base font-mono">
                  {lang === 'en' ? 'Team Management & B2B RBAC' : 'Gestão de Equipa & Acessos B2B'}
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400">
                  Enterprise
                </span>
              </div>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {farmName} • {lang === 'en' ? 'Role-Based Access Control & Traceability' : 'Perfis de Função e Trilho de Auditoria'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl transition-colors ${isLight ? 'text-slate-400 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ROLE SIMULATOR BAR */}
        <div className={`px-4 sm:px-5 py-2.5 border-b flex flex-wrap items-center justify-between text-xs gap-2 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold text-slate-400">
              {lang === 'en' ? 'Active Operating Role:' : 'Perfil de Acesso Atual:'}
            </span>
            <div className="flex items-center gap-1">
              {(['owner', 'agronomist', 'operator'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => onRoleChange(r)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold capitalize transition-all ${
                    activeRole === r
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : isLight
                      ? 'bg-slate-200/80 text-slate-700 hover:bg-slate-300'
                      : 'bg-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  {r === 'owner' ? (lang === 'en' ? 'Owner' : 'Proprietário') : r === 'agronomist' ? (lang === 'en' ? 'Agronomist' : 'Agrónomo') : (lang === 'en' ? 'Operator' : 'Tratorista')}
                </button>
              ))}
            </div>
          </div>
          <span className="text-[11px] font-mono text-emerald-500 font-medium">
            {activeRole === 'owner' ? '● Acesso Total (Faturação & Gestão)' : activeRole === 'agronomist' ? '● Validação VRA & Relatórios' : '● Modo Simplificado / Navegação Trator'}
          </span>
        </div>

        {/* TABS SELECTOR */}
        <div className={`px-4 sm:px-5 pt-3 flex items-center space-x-2 border-b shrink-0 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
          <button
            onClick={() => setActiveTab('members')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'members'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{lang === 'en' ? 'Team Members' : 'Membros da Equipa'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
              {members.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>{lang === 'en' ? 'Audit Trail' : 'Trilho de Auditoria'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
              {auditLogs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('operator_view')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'operator_view'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Tractor className="w-4 h-4" />
            <span>{lang === 'en' ? 'Tractor Operator View' : 'Vista do Tratorista'}</span>
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* TAB 1: MEMBERS */}
          {activeTab === 'members' && (
            <div className="space-y-5">
              {/* Quick Invite Form */}
              <form
                onSubmit={handleInvite}
                className={`p-4 rounded-2xl border space-y-3 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0c1322] border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-bold font-mono text-emerald-400 uppercase tracking-wider">
                  <UserPlus className="w-4 h-4" />
                  <span>{lang === 'en' ? 'Invite New Member' : 'Convidar Novo Elemento para a Exploração'}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <input
                    type="text"
                    required
                    placeholder={lang === 'en' ? 'Full Name' : 'Nome Completo'}
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className={`px-3 py-2 rounded-xl border text-xs outline-none focus:border-emerald-500 transition-colors ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  />
                  <input
                    type="email"
                    required
                    placeholder={lang === 'en' ? 'Work Email' : 'Email Profissional'}
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className={`px-3 py-2 rounded-xl border text-xs outline-none focus:border-emerald-500 transition-colors ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as UserRole)}
                    className={`px-3 py-2 rounded-xl border text-xs outline-none focus:border-emerald-500 transition-colors ${
                      isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  >
                    <option value="agronomist">{lang === 'en' ? 'Agronomist' : 'Eng. Agrónomo'}</option>
                    <option value="operator">{lang === 'en' ? 'Machine Operator' : 'Operador de Máquinas'}</option>
                    <option value="owner">{lang === 'en' ? 'Owner / Admin' : 'Proprietário / Admin'}</option>
                  </select>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{lang === 'en' ? 'Send Invite' : 'Enviar Convite'}</span>
                  </button>
                </div>

                {inviteSuccess && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{inviteSuccess}</span>
                  </div>
                )}
              </form>

              {/* Members Table */}
              <div className={`rounded-2xl border overflow-hidden ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                <div className={`p-3 border-b text-xs font-mono font-bold uppercase tracking-wider ${isLight ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-slate-900/90 border-slate-800 text-slate-400'}`}>
                  {lang === 'en' ? 'Active Farm Personnel' : 'Pessoal Ativo na Exploração Agrícola'}
                </div>
                <div className="divide-y divide-slate-800/60">
                  {members.map((m) => (
                    <div
                      key={m.id}
                      className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                        isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-900/40'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-bold text-xs text-emerald-400 uppercase shrink-0">
                          {m.name.slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs truncate">{m.name}</span>
                            {getRoleBadge(m.role)}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">
                            {m.email} {m.phone && `• ${m.phone}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                        <select
                          value={m.role}
                          onChange={(e) => handleRoleUpdate(m.id, e.target.value as UserRole)}
                          className={`px-2 py-1 rounded-lg border text-[11px] font-semibold outline-none ${
                            isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-800 border-slate-700 text-slate-200'
                          }`}
                        >
                          <option value="owner">Owner</option>
                          <option value="agronomist">Agronomist</option>
                          <option value="operator">Operator</option>
                        </select>
                        <button
                          onClick={() => handleRemove(m.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                          title={lang === 'en' ? 'Revoke Access' : 'Revogar Acesso'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <p className="text-slate-400">
                  {lang === 'en'
                    ? 'Immutable agronomic audit log for compliance with IFAP, APA, and GlobalG.A.P.'
                    : 'Registo imutável de rastreabilidade para inspeções do IFAP, APA e certificação GlobalG.A.P.'}
                </p>
              </div>

              <div className={`rounded-2xl border divide-y overflow-hidden ${isLight ? 'border-slate-200 divide-slate-200' : 'border-slate-800 divide-slate-800/80'}`}>
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-3.5 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white">{log.action}</span>
                        <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-slate-800 text-slate-400 uppercase">
                          {log.userRole}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(log.createdAt).toLocaleString('pt-PT', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Executado por: <strong className="text-slate-300">{log.userEmail}</strong>
                    </p>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <pre className={`text-[10px] font-mono p-2 rounded-xl overflow-x-auto ${isLight ? 'bg-slate-100 text-slate-800' : 'bg-slate-900/90 text-emerald-400'}`}>
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: OPERATOR SIMPLIFIED VIEW */}
          {activeTab === 'operator_view' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start gap-3">
                <Tractor className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold text-white">
                    {lang === 'en' ? 'Machine Operator / Tractor In-Cab Interface' : 'Interface Simplificada de Cabine para Operador / Tratorista'}
                  </p>
                  <p className="text-slate-400 mt-0.5">
                    {lang === 'en'
                      ? 'Streamlined mobile view designed for rugged field tablets and smartphones mounted in tractor cabs.'
                      : 'Ecrã simplificado de alto contraste para tablets e telemóveis montados no tablier do trator.'}
                  </p>
                </div>
              </div>

              {/* Action Card: Navigation to Parcel */}
              <div className={`p-4 rounded-2xl border space-y-3 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0c1322] border-slate-800'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-emerald-400" />
                      <span>{currentParcelName}</span>
                    </h4>
                    <p className="text-xs text-slate-400">
                      Coordenadas: {currentParcelCoords.lat.toFixed(5)}, {currentParcelCoords.lon.toFixed(5)}
                    </p>
                  </div>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${currentParcelCoords.lat},${currentParcelCoords.lon}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20"
                  >
                    <Compass className="w-4 h-4" />
                    <span>{lang === 'en' ? 'GPS Route (Maps)' : 'Navegar até ao Talhão'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Operator Tasks of the Day */}
                <div className="pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                    {lang === 'en' ? 'Daily Work Order:' : 'Ordem de Trabalho do Dia:'}
                  </div>
                  <div className="space-y-1.5">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Aplicação de Adubo VRA (Taxa Variável de Azoto NAC 27%)</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-400">75 - 125 kg/ha</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-400" />
                        <span>Verificação de Válvula de Rega Setor Sul (Pressão Baixa)</span>
                      </div>
                      <span className="font-mono text-amber-400">Pendente</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className={`p-4 border-t flex items-center justify-between shrink-0 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#090d16] border-slate-800'}`}>
          <div className="text-[11px] text-slate-500">
            {lang === 'en' ? 'Encrypted cloud sync with Supabase PostgreSQL' : 'Sincronização na nuvem encriptada via Supabase PostgreSQL'}
          </div>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl font-bold text-xs transition-colors ${
              isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-800' : 'bg-slate-800 hover:bg-slate-700 text-white'
            }`}
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};

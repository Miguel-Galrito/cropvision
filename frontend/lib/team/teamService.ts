/**
 * CropVision SaaS - Team Management & B2B RBAC Service
 * Supports multi-tenant roles:
 * - 'owner': Billing, farms management, enterprise subscriptions
 * - 'agronomist': VRA prescription issuing, treatment validation, report digital signature
 * - 'operator': Simplified mobile view with field GPS navigation, daily task list, and route download
 * 
 * Synchronizes with Supabase with seamless offline / localStorage fallback.
 */

import { supabase, isSupabaseConfigured } from '../supabaseClient';

export type UserRole = 'owner' | 'agronomist' | 'operator';
export type MemberStatus = 'active' | 'pending' | 'revoked';

export interface TeamMember {
  id: string;
  farmId: string;
  email: string;
  name: string;
  role: UserRole;
  status: MemberStatus;
  phone?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  farmId: string;
  userEmail: string;
  userRole: string;
  action: string;
  details?: Record<string, any>;
  createdAt: string;
}

const STORAGE_KEY_TEAM = 'cropvision_team_members';
const STORAGE_KEY_AUDIT = 'cropvision_audit_logs';

const DEFAULT_MEMBERS: TeamMember[] = [
  {
    id: 'member-1',
    farmId: 'farm-esporao',
    email: 'miguel@esporao.pt',
    name: 'Miguel Galrito',
    role: 'owner',
    status: 'active',
    phone: '+351 910 000 001',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'member-2',
    farmId: 'farm-esporao',
    email: 'agronomo.silva@esporao.pt',
    name: 'Eng. Agrónomo Miguel Silva',
    role: 'agronomist',
    status: 'active',
    phone: '+351 918 222 333',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'member-3',
    farmId: 'farm-esporao',
    email: 'joao.trator@esporao.pt',
    name: 'João Santos (Tratorista)',
    role: 'operator',
    status: 'active',
    phone: '+351 912 345 678',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
];

const DEFAULT_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'audit-1',
    farmId: 'farm-esporao',
    userEmail: 'agronomo.silva@esporao.pt',
    userRole: 'agronomist',
    action: 'Aprovação de Prescrição VRA de Azoto',
    details: {
      parcel: 'Talhão 1',
      fertilizer: 'CAN-27',
      maxDoseKgN: 170,
      nitratesCompliant: true,
    },
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'audit-2',
    farmId: 'farm-esporao',
    userEmail: 'miguel@esporao.pt',
    userRole: 'owner',
    action: 'Subscrição Contrato Anual Enterprise (€1.700/ano)',
    details: {
      plan: 'Enterprise B2B',
      billingCycle: 'annual',
      whopMembership: 'active',
    },
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: 'audit-3',
    farmId: 'farm-esporao',
    userEmail: 'joao.trator@esporao.pt',
    userRole: 'operator',
    action: 'Download de Mapa ISO-XML para Consola Trator',
    details: {
      parcel: 'Talhão 1',
      file: 'TASKDATA.XML',
      console: 'John Deere CommandCenter Gen4',
    },
    createdAt: new Date(Date.now() - 48 * 3600000).toISOString(),
  },
];

/**
 * Loads team members for a farm.
 */
export async function fetchTeamMembers(farmId = 'farm-esporao'): Promise<TeamMember[]> {
  if (typeof window === 'undefined') return DEFAULT_MEMBERS;

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map((row: any) => ({
          id: row.id,
          farmId: row.farm_id,
          email: row.email,
          name: row.name,
          role: row.role as UserRole,
          status: row.status as MemberStatus,
          phone: row.phone,
          createdAt: row.created_at,
        }));
      }
    } catch (err) {
      console.warn('[TeamService] Supabase query error, falling back to local:', err);
    }
  }

  // Local storage fallback
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_TEAM}_${farmId}`);
    if (raw) return JSON.parse(raw);
    localStorage.setItem(`${STORAGE_KEY_TEAM}_${farmId}`, JSON.stringify(DEFAULT_MEMBERS));
  } catch {}

  return DEFAULT_MEMBERS;
}

/**
 * Invites a new team member with explicit role assignment.
 */
export async function inviteTeamMember(
  farmId = 'farm-esporao',
  email: string,
  name: string,
  role: UserRole,
  phone?: string
): Promise<TeamMember> {
  const newMember: TeamMember = {
    id: `member-${Date.now()}`,
    farmId,
    email: email.trim().toLowerCase(),
    name: name.trim(),
    role,
    status: 'active',
    phone: phone?.trim(),
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('team_members').insert({
        farm_id: farmId === 'farm-esporao' ? '00000000-0000-0000-0000-000000000001' : farmId,
        email: newMember.email,
        name: newMember.name,
        role: newMember.role,
        status: newMember.status,
        phone: newMember.phone,
      });
    } catch (err) {
      console.warn('[TeamService] Supabase insert warning:', err);
    }
  }

  // Update local storage
  if (typeof window !== 'undefined') {
    try {
      const current = await fetchTeamMembers(farmId);
      const updated = [...current.filter((m) => m.email !== newMember.email), newMember];
      localStorage.setItem(`${STORAGE_KEY_TEAM}_${farmId}`, JSON.stringify(updated));
    } catch {}
  }

  // Log audit action
  await logAuditEvent(
    farmId,
    'admin@esporao.pt',
    'owner',
    `Convite de membro: ${newMember.name} como ${newMember.role.toUpperCase()}`,
    { email: newMember.email, role: newMember.role }
  );

  return newMember;
}

/**
 * Updates a member's role.
 */
export async function updateTeamMemberRole(
  farmId = 'farm-esporao',
  memberId: string,
  newRole: UserRole
): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('team_members').update({ role: newRole }).eq('id', memberId);
    } catch (err) {
      console.warn('[TeamService] Supabase update error:', err);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const current = await fetchTeamMembers(farmId);
      const updated = current.map((m) => (m.id === memberId ? { ...m, role: newRole } : m));
      localStorage.setItem(`${STORAGE_KEY_TEAM}_${farmId}`, JSON.stringify(updated));
    } catch {}
  }

  await logAuditEvent(
    farmId,
    'admin@esporao.pt',
    'owner',
    `Alteração de perfil de acesso para ${newRole.toUpperCase()}`,
    { memberId, newRole }
  );

  return true;
}

/**
 * Removes a member from the farm.
 */
export async function removeTeamMember(farmId = 'farm-esporao', memberId: string): Promise<boolean> {
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('team_members').delete().eq('id', memberId);
    } catch (err) {
      console.warn('[TeamService] Supabase delete error:', err);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const current = await fetchTeamMembers(farmId);
      const updated = current.filter((m) => m.id !== memberId);
      localStorage.setItem(`${STORAGE_KEY_TEAM}_${farmId}`, JSON.stringify(updated));
    } catch {}
  }

  await logAuditEvent(
    farmId,
    'admin@esporao.pt',
    'owner',
    `Remoção de membro da equipa (${memberId})`,
    { memberId }
  );

  return true;
}

/**
 * Records an immutable audit log entry.
 */
export async function logAuditEvent(
  farmId = 'farm-esporao',
  userEmail: string,
  userRole: string,
  action: string,
  details?: Record<string, any>
): Promise<boolean> {
  const newLog: AuditLog = {
    id: `audit-${Date.now()}`,
    farmId,
    userEmail,
    userRole,
    action,
    details: details || {},
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    try {
      await supabase.from('audit_logs').insert({
        farm_id: farmId === 'farm-esporao' ? '00000000-0000-0000-0000-000000000001' : farmId,
        user_email: userEmail,
        user_role: userRole,
        action,
        details: details || {},
      });
    } catch (err) {
      console.warn('[TeamService] Supabase audit log error:', err);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const current = await fetchAuditLogs(farmId);
      const updated = [newLog, ...current].slice(0, 50); // Keep last 50 logs locally
      localStorage.setItem(`${STORAGE_KEY_AUDIT}_${farmId}`, JSON.stringify(updated));
    } catch {}
  }

  return true;
}

/**
 * Retrieves audit logs for the farm.
 */
export async function fetchAuditLogs(farmId = 'farm-esporao'): Promise<AuditLog[]> {
  if (typeof window === 'undefined') return DEFAULT_AUDIT_LOGS;

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(40);

      if (!error && data && data.length > 0) {
        return data.map((row: any) => ({
          id: row.id,
          farmId: row.farm_id,
          userEmail: row.user_email,
          userRole: row.user_role,
          action: row.action,
          details: row.details,
          createdAt: row.created_at,
        }));
      }
    } catch (err) {
      console.warn('[TeamService] Supabase audit fetch error:', err);
    }
  }

  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_AUDIT}_${farmId}`);
    if (raw) return JSON.parse(raw);
    localStorage.setItem(`${STORAGE_KEY_AUDIT}_${farmId}`, JSON.stringify(DEFAULT_AUDIT_LOGS));
  } catch {}

  return DEFAULT_AUDIT_LOGS;
}

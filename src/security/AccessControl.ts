/**
 * Access Control System
 * Manages access levels, permissions, and audit logging for CAMO blocks
 */

export interface AccessLevel {
  id: string;
  name: string;
  authentication: 'none' | 'password' | 'password+2fa' | 'biometric';
  description: string;
}

export interface Permissions {
  view: boolean;
  copy: boolean;
  export: boolean;
  modify: boolean;
  share: boolean;
}

export interface AuditConfig {
  logAccess: boolean;
  trackChanges: boolean;
  alertOnFailure: boolean;
  retentionDays: number;
}

export interface AccessControlConfig {
  levels: Record<string, AccessLevel>;
  defaultLevel: string;
  permissions: Record<string, Permissions>;
  audit: AuditConfig;
}

export interface AccessEvent {
  timestamp: number;
  blockId: string;
  userId: string;
  action: string;
  level: string;
  success: boolean;
  details?: string;
}

export class CamoAccessControl {
  private config: AccessControlConfig;
  private auditLog: AccessEvent[] = [];
  private currentUser: string = 'anonymous';

  constructor() {
    this.config = this.getDefaultConfig();
  }

  private getDefaultConfig(): AccessControlConfig {
    return {
      levels: {
        public: {
          id: 'public',
          name: 'Public',
          authentication: 'none',
          description: 'No authentication required',
        },
        authenticated: {
          id: 'authenticated',
          name: 'Authenticated',
          authentication: 'password',
          description: 'Password authentication required',
        },
        privileged: {
          id: 'privileged',
          name: 'Privileged',
          authentication: 'password+2fa',
          description: 'Password + 2FA required',
        },
        owner: {
          id: 'owner',
          name: 'Owner',
          authentication: 'biometric',
          description: 'Biometric authentication required',
        },
      },
      defaultLevel: 'public',
      permissions: {
        public: {
          view: true,
          copy: false,
          export: false,
          modify: false,
          share: false,
        },
        authenticated: {
          view: true,
          copy: true,
          export: false,
          modify: false,
          share: false,
        },
        privileged: {
          view: true,
          copy: true,
          export: true,
          modify: true,
          share: false,
        },
        owner: {
          view: true,
          copy: true,
          export: true,
          modify: true,
          share: true,
        },
      },
      audit: {
        logAccess: true,
        trackChanges: true,
        alertOnFailure: true,
        retentionDays: 90,
      },
    };
  }

  setCurrentUser(userId: string): void {
    this.currentUser = userId;
  }

  checkAccess(blockId: string, action: string, level: string): boolean {
    const hasPermission = this.hasPermission(action, level);

    if (this.config.audit.logAccess) {
      this.logAccess(blockId, action, level, hasPermission);
    }

    return hasPermission;
  }

  private hasPermission(action: string, level: string): boolean {
    const permissions = this.config.permissions[level];
    if (!permissions) return false;

    switch (action) {
      case 'view':
        return permissions.view;
      case 'copy':
        return permissions.copy;
      case 'export':
        return permissions.export;
      case 'modify':
        return permissions.modify;
      case 'share':
        return permissions.share;
      default:
        return false;
    }
  }

  private logAccess(blockId: string, action: string, level: string, success: boolean): void {
    const event: AccessEvent = {
      timestamp: Date.now(),
      blockId,
      userId: this.currentUser,
      action,
      level,
      success,
      details: success ? undefined : 'Access denied',
    };

    this.auditLog.push(event);

    // Clean old audit logs
    this.cleanupAuditLog();
  }

  private cleanupAuditLog(): void {
    const cutoff = Date.now() - this.config.audit.retentionDays * 24 * 60 * 60 * 1000;
    this.auditLog = this.auditLog.filter(event => event.timestamp > cutoff);
  }

  getAuditLog(blockId?: string): AccessEvent[] {
    if (blockId) {
      return this.auditLog.filter(event => event.blockId === blockId);
    }
    return [...this.auditLog];
  }

  getAccessLevel(levelId: string): AccessLevel | undefined {
    return this.config.levels[levelId];
  }

  getAllAccessLevels(): AccessLevel[] {
    return Object.values(this.config.levels);
  }

  updateConfig(newConfig: Partial<AccessControlConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): AccessControlConfig {
    return { ...this.config };
  }
}

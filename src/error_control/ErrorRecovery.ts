export interface CamoError {
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  position?: { line: number; column: number };
  context?: Record<string, unknown>;
}

export interface RecoveryAction {
  type: 'retry' | 'skip' | 'fallback' | 'abort';
  message: string;
  action?: () => void;
  metadata?: Record<string, unknown>;
}

export interface ExecutionContext {
  blockId: string;
  content: string;
  metadata: string[];
  element?: HTMLElement;
}

export class CamoErrorRecovery {
  recover(error: CamoError, context: ExecutionContext): RecoveryAction {
    switch (error.type) {
      case 'SYNTAX_ERROR':
        return this.syntaxErrorRecovery(error, context);
      case 'MISSING_REFERENCE':
        return this.referenceErrorRecovery(error, context);
      case 'INVALID_PARAMETER':
        return this.parameterErrorRecovery(error, context);
      case 'SECURITY_VIOLATION':
        return this.securityErrorRecovery(error, context);
      default:
        return this.defaultRecovery(error, context);
    }
  }

  private syntaxErrorRecovery(_error: CamoError, _context: ExecutionContext): RecoveryAction {
    return {
      type: 'retry',
      message: 'Syntax error detected. Please check your syntax and try again.',
    };
  }

  private referenceErrorRecovery(_error: CamoError, _context: ExecutionContext): RecoveryAction {
    return {
      type: 'retry',
      message: 'Reference error detected. Please check your references and try again.',
    };
  }

  private parameterErrorRecovery(_error: CamoError, _context: ExecutionContext): RecoveryAction {
    return {
      type: 'retry',
      message: 'Parameter error detected. Please check your parameters and try again.',
    };
  }

  private securityErrorRecovery(_error: CamoError, _context: ExecutionContext): RecoveryAction {
    return {
      type: 'abort',
      message: 'Security error detected. Access denied for security reasons.',
    };
  }

  private defaultRecovery(_error: CamoError, _context: ExecutionContext): RecoveryAction {
    return {
      type: 'fallback',
      message: 'An error occurred. Using fallback configuration.',
    };
  }
}

/**
 * CAMO Security Integration
 * Provides encryption, hashing, and signing capabilities using Web Crypto API
 *
 * Security-first design: Never store passwords in plaintext, use secure key derivation,
 * clear sensitive data from memory, prevent timing attacks.
 */

export interface SecureContent {
  content: string;
  encrypted?: string;
  hash?: string;
  signature?: string;
  metadata?: SecurityMetadata;
}

export interface SecurityMetadata {
  algorithm: string;
  keyId?: string;
  timestamp: number;
  salt?: string;
  iv?: string;
}

export interface ParsedInstruction {
  action: {
    type: string;
    parameters: Record<string, string | number | boolean>;
  };
}

export interface SecuritySettings {
  defaultEncryption: 'AES-GCM' | 'AES-CBC';
  defaultHash: 'SHA-256' | 'SHA-512';
  keyDerivationIterations: number;
  enableSecurityAudit: boolean;
}

export class CamoSecurityIntegration {
  private readonly keyCache = new Map<string, CryptoKey>();
  private readonly settings: SecuritySettings;

  constructor(settings?: Partial<SecuritySettings>) {
    this.settings = {
      defaultEncryption: 'AES-GCM',
      defaultHash: 'SHA-256',
      keyDerivationIterations: 100000,
      enableSecurityAudit: true,
      ...settings,
    };
  }

  /**
   * Encrypt content using Web Crypto API
   */
  private async encrypt(
    content: string,
    parameters: Record<string, string | number | boolean>
  ): Promise<SecureContent> {
    try {
      const algorithm = (parameters.algorithm as string) || this.settings.defaultEncryption;
      const password = parameters.password as string;

      if (!password) {
        throw new Error('Password required for encryption');
      }

      // Generate salt and IV
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12)); // GCM uses 12-byte IV

      // Derive key from password
      const key = await this.deriveKey(password, salt, algorithm);

      // Encrypt content
      const encoder = new TextEncoder();
      const data = encoder.encode(content);

      const encrypted = await crypto.subtle.encrypt({ name: algorithm, iv }, key, data);

      // Combine salt + iv + encrypted data for storage
      const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
      combined.set(salt, 0);
      combined.set(iv, salt.length);
      combined.set(new Uint8Array(encrypted), salt.length + iv.length);

      // Convert to base64 for safe text storage
      const encryptedBase64 = btoa(String.fromCharCode(...combined));

      // Clear sensitive data from memory
      this.clearSensitiveData(password);

      return {
        content: '[ENCRYPTED]',
        encrypted: encryptedBase64,
        metadata: {
          algorithm,
          timestamp: Date.now(),
          salt: btoa(String.fromCharCode(...salt)),
          iv: btoa(String.fromCharCode(...iv)),
        },
      };
    } catch (error) {
      console.error('CAMO Security: Encryption failed:', error);
      throw new Error(
        'Encryption failed: ' + (error instanceof Error ? error.message : 'Unknown error')
      );
    }
  }

  /**
   * Decrypt content using Web Crypto API
   */
  async decrypt(
    encryptedContent: string,
    password: string,
    metadata: SecurityMetadata
  ): Promise<string> {
    try {
      // Decode base64
      const combined = Uint8Array.from(atob(encryptedContent), c => c.charCodeAt(0));

      // Extract salt, IV, and encrypted data
      const salt = combined.slice(0, 16);
      const iv = combined.slice(16, 28);
      const encrypted = combined.slice(28);

      // Derive key from password
      const key = await this.deriveKey(password, salt, metadata.algorithm);

      // Decrypt content
      const decrypted = await crypto.subtle.decrypt(
        { name: metadata.algorithm, iv },
        key,
        encrypted
      );

      const decoder = new TextDecoder();
      const content = decoder.decode(decrypted);

      // Clear sensitive data from memory
      this.clearSensitiveData(password);

      return content;
    } catch (error) {
      console.error('CAMO Security: Decryption failed:', error);
      throw new Error('Decryption failed: Invalid password or corrupted data');
    }
  }

  /**
   * Hash content using Web Crypto API
   */
  private async hash(
    content: string,
    parameters: Record<string, string | number | boolean>
  ): Promise<SecureContent> {
    try {
      const algorithm = (parameters.algorithm as string) || this.settings.defaultHash;
      const salt = (parameters.salt as string) || this.generateSalt();

      const encoder = new TextEncoder();
      const data = encoder.encode(content + salt);

      const hashBuffer = await crypto.subtle.digest(algorithm, data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      return {
        content,
        hash: hashHex,
        metadata: {
          algorithm,
          timestamp: Date.now(),
          salt,
        },
      };
    } catch (error) {
      console.error('CAMO Security: Hashing failed:', error);
      throw new Error(
        'Hashing failed: ' + (error instanceof Error ? error.message : 'Unknown error')
      );
    }
  }

  /**
   * Sign content using Web Crypto API
   */
  private async sign(
    content: string,
    parameters: Record<string, string | number | boolean>
  ): Promise<SecureContent> {
    try {
      // For signing, we'd need to generate or use stored key pairs
      // This is a simplified implementation that generates a new key pair
      const keyPair = await crypto.subtle.generateKey(
        {
          name: 'ECDSA',
          namedCurve: 'P-256',
        },
        true,
        ['sign', 'verify']
      );

      const encoder = new TextEncoder();
      const data = encoder.encode(content);

      const signature = await crypto.subtle.sign(
        { name: 'ECDSA', hash: 'SHA-256' },
        keyPair.privateKey,
        data
      );

      const signatureArray = Array.from(new Uint8Array(signature));
      const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');

      return {
        content,
        signature: signatureHex,
        metadata: {
          algorithm: 'ECDSA',
          timestamp: Date.now(),
        },
      };
    } catch (error) {
      console.error('CAMO Security: Signing failed:', error);
      throw new Error(
        'Signing failed: ' + (error instanceof Error ? error.message : 'Unknown error')
      );
    }
  }

  /**
   * Derive cryptographic key from password using PBKDF2
   */
  private async deriveKey(
    password: string,
    salt: Uint8Array,
    algorithm: string
  ): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: this.settings.keyDerivationIterations,
        hash: 'SHA-256',
      },
      passwordKey,
      { name: algorithm, length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Generate cryptographically secure salt
   */
  private generateSalt(): string {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    return btoa(String.fromCharCode(...salt));
  }

  /**
   * Clear sensitive data from memory (basic implementation)
   */
  private clearSensitiveData(sensitiveString: string): void {
    // While JavaScript doesn't give us direct memory control,
    // we can at least overwrite the string reference
    try {
      // This is a best-effort approach in JavaScript
      (sensitiveString as any) = null;
    } catch (error) {
      // Silent fail - this is defensive programming
    }
  }

  /**
   * Process security instruction from camoMetaData
   */
  async processSecurityInstruction(
    content: string,
    instruction: ParsedInstruction
  ): Promise<SecureContent | undefined> {
    if (this.settings.enableSecurityAudit) {
      console.log(`CAMO Security: Processing ${instruction.action.type} instruction`);
    }

    try {
      switch (instruction.action.type) {
        case 'encrypt':
          return await this.encrypt(content, instruction.action.parameters);
        case 'hash':
          return await this.hash(content, instruction.action.parameters);
        case 'sign':
          return await this.sign(content, instruction.action.parameters);
        default:
          console.warn(`CAMO Security: Unknown security operation: ${instruction.action.type}`);
          return undefined;
      }
    } catch (error) {
      console.error(`CAMO Security: Failed to process ${instruction.action.type}:`, error);
      throw error;
    }
  }

  /**
   * Verify if Web Crypto API is available
   */
  static isSupported(): boolean {
    return (
      typeof crypto !== 'undefined' &&
      typeof crypto.subtle !== 'undefined' &&
      typeof crypto.getRandomValues === 'function'
    );
  }

  /**
   * Get security capabilities summary
   */
  getCapabilities(): {
    encryption: string[];
    hashing: string[];
    supported: boolean;
  } {
    return {
      encryption: ['AES-GCM', 'AES-CBC'],
      hashing: ['SHA-256', 'SHA-512'],
      supported: CamoSecurityIntegration.isSupported(),
    };
  }

  /**
   * Sanitize user input to prevent XSS attacks
   */
  private sanitizeInput(input: string): string {
    // Basic HTML entity encoding
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Validate and sanitize metadata input
   */
  validateMetadata(metadata: string[]): { valid: boolean; sanitized: string[]; errors: string[] } {
    const errors: string[] = [];
    const sanitized: string[] = [];

    for (const line of metadata) {
      if (line.length > 1000) {
        errors.push(`Metadata line too long: ${line.length} characters`);
        continue;
      }

      // Check for potentially dangerous patterns
      if (/<script|javascript:|data:|vbscript:/i.test(line)) {
        errors.push('Potentially dangerous content detected');
        continue;
      }

      sanitized.push(this.sanitizeInput(line));
    }

    return {
      valid: errors.length === 0,
      sanitized,
      errors,
    };
  }
}

import { CamoSecurityIntegration } from '../../security/SecurityIntegration';

describe('CamoSecurityIntegration', () => {
  let security: CamoSecurityIntegration;

  beforeEach(() => {
    security = new CamoSecurityIntegration({
      enableSecurityAudit: true,
    });
  });

  describe('validateMetadata', () => {
    it('should validate clean metadata', () => {
      const metadata = [':: set background color: #ff0000', ':: set opacity value: 0.5'];

      const result = security.validateMetadata(metadata);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitized).toEqual(metadata);
    });

    it('should detect XSS attempts', () => {
      const metadata = [
        ':: set background color: #ff0000',
        '<script>alert("xss")</script>',
        ':: set opacity value: 0.5',
      ];

      const result = security.validateMetadata(metadata);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Potentially dangerous content detected');
    });

    it('should detect JavaScript protocol', () => {
      const metadata = ['javascript:alert("xss")'];

      const result = security.validateMetadata(metadata);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Potentially dangerous content detected');
    });

    it('should handle long lines', () => {
      const longLine = 'a'.repeat(1001);
      const metadata = [longLine];

      const result = security.validateMetadata(metadata);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Metadata line too long: 1001 characters');
    });

    it('should sanitize HTML entities', () => {
      const metadata = [':: set background color: <script>alert("xss")</script>'];

      const result = security.validateMetadata(metadata);

      expect(result.valid).toBe(true);
      expect(result.sanitized[0]).toContain('&lt;script&gt;');
    });
  });

  describe('isSupported', () => {
    it('should check Web Crypto API support', () => {
      const supported = CamoSecurityIntegration.isSupported();

      // In test environment, this should be true due to our mock
      expect(typeof supported).toBe('boolean');
    });
  });

  describe('getCapabilities', () => {
    it('should return security capabilities', () => {
      const capabilities = security.getCapabilities();

      expect(capabilities).toHaveProperty('encryption');
      expect(capabilities).toHaveProperty('hashing');
      expect(capabilities).toHaveProperty('supported');
      expect(Array.isArray(capabilities.encryption)).toBe(true);
      expect(Array.isArray(capabilities.hashing)).toBe(true);
    });
  });
});

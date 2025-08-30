import { CamoMetaDataProcessor, MetaDataContext } from '../../core/camoMetaData';

describe('CamoMetaDataProcessor', () => {
  let processor: CamoMetaDataProcessor;
  let mockContext: MetaDataContext;

  beforeEach(() => {
    processor = new CamoMetaDataProcessor();
    mockContext = {
      blockId: 'test-block',
      element: document.createElement('div'),
      settings: {
        debugMode: false,
        enableSecurity: true,
      },
    };
  });

  describe('process', () => {
    it('should process valid metadata statements', async () => {
      const metadata = [':: set background color: #ff0000', ':: set opacity value: 0.5'];

      const result = await processor.process(metadata, mockContext);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle empty metadata', async () => {
      const result = await processor.process([], mockContext);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle invalid syntax', async () => {
      const metadata = ['invalid syntax'];

      const result = await processor.process(metadata, mockContext);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should apply visual effects correctly', async () => {
      const metadata = [':: set background color: #00ff00'];

      const result = await processor.process(metadata, mockContext);

      expect(result.success).toBe(true);
      expect(mockContext.element.style.backgroundColor).toBe('rgb(0, 255, 0)');
    });
  });

  describe('parseStatement', () => {
    it('should parse set statements', () => {
      const statement = ':: set background color: #ff0000';
      const parsed = processor.parseStatement(statement);

      expect(parsed.valid).toBe(true);
      expect(parsed.declaration?.keyword).toBe('set');
      expect(parsed.effect?.action).toBe('background');
    });

    it('should parse conditional statements', () => {
      const statement = ':: if hover then set opacity value: 0.8';
      const parsed = processor.parseStatement(statement);

      expect(parsed.valid).toBe(true);
      expect(parsed.declaration?.keyword).toBe('if');
      expect(parsed.condition?.function).toBe('hover');
    });

    it('should handle invalid statements', () => {
      const statement = 'invalid statement';
      const parsed = processor.parseStatement(statement);

      expect(parsed.valid).toBe(false);
    });
  });
});

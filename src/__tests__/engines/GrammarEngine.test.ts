import { CamoGrammarEngine } from '../../engines/GrammarEngine';

describe('CamoGrammarEngine', () => {
  let engine: CamoGrammarEngine;

  beforeEach(() => {
    engine = new CamoGrammarEngine();
  });

  describe('validateGrammar', () => {
    it('should validate correct grammar', () => {
      const input = ':: set background color: #ff0000';
      const result = engine.validateGrammar(input);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect syntax errors', () => {
      const input = ':: invalid syntax';
      const result = engine.validateGrammar(input);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle empty input', () => {
      const result = engine.validateGrammar('');

      expect(result.valid).toBe(true);
    });

    it('should validate complex statements', () => {
      const input = ':: if hover then set opacity value: 0.8';
      const result = engine.validateGrammar(input);

      expect(result.valid).toBe(true);
    });
  });

  describe('tokenize', () => {
    it('should tokenize simple statement', () => {
      const input = ':: set background color: #ff0000';
      const tokens = engine.tokenize(input);

      expect(tokens).toHaveLength(6);
      expect(tokens[0].type).toBe('operator');
      expect(tokens[1].type).toBe('keyword');
      expect(tokens[2].type).toBe('identifier');
    });

    it('should handle whitespace correctly', () => {
      const input = '  ::  set  background  color:  #ff0000  ';
      const tokens = engine.tokenize(input);

      expect(tokens.length).toBeGreaterThan(0);
      expect(tokens.every(token => token.type !== 'whitespace')).toBe(true);
    });
  });

  describe('buildAST', () => {
    it('should build AST for valid statement', () => {
      const input = ':: set background color: #ff0000';
      const tokens = engine.tokenize(input);
      const ast = engine.buildAST(tokens);

      expect(ast).toBeDefined();
      expect(ast.type).toBe('statement');
    });

    it('should handle invalid tokens gracefully', () => {
      const tokens = [{ type: 'invalid', value: 'test', position: 0 }];

      expect(() => engine.buildAST(tokens)).not.toThrow();
    });
  });
});

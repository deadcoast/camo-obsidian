# camoMetaData

> [**INDEX**](./0_INDEX.md)

> [!NOTE]
> [**LAST-PAGE**](./3_camoIR.md)
>
> [**CURRENT-PAGE:** `camoMetaData`](./4_camoMetaData.md)
>
> [**NEXT-PAGE:**](./5_nestingRules.md)

## Diagram TODO

```diff
# TODO: Structural Diagram Updates
+ [1.5] CONTEXT      # New: Contextual modifiers for scope
+ [2.3] SELECTOR     # New: Target selector syntax
+ [3.4] CONDITION    # New: Conditional execution
+ [4.2] CALLBACK     # New: Post-execution hooks
```

```text
┌─────┐                ┌─────┐               ┌─────┐               ┌─────┐
│ [1] │ DECLARATION    │ [2] │ TARGET        │ [3] │ EFFECT        │ [4] │ OUTPUT
├─────┴────────────────┼─────┴───────────────┼─────┴───────────────┼─────┴────────────┐
│  [1.1] NEWLINESTRING │  [2.1] FUNCTION     │  [3.1] ACTION       │  [4.1] OUTCOME   │
├──────────────────────┼─────────────────────┼─────────────────────┼──────────────────┤
│  [1.2] KEYWORD       │  [2.2] OPERATOR     │  [3.2] PARAMETER    │        ---       │
├──────────────────────┼─────────────────────┼─────────────────────┼──────────────────┤
│  [1.3] VARIABLE      │         ---         │  [3.3] TRIGGER      │        ---       │
├──────────────────────┼─────────────────────┼─────────────────────┼──────────────────┤
│  [1.4] MODIFIER      │         ---         │         ---         │        ---       │
├┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┼┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┼┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┼┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┤
│                                                                                     │
│             [1.4]                                                                   │
│               ^                                                                     │
│         [1.3] │            [2.2]            [3.3]                                   │
│           ^   │              ^                ^                                     │
│     [1.2] │   │        [2.1] │          [3.2] │                                     │
│       ^   │   │         ^    │            ^   │                 [4.1]               │
│ [1.1] │   │   │         │    │      [3.1] │   │                   ^                 │
│   ^   │   │   │         │    │        ^   │   │                   │                 │
│ ┌─┼───┴───┼───┼─┐ ┌─────┼────┼─┐ ┌────┼───┼───┼─┐ ┌───────────────┼───────────────┐ │
│ │ +   +   +   + │ │     +    + │ │    +   +   + │ │               +               │ │
│ │ :: set[ ]  // │ │ function % │ │ action( ) -> │ │            OUTCOME            │ │
├─┴───────────────┴─┴────────────┴─┴──────────────┴─┴───────────────────────────────┴─┤
│```camo                                                                              │
│   :: set[color] // text[errors] % {new_color}(#FF0000) -> {conf[success]}           │
│```                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## Enhanced Zone Specifications

### [1] DECLARATION Zone

The declaration zone establishes the operational context and scope for the instruction.

#### Components

- **[1.1] NewLineString (NLS):** `::` or `:^:` operators that initiate a statement
- **[1.2] KEYWORD:** Primary action verb (set, protect, reveal, apply, etc.)
- **[1.3] VARIABLE:** Target property enclosed in `[]`
- **[1.4] MODIFIER:** Additional context flags
- **[1.5] CONTEXT:** _New_ - Scope modifiers (@global, @local, @block)

#### Extended Keywords Dictionary

```typescript
const DECLARATION_KEYWORDS = {
  // Visual Manipulation
  'set': 'Modify a visual property',
  'apply': 'Apply an effect or transformation',
  'remove': 'Remove an effect or property',
  'toggle': 'Switch between states',

  // Security Operations
  'protect': 'Apply security measures',
  'encrypt': 'Activate encryption',
  'decrypt': 'Remove encryption',
  'authenticate': 'Require authentication',
  'audit': 'Enable audit logging',

  // Display Control
  'reveal': 'Set reveal conditions',
  'hide': 'Set hiding conditions',
  'mask': 'Apply masking pattern',
  'redact': 'Permanently obscure',

  // Content Selection
  'select': 'Target specific content',
  'filter': 'Apply content filters',
  'transform': 'Transform content format',

  // Navigation & Linking
  'link': 'Connect to other blocks',
  'navigate': 'Define navigation paths',
  'group': 'Group related blocks',
  'coordinate': 'Set spatial position',

  // State Management
  'store': 'Save state to storage',
  'retrieve': 'Load saved state',
  'reset': 'Return to default state',
  'snapshot': 'Create state checkpoint'
};
```

### [2] TARGET Zone

The target zone specifies what content or element the instruction operates on.

#### TARGET Zone Components

- **[2.1] FUNCTION:** The specific function or content selector
- **[2.2] OPERATOR:** The `%` operator that connects to parameters
- **[2.3] SELECTOR:** _New_ - Advanced targeting syntax

#### Function Library

```typescript
const TARGET_FUNCTIONS = {
  // Content Selectors
  'content[all]': 'Select entire block content',
  'content[lines]': 'Select specific lines',
  'content[pattern]': 'Select by regex pattern',
  'content[marked]': 'Select highlighted sections',

  // Element Selectors
  'text[*]': 'All text elements',
  'code[*]': 'Code snippets',
  'link[*]': 'Hyperlinks',
  'image[*]': 'Images',
  'table[*]': 'Tables',

  // Positional Selectors
  'first[n]': 'First n elements',
  'last[n]': 'Last n elements',
  'range[start:end]': 'Range of elements',
  'every[nth]': 'Every nth element',

  // Semantic Selectors
  'sensitive[*]': 'Content marked as sensitive',
  'public[*]': 'Public content',
  'private[*]': 'Private content',
  'encrypted[*]': 'Already encrypted content'
};
```

### [3] EFFECT Zone

The effect zone defines the transformation or action to be applied.

#### BRACKET COMPONENTS FOR CAMO

- **[3.1] ACTION:** The effect wrapped in `{}`
- **[3.2] PARAMETER:** Values passed in `()`
- **[3.3] TRIGGER:** The `->` operator indicating outcome
- **[3.4] CONDITION:** _New_ - Conditional execution logic

#### Action Library

```typescript
const EFFECT_ACTIONS = {
  // Visual Effects
  '{blur}': ['intensity', 'radius', 'algorithm'],
  '{pixelate}': ['size', 'shape', 'density'],
  '{scramble}': ['speed', 'characters', 'stable'],
  '{glitch}': ['frequency', 'intensity', 'colors'],
  '{fade}': ['opacity', 'duration', 'easing'],
  '{redact}': ['style', 'color', 'permanent'],

  // Security Actions
  '{encrypt}': ['algorithm', 'key', 'salt'],
  '{hash}': ['algorithm', 'iterations', 'salt'],
  '{sign}': ['key', 'algorithm', 'timestamp'],
  '{compress}': ['algorithm', 'level', 'dictionary'],

  // Behavioral Actions
  '{reveal}': ['trigger', 'delay', 'animation'],
  '{hide}': ['trigger', 'delay', 'animation'],
  '{lock}': ['method', 'timeout', 'attempts'],
  '{track}': ['events', 'storage', 'retention'],

  // State Actions
  '{save}': ['location', 'format', 'encryption'],
  '{load}': ['source', 'merge', 'validate'],
  '{sync}': ['target', 'bidirectional', 'conflict'],
  '{backup}': ['frequency', 'versions', 'location']
};
```

### [4] OUTPUT Zone

The output zone defines the result and any side effects.

#### OUTPUT Zone Components

- **[4.1] OUTCOME:** The result state or confirmation
- **[4.2] CALLBACK:** _New_ - Post-execution hooks for chaining

#### Outcome States

```typescript
const OUTCOME_STATES = {
  // Visual States
  '{visual[blurred]}': 'Content is now blurred',
  '{visual[hidden]}': 'Content is hidden',
  '{visual[revealed]}': 'Content is visible',
  '{visual[masked]}': 'Content is masked',

  // Security States
  '{secure[encrypted]}': 'Content encrypted',
  '{secure[locked]}': 'Access locked',
  '{secure[authenticated]}': 'User authenticated',
  '{secure[failed]}': 'Security operation failed',

  // Process States
  '{state[complete]}': 'Operation completed',
  '{state[pending]}': 'Awaiting trigger',
  '{state[error]}': 'Operation failed',
  '{state[partial]}': 'Partially completed',

  // Notification States
  '{notify[user]}': 'User notified',
  '{log[audit]}': 'Logged to audit trail',
  '{alert[admin]}': 'Admin alerted',
  '{conf[success]}': 'Success confirmation'
};
```

## Advanced Syntax Features

### Conditional Execution

```camo
:: set[blur] // content[sensitive] % {intensity}(80) -> {visual[blurred]}
 :^: blur // IF{hover} % {authenticated}(true) -> {reveal[content]}
  :: ELSE // maintain[blur] % {intensity}(80) -> {visual[protected]}
```

### Multi-Target Operations

```camo
:: apply[redact] // text[ssn|ccn|api_key] % {style}(black_bar) -> {secure[redacted]}
 :^: redact // pattern[/\d{3}-\d{2}-\d{4}/] % {permanent}(false) -> {reversible[true]}
```

### Chained Actions

```camo
:: protect[multi] // content[all] % {chain}(true) -> {begin[sequence]}
 :^: multi // step[1] % {blur}(60) -> {next[2]}
  :: step[2] // encrypt % {aes256} -> {next[3]}
  :: step[3] // lock % {password} -> {complete[protected]}
```

### Time-Based Triggers

```camo
:: reveal[timed] // content[announcement] % {at}(2024-01-15T09:00:00Z) -> {scheduled[true]}
 :^: timed // before % {display}(countdown) -> {visual[timer]}
  :: after // reveal % {animation}(fade_in) -> {state[visible]}
```

## Parser Implementation

### Tokenization Engine

```typescript
class CamoTokenizer {
  private readonly TOKEN_PATTERNS = {
    NEWLINE: /^::/,
    HIERARCHICAL: /^:\^:/,
    RELATION: /\/\//,
    OPERATOR: /%/,
    TRIGGER: /->/,
    ACTION_BLOCK: /\{([^}]+)\}/,
    VARIABLE_BLOCK: /\[([^\]]+)\]/,
    OPTION_BLOCK: /\(([^)]+)\)/,
    IDENTIFIER: /[a-zA-Z_][a-zA-Z0-9_]*/,
    STRING: /"([^"]+)"|'([^']+)'/,
    NUMBER: /\d+(\.\d+)?/,
    WHITESPACE: /\s+/
  };

  tokenize(input: string): Token[] {
    const tokens: Token[] = [];
    let position = 0;
    let line = 1;
    let column = 1;

    while (position < input.length) {
      const token = this.nextToken(input, position, line, column);
      if (token) {
        tokens.push(token);
        position = token.end;
        // Update line/column tracking
      }
    }

    return tokens;
  }
}
```

### AST Builder

```typescript
interface CamoASTNode {
  type: 'statement' | 'declaration' | 'target' | 'effect' | 'output';
  operator: string;
  keyword?: string;
  variable?: string;
  function?: string;
  action?: ActionNode;
  parameters?: ParameterNode[];
  outcome?: string;
  children?: CamoASTNode[];
  parent?: CamoASTNode;
  depth: number;
  line: number;
  column: number;
}

class CamoASTBuilder {
  build(tokens: Token[]): CamoAST {
    const root: CamoAST = {
      type: 'root',
      statements: []
    };

    let current = 0;
    while (current < tokens.length) {
      const statement = this.parseStatement(tokens, current);
      if (statement) {
        root.statements.push(statement);
        current = statement.endIndex;
      }
    }

    this.linkHierarchicalReferences(root);
    return root;
  }

  private linkHierarchicalReferences(ast: CamoAST) {
    // Connect :^: references to parent nodes
    // Validate hierarchical consistency
    // Build reference map for runtime lookup
  }
}
```

## Runtime Execution Engine

### Instruction Processor

```typescript
class CamoInstructionProcessor {
  private readonly effects = new Map<string, EffectHandler>();
  private readonly state = new CamoStateManager();

  async execute(ast: CamoAST, context: BlockContext): Promise<ExecutionResult> {
    const results: ExecutionResult[] = [];

    for (const statement of ast.statements) {
      try {
        const result = await this.executeStatement(statement, context);
        results.push(result);

        // Handle hierarchical dependencies
        if (statement.children) {
          for (const child of statement.children) {
            const childResult = await this.executeStatement(child, {
              ...context,
              parent: result
            });
            results.push(childResult);
          }
        }
      } catch (error) {
        this.handleExecutionError(error, statement);
      }
    }

    return this.aggregateResults(results);
  }

  private async executeStatement(
    statement: CamoASTNode,
    context: BlockContext
  ): Promise<StatementResult> {
    // 1. Resolve target content
    const target = this.resolveTarget(statement.target, context);

    // 2. Prepare effect parameters
    const params = this.prepareParameters(statement.parameters);

    // 3. Check conditions
    if (statement.condition && !this.evaluateCondition(statement.condition, context)) {
      return { skipped: true };
    }

    // 4. Apply effect
    const effect = this.effects.get(statement.action.type);
    const result = await effect.apply(target, params);

    // 5. Update state
    this.state.update(context.blockId, statement, result);

    // 6. Trigger callbacks
    if (statement.callback) {
      await this.executeCallback(statement.callback, result);
    }

    return result;
  }
}
```

## Integration with Core Camo Modules

### Visual Camouflage Integration

```typescript
class CamoVisualIntegration {
  applyVisualEffect(
    element: HTMLElement,
    instruction: ParsedInstruction
  ): void {
    switch (instruction.action.type) {
      case 'blur':
        this.applyBlur(element, instruction.parameters);
        break;
      case 'pixelate':
        this.applyPixelation(element, instruction.parameters);
        break;
      case 'scramble':
        this.applyTextScramble(element, instruction.parameters);
        break;
      // ... more effects
    }
  }
}
```

### Security Layer Integration

```typescript
class CamoSecurityIntegration {
  async processSecurityInstruction(
    content: string,
    instruction: ParsedInstruction
  ): Promise<SecureContent> {
    switch (instruction.action.type) {
      case 'encrypt':
        return await this.encrypt(content, instruction.parameters);
      case 'hash':
        return await this.hash(content, instruction.parameters);
      case 'sign':
        return await this.sign(content, instruction.parameters);
      // ... more security operations
    }
  }
}
```

## Complete Working Examples

### Example 1: Progressive Security Layers

```camo
:: protect[document] // content[all] % {level}(maximum) -> {initiating[protection]}
 :^: document // layer[1] % {blur}(40) -> {visual[obscured]}
  :: layer[2] // scramble[text] % {speed}(100ms) -> {text[scrambled]}
  :: layer[3] // encrypt % {aes256} -> {data[encrypted]}
  :: layer[4] // lock % {biometric} -> {access[secured]}
:^: reveal[progressive] // trigger[authenticate] % {method}(password+2fa) -> {begin[reveal]}
 :: unlock[4] // verify[biometric] % {timeout}(30s) -> {layer4[unlocked]}
 :: unlock[3] // decrypt % {key}(derived) -> {layer3[decrypted]}
 :: unlock[2] // unscramble % {animation}(smooth) -> {layer2[clear]}
 :: unlock[1] // unblur % {duration}(500ms) -> {content[visible]}
```

### Example 2: Conditional Content Display

```camo
:: select[sensitive] // pattern[/\b(?:api|key|token|secret)\b/i] % {mark}(true) -> {identified[4_items]}
 :^: sensitive // IF{user.role} % {equals}(admin) -> {proceed[display]}
  :: display // highlight % {color}(yellow) -> {visual[highlighted]}
  :: display // tooltip % {text}("Sensitive data - Admin view") -> {info[shown]}
 :^: ELSE // IF{user.role} % {equals}(developer) -> {proceed[partial]}
  :: partial // redact[values] % {show_keys}(true) -> {visual[partial_redaction]}
 :^: ELSE // default % {all_users} -> {proceed[full_redaction]}
  :: redact[all] // style % {black_bar} -> {visual[fully_redacted]}
  :: notify // message % {text}("Insufficient permissions") -> {user[notified]}
```

### Example 3: Time-Sensitive Content

```camo
:: schedule[embargo] // content[press_release] % {until}(2024-03-01T09:00:00Z) -> {timer[set]}
 :^: embargo // before[release] % {display}(countdown) -> {visual[timer_shown]}
  :: countdown // format % {text}("Release in: {days}d {hours}h {minutes}m") -> {updating[live]}
  :: content // state % {blur}(100) -> {visual[completely_hidden]}
 :^: embargo // at[release_time] % {trigger}(automatic) -> {releasing[content]}
  :: reveal // animation % {fade_in}(2000ms) -> {visual[revealing]}
  :: notify // broadcast % {channel}(all_subscribers) -> {alert[sent]}
  :: log // event % {audit}(true) -> {recorded[release_event]}
```

## Validation and Error Handling

### Syntax Validator

```typescript
class CamoSyntaxValidator {
  validate(input: string): ValidationResult {
    const errors: SyntaxError[] = [];
    const warnings: SyntaxWarning[] = [];

    // Check indentation rules
    this.validateIndentation(input, errors);

    // Validate operator usage
    this.validateOperators(input, errors);

    // Check bracket matching
    this.validateBrackets(input, errors);

    // Verify keyword validity
    this.validateKeywords(input, warnings);

    // Check hierarchical references
    this.validateHierarchy(input, errors);

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}
```

### Error Recovery

```typescript
class CamoErrorRecovery {
  recover(error: CamoError, context: ExecutionContext): RecoveryAction {
    switch (error.type) {
      case 'SYNTAX_ERROR':
        return this.syntaxErrorRecovery(error);
      case 'MISSING_REFERENCE':
        return this.referenceErrorRecovery(error);
      case 'INVALID_PARAMETER':
        return this.parameterErrorRecovery(error);
      case 'SECURITY_VIOLATION':
        return this.securityErrorRecovery(error);
      default:
        return this.defaultRecovery(error);
    }
  }
}
```

## Performance Optimizations

### Caching Strategy

```typescript
class CamoCacheManager {
  private readonly parseCache = new LRUCache<string, CamoAST>(100);
  private readonly effectCache = new Map<string, CachedEffect>();
  private readonly stateCache = new WeakMap<HTMLElement, BlockState>();

  getCachedParse(input: string): CamoAST | null {
    const hash = this.hashInput(input);
    return this.parseCache.get(hash);
  }

  cacheEffect(key: string, effect: RenderedEffect): void {
    this.effectCache.set(key, {
      effect,
      timestamp: Date.now(),
      ttl: 60000 // 1 minute
    });
  }
}
```

## Developer Tools

### Syntax Highlighting

```typescript
const CAMO_SYNTAX_HIGHLIGHTING = {
  operators: {
    pattern: /(::|:\^:|\/\/|%|->)/g,
    class: 'camo-operator'
  },
  keywords: {
    pattern: /\b(set|apply|protect|reveal|encrypt|hide)\b/g,
    class: 'camo-keyword'
  },
  actions: {
    pattern: /\{([^}]+)\}/g,
    class: 'camo-action'
  },
  variables: {
    pattern: /\[([^\]]+)\]/g,
    class: 'camo-variable'
  },
  parameters: {
    pattern: /\(([^)]+)\)/g,
    class: 'camo-parameter'
  }
};
```

### Autocomplete Provider

```typescript
class CamoAutocomplete {
  getSuggestions(context: EditorContext): Suggestion[] {
    const { line, column, prefix } = context;

    if (prefix.startsWith('::')) {
      return this.getKeywordSuggestions();
    }

    if (prefix.includes('//')) {
      return this.getFunctionSuggestions();
    }

    if (prefix.includes('{')) {
      return this.getActionSuggestions();
    }

    return [];
  }
}
```

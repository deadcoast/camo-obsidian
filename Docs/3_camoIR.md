# camoIR.md - IR Implementation on Obsidian

> [**INDEX**](./0_INDEX.md)

> [!NOTE]
> [**LAST-PAGE**](./2_ALLABOUT-camoMetaData.md)
>
> [**CURRENT-PAGE:** `camoIR`](./3_camoIR.md)
>
> [**NEXT-PAGE:**](./4_camoMetaData.md)

## 1. camoMetaData Execution Engine 🔴 Critical

Since CAMO is an IR, the execution engine needs clear definition:

Order of Operations:

```typescript
class CamoIRExecutor {
  // IR compilation pipeline
  private executionPipeline = [
    'parse',      // Tokenize camoMetaData syntax
    'validate',   // Check syntax validity
    'transform',  // Convert to CSS classes
    'optimize',   // Remove redundant operations
    'apply'       // Apply to DOM via Obsidian API
  ];

  // Execution priority for conflicting instructions
  private operationPriority = {
    1: 'visual',      // Background, colors, blur
    2: 'layout',      // Sizing, positioning
    3: 'animation',   // Transitions, effects
    4: 'interaction', // Click, hover handlers
    5: 'state'        // Persistence operations
  };
}
```

### AST → IR Integration (Normative)

```typescript
// Inputs from parser phase (Docs/4_camoMetaData.md):
interface CamoAST { statements: CamoASTNode[] }
interface CamoASTNode {
  type: 'statement' | 'declaration' | 'target' | 'effect' | 'output';
  keyword?: string;            // e.g., set/protect/reveal
  variable?: string;           // e.g., blur/background
  function?: string;           // e.g., content/text/pattern
  action?: ActionNode;         // e.g., {blur}
  parameters?: ParameterNode[];// normalized key/values
  outcome?: string;            // e.g., {visual[blurred]}
  children?: CamoASTNode[];
}

// Normalized IR operation used downstream by optimizer/renderer
type OperationBucket = 1 | 2 | 3 | 4 | 5; // visual→state

interface CamoIRInstruction {
  id: string;                         // stable per-line id
  bucket: OperationBucket;            // from KEYWORD_SPECS.priorityBucket
  target: NormalizedSelector;         // from selector normalization
  effect?: {
    type: string;                     // e.g., 'blur', 'redact'
    params: Record<string, string | number | boolean>;
  };
  outcome?: string;                   // outcome symbol for debug/UX
  conditions?: Condition[];           // optional evaluator predicates
  children?: CamoIRInstruction[];     // hierarchical mapping
}

function transformASTtoIR(ast: CamoAST): CamoIRInstruction[] {
  // 1) Validate required zones per KEYWORD_SPECS
  // 2) Normalize targets (Docs/4 Selector Normalization)
  // 3) Map keyword → bucket; effect/action → type/params
  // 4) Extract conditions from ":^: IF{...}" nodes; pair with ELSE branch
  // 5) Build hierarchical children chains preserving source order
  return [];
}
```

```text
IR Transform Rules
1) Bucket assignment is derived from KEYWORD_SPECS; missing bucket defaults to visual (1) for pure style ops.
2) Children inherit parent target unless they specify a narrower selector; explicit overrides win.
3) Conditional branches compile into mutually exclusive instruction sets guarded by Condition[].
4) Optimizer consolidates identical (bucket,target,effect.type) by coalescing params and applying last-write-wins.
5) Renderer consumes IR in bucket order (1→5), applying CSS classes/vars only.
```

## 2. Conditional Logic Implementation

```typescript
interface ConditionalExecution {
  // IF/ELSE in camoMetaData
  evaluateCondition(condition: string, context: BlockContext): boolean {
    // Examples:
    // IF{hover} -> check if mouse is over
    // IF{time > 17:00} -> check current time
    // IF{theme.dark} -> check Obsidian theme
  }

  // Branching logic
  executeBranch(branch: 'IF' | 'ELSE', statements: Statement[]): void;
}
```

## 3. Variable Scope

```typescript
interface CamoIRScope {
  // Block-local variables only (Obsidian constraint)
  blockScope: Map<string, any>;

  // No cross-block references (security/performance)
  // No vault-wide variables (complexity)

  // Predefined variables
  readonly systemVars = {
    'theme': () => document.body.classList.contains('theme-dark') ? 'dark' : 'light',
    'time': () => new Date().toISOString(),
    'viewport': () => ({ width: window.innerWidth, height: window.innerHeight })
  };
}
```

## 4. IR Optimization Layer 🔴 Critical

As an IR, CAMO needs optimization passes:

```typescript
class CamoIROptimizer {
  // Dead code elimination
  removeUnusedStatements(ir: CamoIR): CamoIR {
    // Remove statements with no effect
    // Remove unreachable branches
  }

  // CSS consolidation
  consolidateStyles(ir: CamoIR): CamoIR {
    // Merge similar CSS rules
    // Combine sequential operations
  }

  // Performance optimization
  optimizeForMobile(ir: CamoIR): CamoIR {
    // Reduce animation complexity
    // Simplify effects
    // Lower resolution for pixelation
  }
}
```

## 5. Obsidian Event Integration 🟡 Important

How CAMO responds to Obsidian events:

```typescript
interface ObsidianEventHandlers {
  // File events
  'file-open': (file: TFile) => void;        // Reset CAMO states
  'layout-change': () => void;               // Reprocess visible blocks
  'css-change': () => void;                  // Refresh CAMO styles

  // Editor events
  'editor-change': (editor: Editor) => void; // Debounced reprocessing
  'editor-paste': (evt: ClipboardEvent) => void; // Handle pasted CAMO blocks

  // Workspace events
  'active-leaf-change': () => void;          // Update block visibility
  'window-resize': () => void;               // Responsive adjustments
}
```

## 6. Performance Monitoring 🟡 Important

Obsidian-specific performance tracking:

```typescript
class CamoPerformanceMonitor {
  // Measure against Obsidian's render cycle
  measureRenderImpact(): PerformanceMetrics {
    return {
      blockProcessTime: performance.measure('camo-process'),
      cssInjectionTime: performance.measure('camo-css'),
      debounceEfficiency: this.calculateDebounceHits(),
      memoryFootprint: (performance as any).memory?.usedJSHeapSize
    };
  }

  // Detect performance issues
  detectBottlenecks(): BottleneckReport {
    // Too many blocks in view
    // Complex metadata parsing
    // Excessive DOM mutations
  }
}
```

## 7. Content Migration Strategy 🟡 Important

For users transitioning from other codeblock plugins:

```typescript
interface MigrationStrategy {
  // Detect existing codeblock customizations
  detectExistingPlugins(): string[] {
    // Check for: CodeblockCustomizer, Code Styler, etc.
  }

  // Convert syntax
  migrateFrom: {
    'codeblock-customizer': (block: string) => string, // Convert to CAMO
    'code-styler': (block: string) => string,
    'custom-css': (css: string) => CamoPreset
  };

  // Preserve user customizations
  preserveSettings(oldPlugin: string): CamoSettings;
}
```

## 8. Accessibility Layer 🟡 Important

Ensuring CAMO works with Obsidian's accessibility features:

```typescript
interface CamoAccessibility {
  // Obsidian reading mode
  ensureReadingModeCompatibility(): void {
    // CAMO blocks must work in both edit and reading mode
  }

  // Screen reader support
  announceBlockState(block: HTMLElement): void {
    // Use Obsidian's notification system
    // Update ARIA labels dynamically
  }

  // Keyboard navigation (Obsidian hotkeys)
  registerHotkeys(): void {
    this.plugin.addCommand({
      id: 'camo-reveal-current',
      name: 'Reveal CAMO block at cursor',
      editorCallback: (editor, view) => {
        // Find and reveal current block
      }
    });
  }
}
```

## 9. Live Preview Compatibility 🔴 Critical

Ensuring CAMO works in Obsidian's Live Preview mode:

```typescript
class LivePreviewHandler {
  // Handle partial rendering in Live Preview
  handlePartialRender(el: HTMLElement, ctx: MarkdownPostProcessorContext): void {
    // Live Preview only renders visible portions
    // Must handle incremental updates
  }

  // Cursor position awareness
  trackCursorPosition(editor: Editor): void {
    // Don't reprocess block being edited
    // Maintain state during editing
  }

  // Source mode fallback
  sourceModeDisplay(source: string): string {
    // Show readable format in source mode
    // Preserve CAMO syntax visibility
  }
}
```

## 10. Plugin Conflict Resolution 🟢 Nice-to-have

Handling conflicts with other Obsidian plugins:

```typescript
interface ConflictResolution {
  // Detect potential conflicts
  knownConflicts: {
    'dataview': 'May process CAMO blocks as queries',
    'templater': 'May interfere with CAMO syntax',
    'advanced-tables': 'Table rendering conflicts'
  };

  // Compatibility mode
  enableCompatibilityMode(plugin: string): void {
    // Adjust CAMO behavior for compatibility
  }
}
```

## 11. Mobile Optimization 🟡 Important

Obsidian mobile-specific optimizations:

```typescript
class MobileOptimization {
  // Detect Obsidian mobile
  isMobileApp(): boolean {
    return Platform.isMobile || Platform.isTablet;
  }

  // Reduce effects on mobile
  mobileSettings: {
    disableAnimations: true,
    simplifyEffects: true,
    reducedMotion: true,
    touchInteractions: true
  };

  // Touch gesture support
  setupTouchHandlers(block: HTMLElement): void {
    // Tap to reveal
    // Long press for options
    // Swipe to toggle
  }
}
```

## 12. Export/Publish Compatibility 🟢 Nice-to-have

Ensuring CAMO blocks work when exported:

```typescript
interface ExportCompatibility {
  // Obsidian Publish
  publishCompatible(): boolean {
    // Ensure CSS is included in published sites
    // Fallback for missing JavaScript
  }

  // PDF Export
  pdfExportFallback(): string {
    // Static representation for PDF
    // Visible or hidden based on settings
  }

  // Markdown Export
  markdownExport(block: CamoBlock): string {
    // Preserve CAMO syntax
    // Or convert to standard markdown
  }
}
```

## Implementation Priority

TOP PRIORITY:

1. camoMetaData Execution Engine
2. Live Preview Compatibility
3. IR Optimization Layer
4. Obsidian Event Integration

    SECONDARY PRIORITY:

    1. Performance Monitoring
    2. Accessibility Layer
    3. Mobile Optimization
    4. Content Migration Strategy
    5. Plugin Conflict Resolution
    6. Export/Publish Compatibility

## Testing Requirements

```typescript
describe('CAMO Obsidian Compatibility', () => {
  test('Works in Live Preview mode');
  test('Works in Reading mode');
  test('Works in Source mode');
  test('Handles rapid editing without memory leaks');
  test('Respects Obsidian theme changes');
  test('Functions on mobile devices');
  test('Exports correctly to PDF');
  test('Publishes correctly to Obsidian Publish');
});
```

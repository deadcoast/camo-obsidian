# MODULE INVENTORY WITH STATUS TAGS

src/core
- camoMetaData.ts — used ✅
- camoIRExecutor.ts — used ✅
- camoSyntaxValidator.ts — used
- camoSyntaxHighlighting.ts — used
- camoPreset.ts — needs wiring

src/engines
- VisualEffectsEngine.ts — used ✅
- GrammarEngine.ts — stub

src/performance
- Optimizer.ts — used
- MobileOptimization.ts — needs wiring

src/accessibility
- CamoAccessibility.ts — used
- ExportCompatibility.ts — used
- Safeguard.ts (in this folder) — n/a (primary is in error_control)

src/compatibility
- LivePreviewCompatibility.ts — used

src/security
- SecurityIntegration.ts — used
- AccessControl.ts — needs wiring
- CamoSecurityLayer.ts — legacy (unused, contains placeholders)
- Safeguard.ts (security) — legacy (duplicate removed; primary in error_control)

src/error_control
- Safeguard.ts — used
- ErrorRecovery.ts — needs wiring
- ConflictResolution.ts — used

src/ui
- SettingsTab.ts — used ✅ (integrated in main.ts)
- CamoHighlighter.ts — used
- CamoCMHighlighter.ts — used
- CamoMetaSuggest.ts — used
- PresetBuilderModal.ts — used

src/lexer
- index.ts — used

src/extractors
- ContentParser.ts — needs wiring
- IRExtractor.ts — stub
- Parser.ts — legacy (broken/unused, overlaps with ContentParser/main pipeline)

src/processors
- PresetFlagProcessor.ts — used
- PresetProcessor.ts — needs wiring
- InstructionProcessor.ts — legacy/needs wiring (conflicts with current IR+executor path)

src/modules
- CacheManager.ts — used
- Dictionary.ts — used
- StateManager.ts — needs wiring (inline manager currently used in main.ts)
- VisualCamoflage.ts — legacy (CSS now centralized in VisualEffectsEngine)
- VisualIntegration.ts — needs wiring
- RenderStrategy.ts — needs wiring
- DynamicEffectPipeline.ts — needs wiring
- ConditionalExecution.ts — needs wiring
- CommunitySharing.ts — needs wiring
- MetaDataParser.ts — legacy (overlaps with core/camoMetaData)
- ReactiveRenderer.ts — legacy (render path handled in main + camoMetaData)
- BackendCamouflage.ts — stub
- CamoCoordinateSystem.ts — stub

src/handler
- EffectHandler.ts — needs wiring (inline handler used in main.ts)
- ApplyEffectHandler.ts — needs wiring
- RemoveEffectHandler.ts — needs wiring
- SetEffectHandler.ts — needs wiring
- ToggleEffectHandler.ts — needs wiring
- ProtectEventHandler.ts — needs wiring

src/compilers
- PresetBuilder.ts — needs wiring (UI uses ui/PresetBuilderModal.ts instead)

root
- main.ts — used ✅ (core implementation complete)
- styles.css — used
- manifest.json — used ✅

## IMPLEMENTATION STATUS (Updated)

### ✅ COMPLETED IMPLEMENTATIONS
- **main.ts**: Complete CAMO plugin with Obsidian-compliant architecture
- **core/camoMetaData.ts**: Full parser and processor for camoMetaData syntax
- **core/camoIRExecutor.ts**: Intermediate representation execution engine
- **engines/VisualEffectsEngine.ts**: Advanced visual effects system with 6+ effects
- **manifest.json**: Proper CAMO plugin manifest
- **Three-tier system**: All tiers functional (presets, flags, metadata)

### 🔧 CORE FEATURES IMPLEMENTED
- **Obsidian API Compliance**: Content-based parsing, debouncing, CSS effects
- **6 Presets**: blackout, ghost, blueprint, modern95, matrix, classified
- **Advanced Effects**: blur, fade, redact, scramble, glitch, pixelate
- **Flag System**: --blur, --fade, --redact, --hover, --click, --timer, etc.
- **camoMetaData Processing**: Full syntax parsing with error handling
- **Settings System**: Complete configuration panel
- **Performance**: Mobile optimization, reduced motion support

Notes
- "used": wired in the live flow through main.ts or by downstream modules.
- "stub": intentionally minimal placeholders to be implemented later.
- "legacy": overlaps with the canonical path (core/camoMetaData + camoIRExecutor + VisualEffectsEngine + main.ts) or known broken/unused.
- "needs wiring": useful modules not yet integrated into the current runtime path.

## IMPLEMENTABLE

- compatibility/LivePreviewCompatibility.ts
- security/SecurityIntegration.ts
- modules/RenderStrategy.ts
- modules/CommunitySharing.ts

### LARGER IMPLEMENTATION

- engines/VisualEffectsEngine.ts ✅ COMPLETED
- modules/ConditionalExecution.ts
- modules/ReactiveRenderer.ts
- modules/MetaDataParser.ts ✅ INTEGRATED (core/camoMetaData.ts)
- extractors/IRExtractor.ts

#### HARD IMPLEMENTATIONS

- engines/GrammarEngine.ts — OTHER:(Requires full AST/token pipeline alignment)
- security/CamoSecurityLayer.ts — OTHER:(Design placeholder; encryption API not implemented)
- modules/DynamicEffectPipeline.ts — Depreciated
- security/Safeguard.ts — Depreciated (duplicate of error_control/Safeguard.ts)
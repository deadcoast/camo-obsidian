# nestingRules Examples

> [**INDEX**](./0_INDEX.md)

> [!NOTE]
> [**LAST-PAGE**](./4_camoMetaData.md)
>
> [**CURRENT-PAGE:** `nestingRules`](./5_nestingRules.md)
>
> [**NEXT-PAGE:**](./6_userExperience.md)

## Basic Visual Camouflage Example

```camo
:: set[blur] // content[passwords] % {intensity}(80) -> {visual[hidden]}
 :^: content[passwords] // encoding[base64] % {cipher[active]} -> {backend[encrypted]}
  :: content[passwords] // reveal[hover] % {delay}(500ms) -> {access[authorized]}
```

## Complex Multi-Layer Security Example

```camo
:: SECURITY // DOCUMENT CLASSIFICATION % [SENSITIVE]
 :^: CLASSIFICATION[SENSITIVE] // STATUS % CRITICAL -> VISUAL CAMOUFLAGE [AUTO-ENABLED]
  :: CLASSIFICATION[SENSITIVE] // BLUR LEVEL % MAXIMUM -> GAUSSIAN FILTER APPLIED
  :: CLASSIFICATION[SENSITIVE] // COLOR SHIFT % BACKGROUND MATCH -> RGB INTERPOLATION
  :: CLASSIFICATION[SENSITIVE] // PATTERN OVERLAY % NOISE GENERATED
  :: CLASSIFICATION[SENSITIVE] // ENCODING STATUS % AES-256
  :: CLASSIFICATION[SENSITIVE] // ACCESS CONTROL % AUTHENTICATED
  :: CLASSIFICATION[SENSITIVE] // REVEAL TRIGGER % PASSWORD REQUIRED
:^: PROTECTION // CONTENT PRESERVATION % ALL LAYERS ACTIVE
 :: VISUAL LAYER // BLUR + COLOR % ACTIVE MASKING
 :: BACKEND LAYER // ENCRYPTION STATUS % SECURED
 :: ACCESS LAYER // AUTHENTICATION % REQUIRED -> {password[prompt]}
 :: AUDIT TRAIL // LOGGING % ENABLED -> {track[access_attempts]}
```

## Practical Use Case - API Keys Protection

```camo
:: PROTECT // API_KEYS % CRITICAL SECURITY
 :^: API_KEYS // VISUAL STATE % COMPLETELY OBSCURED
  :: API_KEYS // DISPLAY MODE % DOTS ONLY -> ••••••••
:: ENCODING // BASE64 + CUSTOM % DOUBLE LAYER
  :: ENCODING // FIRST PASS % BASE64 TRANSFORM
  :: ENCODING // SECOND PASS % CUSTOM CIPHER -> {key[user_defined]}
  :: ENCODING // STORAGE % ENCRYPTED BACKEND
  :: ENCODING // RETRIEVAL % AUTHORIZED ONLY -> {verify[fingerprint]}

:: PROTECTION // CREDENTIALS % MAXIMUM SECURITY
 :^: CREDENTIALS // AWS_SECRET % HIDDEN -> PATTERN OVERLAY ACTIVE
  :: CREDENTIALS // GITHUB_TOKEN % HIDDEN -> BLUR FILTER 95%
  :: CREDENTIALS // DATABASE_PASSWORD % HIDDEN -> COLOR SHIFT BLACK
```

## Coordinate System Navigation Example

```camo
:: NAVIGATE // CAMO_BLOCKS % SPATIAL POSITIONING
 :^: BLOCKS // POSITION % [10, 5, 3] -> 3D COORDINATE SPACE
  :: BLOCKS // NEIGHBORS % MAPPED -> {north[block2], south[block3]}
:: PATH // SHORTEST ROUTE % DIJKSTRA ALGORITHM
  :: PATH // FROM[block1] TO[block5] % 3 HOPS -> {cost[minimal]}
  :: PATH // CACHE STATUS % PRECOMPUTED -> O(1) LOOKUP
  :: PATH // COLLISION DETECTION % NONE -> CLEAR TRAVERSAL
```

## Real-World Application - Medical Records

```camo
:: CAMOUFLAGE // PATIENT_DATA % HIPAA COMPLIANT
 :^: PATIENT_DATA // SSN % FULLY REDACTED -> ███-██-████
  :: PATIENT_DATA // DOB % PARTIALLY VISIBLE -> XX/XX/1985
  :: PATIENT_DATA // MEDICAL_ID % ENCODED -> {hash[SHA256]}
:^: REVEAL // AUTHORIZATION LEVELS % ROLE BASED
 :: DOCTOR_ACCESS // FULL VIEW % PASSWORD + 2FA
 :: NURSE_ACCESS // PARTIAL VIEW % PASSWORD ONLY
 :: ADMIN_ACCESS // METADATA ONLY % AUDIT PURPOSES
 :: PUBLIC_ACCESS // DENIED % NO VISIBILITY
```

## Development Configuration Example

```camo
:: CONFIG // VISUAL_CAMOUFLAGE % ENABLED
  :: CONFIG // BLUR_EFFECT % GAUSSIAN -> {radius[5px]}
  :: CONFIG // COLOR_SHIFT % DYNAMIC -> {match[background]}
  :: CONFIG // PATTERN_OVERLAY % PROCEDURAL -> {seed[random]}

:: CONFIG // ENCODING_METHODS % MULTI_LAYER
 :^: ENCODING // PRIMARY % BASE64 -> FAST DECODE
  :: ENCODING // SECONDARY % AES-256 -> SECURE STORAGE
  :: ENCODING // TERTIARY % CUSTOM_CIPHER -> USER DEFINED

:: CONFIG // USER_CONTROLS % CUSTOMIZABLE
  :: CONTROLS // GLOBAL_TOGGLE % Cmd+Shift+C
  :: CONTROLS // QUICK_REVEAL % Hover -> {delay[300ms]}
  :: CONTROLS // PASSWORD_LOCK % Optional -> {timeout[5min]}
```

## Integration with Obsidian Vault

```camo
:: VAULT // CAMO_INTEGRATION % ACTIVE
 :^: INTEGRATION // FILE_WATCHER % MONITORING -> .md AND .camo FILES
  :: INTEGRATION // MERKLE_TREE % BUILT -> INTEGRITY VERIFICATION
  :: INTEGRATION // TRANSACTION_LOG % RECORDING -> ACID COMPLIANT
:^: PERSISTENCE // SAVE_STATE % ATOMIC WRITES
 :: SAVE // LOCATION % .obsidian/plugins/camo/data.json
 :: SAVE // FREQUENCY % ON_CHANGE -> DEBOUNCED 1000ms
 :: SAVE // BACKUP % ENABLED -> {versions[5]}
```

## Hierarchy Reference Rules (Normative)

```text
1) Root statements begin with "::"; child statements begin with ":^:" and MUST logically reference their nearest valid ancestor context (keyword/variable/label/target scope).
2) Sibling order is preserved; optimizer may consolidate equal-priority operations without changing observable outcomes.
3) Parent effects apply before children; children refine or override within the same normalized target scope.
4) Conditional branches: use ":^: IF{...}" followed by optional ":: ELSE" sibling branch; only one branch executes per evaluation cycle.
5) Orphan ":^:" (no valid ancestor) and cyclic references are invalid and MUST be surfaced by the validator with line references.
6) Cross-branch side effects are isolated; state writes occur only for the executed branch.
7) Last-write-wins applies on identical normalized targets within the same priority bucket.
```

## Execution Order & Priority Notes

```text
Priority buckets (from Docs/3_camoIR.md operationPriority):
  1) visual   2) layout   3) animation   4) interaction   5) state

Evaluation contract:
  - Visual/layout compose first to establish baseline presentation.
  - Animation applies to the composed visual/layout.
  - Interaction gates visibility or toggles states over time.
  - State/security persist/authorize at the end of the cycle.

Conflict resolution:
  - Higher-priority buckets override lower ones only in their domain.
  - Within the same bucket, last-write-wins after normalization.
```

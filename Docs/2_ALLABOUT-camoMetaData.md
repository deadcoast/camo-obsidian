# ALLABOUT-camoMetaData

> [**INDEX**](./0_INDEX.md)

> [!NOTE]
> [**LAST-PAGE**](./1_OVERVIEW.md)
>
> [**CURRENT-PAGE:** `ALLABOUT-camoMetaData`](./2_ALLABOUT-camoMetaData.md)
>
> [**NEXT-PAGE:**](./3_camoIR.md)

## What is camoMetaData?

Think of camoMetaData as the **CSS for your CAMO codeblocks**. While `camo` is the structure (like HTML), `camoMetaData` is the styling and behavior layer that makes your hidden content look and act exactly how you want it to.

### The Relationship

```text
CAMO (Parent Application)
  ├── camo codeblock (Structure)
  ├── camoMetaData (Inline Styling)
  └── camoPreset (Pre-made Templates)
```

---

## How to Use camoMetaData

### Basic Usage: Inside Your Codeblock

camoMetaData lives **inside** your CAMO codeblock, right where you need it. No separate files, no complex configuration—just inline commands that modify that specific block.

```camo
:: set[blur] // content[all] % {intensity}(60) -> {visual[blurred]}
Your sensitive content here
```

### What Just Happened?

1. `::` - Started a camoMetaData instruction
2. `set[blur]` - Chose to set a blur effect
3. `// content[all]` - Targeted all content in the block
4. `% {intensity}(60)` - Set blur intensity to 60%
5. `-> {visual[blurred]}` - Confirmed the visual state

---

## Core Syntax Pattern

Every camoMetaData instruction follows this pattern:

```camo
[DECLARATION] // [TARGET] % [EFFECT] -> [OUTCOME]
```

Or in human terms:

```camo
[WHAT TO DO] // [WHERE TO DO IT] % [HOW TO DO IT] -> [WHAT HAPPENS]
```

---

## Common Use Cases

### 1. Privacy Protection

"I want to hide sensitive information until clicked"

````markdown
```camo
:: protect[content] // text[all] % {trigger}(click) -> {secure[hidden]}
API_KEY=sk_live_abcd1234efgh5678
DATABASE_PASSWORD=super$ecret123
```
````

### 2. Visual Effects

"I want a cool blur effect that reveals on hover"

````markdown
```camo
:: set[blur] // content[all] % {intensity}(80) -> {visual[blurred]}
 :^: blur // IF{hover} % {reveal}(true) -> {visual[clear]}
My secret recipe for chocolate cake...
```
````

### 3. Timed Reveals

"I want content to appear at a specific time"

````markdown
```camo
:: schedule[reveal] // content[all] % {at}(2024-03-01T09:00:00Z) -> {timer[set]}
ANNOUNCEMENT: Our new product launches March 1st!
```
````

### 4. Conditional Display

"I want different people to see different things"

````markdown
```camo
:: select[role] // content[all] % {check}(user.role) -> {evaluating[permissions]}
 :^: role // IF{admin} % {show}(all) -> {content[visible]}
 :^: ELSE // redact % {level}(high) -> {content[redacted]}
Salary: $150,000
SSN: 123-45-6789
```
````

---

## Working with camoPresets

camoPresets are **pre-written camoMetaData templates** that you can use with a single word:

### Without Preset (Manual camoMetaData)

````markdown
```camo
:: set[background] // content[all] % {color}(#000000) -> {visual[blackout]}
:: set[opacity] // text[all] % {value}(0) -> {text[hidden]}
:: set[reveal] // trigger[click] % {animation}(fade) -> {interaction[ready]}
Hidden content
```
````

### With Preset (Automatic camoMetaData)

````markdown
```camoblackout
Hidden content
```
````

**Both do the same thing!** The preset just includes the camoMetaData automatically.

---

## The Power of Inline Modification

### Modifying Presets with camoMetaData

You can start with a preset and add your own camoMetaData:

````markdown
```camoblackout
:: add[timer] // reveal % {after}(5s) -> {timed[reveal]}
This starts as blackout but reveals after 5 seconds
```
````

### Combining Multiple Effects

````markdown
```camo
:: apply[blur] // content[all] % {intensity}(40) -> {layer[1]}
 :^: blur // add[pixelate] % {size}(8) -> {layer[2]}
  :: add[scramble] // text[headers] % {speed}(100ms) -> {layer[3]}
Triple-protected content with blur, pixelation, and scrambled headers
```
````

---

## Quick Reference: Common Commands

### Visual Effects

|Command|What It Does|Example|
|---|---|---|
|`set[blur]`|Blurs content|`% {intensity}(0-100)`|
|`apply[pixelate]`|Pixelates content|`% {size}(4-32)`|
|`set[opacity]`|Changes transparency|`% {value}(0-1)`|
|`apply[scramble]`|Scrambles text|`% {speed}(50-500ms)`|

### Interactions

|Command|What It Does|Example|
|---|---|---|
|`reveal[hover]`|Show on mouse hover|`% {delay}(0ms)`|
|`reveal[click]`|Show on click|`% {animation}(fade)`|
|`protect[password]`|Require password|`% {attempts}(3)`|
|`set[timer]`|Time-based reveal|`% {after}(5s)`|

### Content Selection

|Target|What It Selects|Example|
|---|---|---|
|`content[all]`|Everything|Entire block|
|`text[headers]`|Headers only|# Headers|
|`content[lines:1-5]`|Specific lines|First 5 lines|
|`pattern[regex]`|Pattern match|`/API_KEY/`|

---

## Understanding Hierarchical Commands

The `:^:` operator creates parent-child relationships:

````markdown
```camo
:: protect[main] // content[all] % {level}(high) -> {protected}
 :^: main // sublevel[1] % {add_blur}(60) -> {layer_added}
  :: sublevel[2] // add[encrypt] % {method}(aes) -> {encrypted}
```
````

- `::` starts a new instruction
- `:^:` references the parent instruction
- Indentation shows the hierarchy visually

---

## Debugging Your camoMetaData

### Check Your Syntax

If something isn't working, verify:

1. **Operators are correct:** `::`, `//`, `%`, `->`
2. **Brackets match:** Every `[` has a `]`, every `{` has a `}`
3. **Keywords exist:** Use valid commands from the reference
4. **Indentation is consistent:** For hierarchical commands

### Common Mistakes

❌ `:: set(blur)` - Wrong brackets (should be `[blur]`)
❌ `:: blur // content[all]` - Missing keyword (should be `set[blur]`)
❌ `:: set[blur] content[all]` - Missing `//` operator
✅ `:: set[blur] // content[all] % {intensity}(60) -> {visual[blurred]}`

---

## Integration Points

### With Regular CAMO

- camoMetaData only works inside `camo` codeblocks
- It modifies that specific block only
- Multiple blocks can have different camoMetaData

### With camoPresets

- Presets include predefined camoMetaData
- You can override preset settings with inline camoMetaData
- Custom presets can be saved and shared

### With Obsidian

- Works in edit and preview modes
- Respects Obsidian themes (dark/light)
- Integrates with other plugins when possible

---

## Advanced Patterns

### Conditional Logic

````markdown
```camo
:: IF{condition} // check[time] % {after}(17:00) -> {evaluate}
 :^: TRUE // reveal % {all} -> {content[visible]}
 :^: FALSE // maintain % {hidden} -> {content[hidden]}
After 5 PM, this content becomes visible
```
````

### Multi-Step Reveals

````markdown
```camo
:: reveal[progressive] // content[paragraph:1] % {delay}(0s) -> {step[1]}
 :^: progressive // content[paragraph:2] % {delay}(2s) -> {step[2]}
  :: content[paragraph:3] // delay % {2s} -> {step[3]}
Each paragraph appears 2 seconds after the previous
```
````

### State Persistence

````markdown
```camo
:: store[state] // preference[blur_level] % {value}(60) -> {saved}
 :^: state // apply[saved] % {on_load}(true) -> {persistent}
Remembers your blur preference between sessions
```
````

---

## Best Practices

### 1. Start Simple

Begin with basic commands before attempting complex hierarchies:

```camo
:: set[blur] // content[all] % {intensity}(50) -> {done}
```

### 2. Use Presets When Possible

If a preset does what you need, use it instead of writing custom camoMetaData:

```camoblackout
```

### 3. Comment Complex Logic

Use regular markdown comments to explain complex camoMetaData:

```camo
<!-- This creates a 3-layer security system -->
:: protect[layer1] // content[all] % {blur}(40) -> {secured}
 :^: layer1 // add[encrypt] % {method}(aes) -> {encrypted}
```

### 4. Test Incrementally

Add one instruction at a time and test before adding more.

### 5. Keep It Readable

Use meaningful names and consistent indentation:

```camo
✅ :: reveal[sensitive_data] // content[api_keys] % {on}(authentication) -> {revealed}
❌ :: r[sd] // c[ak] % {o}(a) -> {r}
```

---

## FAQ

**Q: Can I use camoMetaData without understanding code?**
A: Yes! Start with presets and simple commands. You don't need programming knowledge.

**Q: What happens if I make a syntax error?**
A: CAMO will fall back to default behavior and show an error message. Your content remains safe.

**Q: Can I save my custom camoMetaData as a preset?**
A: Yes! Save frequently-used camoMetaData patterns as custom presets for reuse.

**Q: Does camoMetaData work on mobile?**
A: Yes, but some visual effects may be simplified for performance.

**Q: Can I combine multiple presets?**
A: Not directly, but you can use one preset and add camoMetaData to modify it.

---

## Summary

camoMetaData is your **inline styling language** for CAMO codeblocks. It:

- Lives inside your codeblocks
- Uses a readable pattern: `[WHAT] // [WHERE] % [HOW] -> [RESULT]`
- Works with presets or standalone
- Provides fine-grained control over appearance and behavior
- Requires no external configuration

Start with presets, experiment with simple modifications, and gradually explore the full power of camoMetaData as you become comfortable with the syntax.

---

## Next Steps

1. **Try a preset:** Start with ````camoblackout```
2. **Add simple camoMetaData:** Add a reveal trigger
3. **Experiment:** Try different effects and combinations
4. **Share:** Create and share your own presets with the community

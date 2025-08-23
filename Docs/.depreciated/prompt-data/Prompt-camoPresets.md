# prompt-camoPresets

Good Job.

We have reached the technical peak of majority obsidian users understanding for new syntax. Adding more complex syntax will make the falloff greater, and compounding with each technicality. What we have now is fantastic a good balance.

How can we use that, what we have designed so far to further develop the user experience and Quality of Life in the obsidian plugin? These features are what will drive users to stay using `camo`.

What we accomplished: _Offering enough customizations in the syntax for power users to get what they want._

What we need to do next: **Create enhanced Quality of Life, Visual integrations and customizations(maintaining quality of life standards), create designs for streamlined use like themes, `camo` presets, `camoMetaData` presets and templates.

**NOTE**: `camoMetaData` is designed to operate with `camo` , but it should be clear that `camo` can run without writing the `camoMetaData`. Think of it as: `camoMetaData` = ".css" and `camo` = ".html".  `camo` operates mostly as a cosmetic Obsidian Plugin for Code Blocks, so both syntax are inherently cosmetic in function and effect, but`camoMetaData` modifies the appearance of `camo`, so in this case it is the cosmetic syntax (``.css`)``

Developing simplicity, **NOT IN THE CODE**, but for the user operational experience of `camo`.

This requires Quality of Life, and QOL does not come without additional development and features to provide it.

## USE CASES AND COMPLEXITY FORMATS

`camo` will provide users three levels(formats) of use case complexity.

1. `camoPreset`: Offers the Casual Audience the ability to operate `camo` with ease, utilizing the premade full scope templates.
2. `presetFlag`: Addional --flag (color_scheme) modifications that offer a user friendly way to customize the `camoPreset` template.
3. `camoMetaData`: advanced meta data syntax system, full scope customizations.

## camoPresets

`COMPREHENSIVE ORGANIZED MODULAR STRUCTURE`(`COMS`)
MEANING: The core design principle of `camoPreset`

**THE ENTIRE THEMING AND CUSTOMIZATION SYSTEM SHOULD BE PRE DESIGNED ADHERING TO `COMS`  AND `SRP`**

`camoPreset`:

- operate at the end of the triple back tick (\`\`\`) code block definition of `camo.` Themes are similar but do not offer the combined cosmetic and metadata functionality we are proposing in `camo`.
- Designed with confidence and reliability in priority by developing safeguards to any errors, bugs, or user mishandling.
FUNCTION: Integrates and opperates seamlessly across `camo` and `camoMetaData` modules.

EXAMPLE:

```camoblackout
`camoblackout`: Total codeblock blackout. Solid black over the code block
```

```camoblueprint
`camoblueprint`: Aesthetic blues, inspired by classic blueprinting aesthetics
```

```camomodern95
`camomodern95`: Modern pastels meet Bold Retro Terminal Green, on a dark charcoal background
```

> `camo`  at its core should be over developed with features and fallbacks to achieve a plugin that is retainable and enticing to both casual and power users. For user quality of life, the `camoPreset` must further integrate this process by developing a structured and comprehensive theme system that is deeply integrated into the rest of `camo`
> Power users will prefer the robust and comprehensive `camoMetaData` format,
> Casual and Jr-Devs will appreciate the effort that went into developing the quality of life, ease of use and user experience of `camoPreset`.

---

## presetFlag and styleModifiers

identifier: `--`
Example: `--<camoPreset>`

`presetFlag`(`--`): identifers that modify the `camoPreset` with a `styleModifier`.
`styleModifier`: added inline after presetFlag to the `camo` codeblock definition, followed by the [camoPreset] title of the color scheme you wish to use. `camoblueprint--<styleModifer>`

### styleModifiers

`blur`: slightly blurs the camoPreset
`peek`: sets the codeblock to `camoblackout` unless clicked on
`flash`: sets the codeblock to solid white unless clicked on

### Examples

```camoblackout--blur
`camoblackout`: Total codeblock blackout. Solid black over the code block
```

```camoblueprint--peek
`camoblueprint`: Aesthetic blues, inspired by classic blueprinting aesthetics
```

```camomodern95--flash
`camomodern95`: Modern pastels meet Bold Retro Terminal Green, on a dark charcoal background
```

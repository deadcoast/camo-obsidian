# camoMetaData syntax

camoMetaData is a syntax language designed for relational data structures. Its core purpose in camo is to manipulate how the contents of the codeblock displays itself, inline. This README documents the syntax structure, rules, and practical usage examples.

```text
┌─────┐               ┌─────┐               ┌─────┐               ┌─────┐
│ [1] │ DECLARATION   │ [2] │ TARGET        │ [3] │ EFFECT        │ [4] │ OUTPUT
├─────┴───────────────┼─────┴───────────────┼─────┴───────────────┼─────┴────────────┐
│  [1.1] NLstring     │  [2.1] FUNCTION     │  [3.1] ACTION       │  [4.1] OUTCOME   │
├─────────────────────┼─────────────────────┼─────────────────────┼──────────────────┤
│  [1.2] KEYWORD      │  [2.2] EQUATE       │  [3.2] PARAMATER    │        ---       │
├─────────────────────┼─────────────────────┼─────────────────────┼──────────────────┤
│  [1.3] VARIABLE     │         ---         │  [3.3] TRIGGER      │        ---       │
├─────────────────────┼─────────────────────┼─────────────────────┼──────────────────┤
│  [1.4] MODIFIER     │         ---         │         ---         │        ---       │ 
├┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┼┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┼┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┼┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┬┤
│                                                                                    │
│             [1.4]                                                                  │
│               ^                                                                    │
│         [1.3] │            [2.2]            [3.3]                                  │
│           ^   │              ^                ^                                    │
│     [1.2] │   │       [2.1]  │          [3.2] │                                    │
│       ^   │   │         ^    │            ^   │                [4.1]               │
│ [1.1] │   │   │         │    │      [3.1] │   │                  ^                 │
│   ^   │   │   │         │    │        ^   │   │                  │                 │
│ ┌─┼───┴───┼───┼─┐ ┌─────┼────┼─┐ ┌────┼───┼───┼─┐ ┌──────────────┼───────────────┐ │
│ │ +   +   +   + │ │     +    + │ │    +   +   + │ │              +               │ │
│ │ :: set[ ]  // │ │ function % │ │ action[ ] -> │ │           OUTCOME            │ │
├─┴───────────────┴─┴────────────┴─┴──────────────┴─┴──────────────────────────────┴─┤
│```camo                                                                             │
│   :: set[color] // text[errors] % {new_color}(#FF0000) -> {conf[success]}          │
│```                                                                                 │
└────────────────────────────────────────────────────────────────────────────────────┘
```

## [1]  DECLARATION

The first zone in the camoMetaData

### Rules

- ALLOWED: NLstring, Keywords, variables, modifiers

## [2] TARGET

The second zone in the camoMetaData

### targetRules

- ALLOWED:

## [3] EFFECT

The third zone in the camoMetaData

### effectRules

- ALLOWED:

## [4] OUTPUT

The fourth zone in the camoMetaData

### outputRules

- ALLOWED:

## Operators

- `::`:  marks the beginning of a NLstring
- `//`: `Modifier` operator, connecting or changing(modifying) concepts, options
- `%`: `Equate` operator, proving the results of the modifer relation or condition
- `->`: `Trigger` operator, indicating outcomes
- `{ }`: houses actions
- `[ ]`: houses variables
- `( )`: houses options

## Keywords

| Symbol  | Function | Semantic Meaning                        |
| ------- | -------- | --------------------------------------- |
| `set`   | modifier | "change or modify a variable"           |
| `color` | variable | "identify color as the action variable" |
| `conf`  | action   | "confirmation of trigger outcome"       |
|         |          |                                         |
|         |          |                                         |

## Definitions

`camoMetaData`: the module for the top syntax of camoMetaData
`set`: modify or change a variable

### Actions {  }

alias: `actn`

- `actn`:  swap or change a [variable]

### Variables [  ]

alias: `var`

- `color`: identifies the color variable for the calling {func}

So a line like:

```barrel
:: set[color] // text[errors] % {new_color}(hex) -> {conf[]}
```

Means:

- Swap color, modify the camoMetaData errors,  equate the new color to '#FF0000', trigger the confirmation prompt with the variable for success or failure

### Options ( )

alias: `opt`

- `hex`: hex color code for cutomizing the way camoMetaData displays

Example:

```barrel
::  set[color] // text[errors] % DENIED -> PLANETARY SYSTEM FAILURE [SELF-INITIATED]
```

This means:

- Race 2, in Relation to AWAKENING, has Modifier: DENIED, which Triggered PLANETARY SYSTEM FAILURE [SELF-INITIATED]

## Hierarchical Nesting Structure

### Hierarchical Nesting Port (`:^:`)

The Hierarchical Nesting Port is a vertical operator `^` inserted into a New Call String to reference keywords from above lines.

### Nesting Rules

1. **When using `:^:` (Hierarchical Nesting Port)**:

   - Single space indentation
   - PORT OPERATOR `^` must align with the first colon in NLstringg

1. **When using only `::` (NLstring)**:
   - Double space indentation

### Examples of Correct Nesting

```barrel
:: INTELLIGENCE // EARTH NOT RARE % HUMAN RARE
 :^: EARTH // 1 OF 302,973 % BIRTH CONSCIOUS LIFEFORM
  :: EARTH // 1 OF 1 % ESCAPE PLANETARY SILENCE
```

```barrel
:: INTELLIGENCE // EARTH NOT RARE % HUMAN RARE
  :: EARTH // 1 OF 302,973 % BIRTH CONSCIOUS LIFEFORM
  :: EARTH // 1 OF 1 % ESCAPE PLANETARY SILENCE
```

### Examples of Incorrect Nesting

```barrel
:: INTELLIGENCE // EARTH NOT RARE % HUMAN RARE
  :^: EARTH // 1 OF 302,973 % BIRTH CONSCIOUS LIFEFORM    # ERROR: Too many spaces before `:^:`
    :: EARTH // 1 OF 1 % ESCAPE PLANETARY SILENCE         # ERROR: Too many spaces
```

```barrel
:: INTELLIGENCE // EARTH NOT RARE % HUMAN RARE
 :: EARTH // 1 OF 302,973 % BIRTH CONSCIOUS LIFEFORM      # ERROR: Single space without `:^:`
 :: EARTH // 1 OF 1 % ESCAPE PLANETARY SILENCE            # ERROR: Single space without `:^:`
```

![Hierarchy Diagram](assets/img/hierarchy-color-window.png)

## Practical Usage Example

```barrel
:: KEYWORD // FUNCTION % PARAMATER -> OUTCOME
 :^: KEYWORD // FUNCTION % PARAMATER -> OUTCOME
  :: KEYWORD // FUNCTION % PARAMATER -> OUTCOME
  :: KEYWORD // FUNCTION % PARAMATER -> OUTCOME
:^: KEYWORD // FUNCTION % PARAMATER -> OUTCOME
 :: KEYWORD // FUNCTION % PARAMATER -> OUTCOME
 :: KEYWORD // FUNCTION % PARAMATER -> OUTCOME
```

```barrel
:: THREAT // AWAKENING CANDIDATE RACE % [2]
 :^: RACE[2] // STATUS % CRITICAL -> PLANETARY SYSTEM FAILURE [SELF-INITIATED]
  :: RACE[2] // AWAKENING % DENIED
  :: RACE[2] // DANGER LEVEL % ABSOLUTE -> INTERGALACTIC TRAVEL ACHIEVED
:^: INTENT // SPECIES PRESERVATION % ANY MEANS NECESSARY
 :: TARGET ACQUISITION // EARTH BIOSPHERE % HABITABLE MATCH
 :: EARTH STATUS // SELECTED % RECLAMATION
```

## Syntax Zone Details

### Zone 1: Declaration

- First zone of the syntax line
- Contains:
  - KEYWORD
  - RELATION `//`
  - NLstring IDENTIFIER `::`
- Must begin with `::`
- Must end with relation identifier `//`
- If repeated keyword, must indent two spaces

### Zone 2: Cause

- Second zone of the syntax line
- Contains:
  - FUNCTION
  - MODIFIER `%`

### Zone 3: Effect

- Third zone of the syntax line
- Contains:
  - PARAMETER
  - TRIGGER `->`

### Zone 4: Outcome

- Final zone containing the result or outcome

## Further Resources

For more complex examples and advanced usage, refer to the complete documentation.

---

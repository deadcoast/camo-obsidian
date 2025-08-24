# INDENTATION DEEP DIVE

```barrel
[A] `::` First New Line String
[B] `:^:` First Nesting Port
[C] `::` Beginning of Second New Line String, Connecting through ([2]) First Nesting Port
[D] `:^:` Heirarchal Modifier Port that connects [A] Line String with [B],[C]
[E] `:^:` Beginning of Second Nesting Port, Connecting ([A], [B], [C], [D]) all nesting strings.
┌───┬───┬───┬───┐
│ 1 │ 2 │ 3 │ 4 │
└─┬─┴─┬─┴─┬─┴─┬─┘
  ⇣   ⇣   ⇡   ⇣
  ┌───┐   │   │
  : A :   ⇡   ⇣  <--[A] CONNECTS [1],[2] --> [B], [D]
  ├───┤   │   │
  ⇣   ⇣   ⇡   ⇣
  │   ┌───^───┐
  ⇣   :   B   :  <--[B] CONNECTS [2],[3],[4] --> [C],[D],[E]
  │   ├───┬───┤
  ⇣   ⇡   ⇡   ⇣
  │   │   ┌───┐
  ⇣   ⇡   : C :  <--[C] CONNECTS [3],[4] --> [B],[D]
  │   │   └───┘
  ⇣   ⇡   ⇡   ⇣
  │   │   ┌───┐
  ⇣   ⇡   : C :  <--[C] CONNECTS [3],[4] --> [B],[D]
  │   │   └───┘
  ⇣   ⇡   ⇣   ⇣
  ┌───^───┐   │
  :   D   :   ⇣  <--[D] CONNECTS [1],[2],[3] --> [A],[B],[C],[E]
  ├───┬───┤   │
  ⇣   ⇡   ⇣   ⇣
  │   ┌───┐   │
  ⇣   : E :   ⇣  <--[E] CONNECTS [3],[4] --> [C],[D]
  │   └───┘   │
  ⇣   ⇡   ⇣   ⇣
  │   ┌───┐   │
  ⇣   : E :   ⇣  <--[E] CONNECTS [3],[4] --> [C],[D]
  │   └───┘   │
  ⇣   ⇡   ⇣   ⇣
```

```barrel
[A] `::` First New Line String
[B] `:^:` First Nesting Port
[C] `::` Beginning of Second New Line String, Connecting through ([2]) First Nesting Port
[D] `:^:` Heirarchal Modifier Port that connects [A] Line String with [B],[C]
[E] `:^:` Beginning of Second Nesting Port, Connecting ([A], [B], [C], [D]) all nesting strings.
┌─┐ ┌─┐ ┌─┐ ┌─┐
│1│ │2│ │3│ │4│
└┬┘ └┬┘ └┬┘ └┬┘
 ├───┼───┼───┤
 │   │   ▲   │
 +───+   │   │
 : A :   ▲   │  <--[A] CONNECTS [1],[2] --> [B], [D]
 +───+   │   │
 ▼   ▼   ▲   │
 ├───┼───┼───┤
 ▼   ▼   ▲   │
 │   +───^───+
 ▼   :   B   :  <--[B] CONNECTS [2],[3],[4] --> [C],[D],[E]
 │   +───+───+
 ▼   ▲   ▲   ▼
 │   │   +───+
 │   ▲   : C :  <--[C] CONNECTS [3],[4] --> [B],[D]
 │   │   +───+
 ▼   ▲   +───+
 │   │   : C :  <--[C] CONNECTS [3],[4] --> [B],[D]
 │   ▲   +───+
 ▼   │   ▼   ▼
 +───^───+   │
 :   D   :   │  <--[D] CONNECTS [1],[2],[3] --> [A],[B],[C],[E]
 +───:───+   │
 ▼   ▲   ▼   ▼
 │   +───+   │
 │   : E :   │  <--[E] CONNECTS [3],[4] --> [C],[D]
 │   +───+   │
 ▼   ▲   ▼   ▼
 │   +───+   │
 │   : E :   │  <--[E] CONNECTS [3],[4] --> [C],[D]
 │   +───+   │
 ▼   ▲   ▼   ▼
```

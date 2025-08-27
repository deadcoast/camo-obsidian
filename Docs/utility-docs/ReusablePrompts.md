# Reusable Prompts

## Documentation

This is a collection of reusable prompts for the ai agent.

### START CHAT PROMPT

```text
---
ATTN: #LARGE-REQUEST
REQ: #MAX-CONTEXT
---
Take your time reviewing the codebase design docs to ensure you understand the entire projects codebase design from front to back. The docs are 7 files of comprehensive design.

We are in mid development of the application, so before you can change any code, you must take the time required to train yourself on the documentation.

BEGIN WITH:
```

### CHANGELOG SUMMARY PROMPT

update the changelog with A COMPREHENSIVE QUICKSTART UPDATE:

SUMMARIZE THE CHANGES SO FAR ROBUSTLY SO THE NEW DEV WHO WORKS ON THIS TOMORROW WILL HAVE A FULL SCOPE TO TRAIN THEMSELF ON.

1. `QUIKSTART`: Based on your current position marker in the tasklist, and the source codes current state;

```
> -
> > Current Position
> -
```
- Create the next stage of @TODO TODO list to work on as a plan at the top of the @CHANGELOG
    - Include what (./Docs)documents to review, and place their corresponding source code links beside them:{
    "[MyDocument](./Docs/myDocumentFile.md)"
    "[MyCodeFile](path/to/mycodefile.ts)"
}

```
I'll scan the existing accessibility modules to implement export/publish fallbacks, and locate syntax highlighting and autocomplete integration points to wire providers according to Obsidian docs.
```

import { CORE_PRESETS } from "../core/camoPreset";

export class CamoCommunitySharingV1 {
  // Share via GitHub Gist
  async sharePreset(
    preset: (typeof CORE_PRESETS)[keyof typeof CORE_PRESETS]
  ): Promise<string> {
    const gistContent = {
      description: `CAMO Preset: ${preset.trigger}`,
      public: true,
      files: {
        [`${preset.trigger}.json`]: {
          content: JSON.stringify(preset, null, 2),
          language: "json",
          encoding: "utf-8",
        },
      },
      metadata: {
        name: preset.trigger,
        description: preset.metadata,
        author: "CAMO",
        version: "0.0.1",
        license: "MIT",
      },
      tags: ["CAMO", "Preset"],
      categories: ["CAMO", "Preset"],
      flags: ["CAMO", "Preset"],
      // TODO: Add effects, targets, outputs, conditions, actions, variables, styles, scripts, dependencies, conflicts, notes
      effects: preset.metadata,
      targets: preset.metadata,
      outputs: preset.metadata,
      conditions: preset.metadata,
      actions: preset.metadata,
      variables: preset.metadata,
      styles: preset.metadata,
      scripts: preset.metadata,
      dependencies: preset.metadata,
      conflicts: preset.metadata,
      notes: preset.metadata,
    };

    // Validate preset structure
    if (!this.validatePreset(gistContent)) {
      throw new Error("Invalid preset format");
    }

    // Create gist and return URL
    const response = await fetch("https://api.github.com/gists", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
      },
      body: JSON.stringify(gistContent),
    });

    if (!response.ok) {
      throw new Error("Failed to create gist");
    }

    const gist = await response.json();
    return gist.html_url;
  }

  private validatePreset(preset: any): boolean {
    // Basic structure validation
    if (!preset.description || !preset.name || !preset.author) {
      return false;
    }

    // Validate required fields
    const requiredFields = [
      "name",
      "description",
      "author",
      "version",
      "license",
    ];
    for (const field of requiredFields) {
      if (!preset[field]) {
        return false;
      }
    }

    // Validate nested structures
    if (
      !Array.isArray(preset.effects) ||
      !Array.isArray(preset.targets) ||
      !Array.isArray(preset.outputs)
    ) {
      return false;
    }

    return true;
  }

  // Import from URL
  async importPreset(
    url: string
  ): Promise<(typeof CORE_PRESETS)[keyof typeof CORE_PRESETS]> {
    const response = await fetch(url);
    const preset = await response.json();

    // Validate preset structure
    if (!this.validatePreset(preset)) {
      throw new Error("Invalid preset format");
    }

    return preset;
  }
}

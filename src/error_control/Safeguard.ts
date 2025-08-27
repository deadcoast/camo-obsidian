export interface SafeguardOptions {
  defaultPresetId?: string;
}

export class CamoSafeguard {
  private readonly defaultPresetId?: string;

  constructor(options?: SafeguardOptions) {
    this.defaultPresetId = options?.defaultPresetId;
  }

  async renderSafe(container: HTMLElement, presetId?: string): Promise<void> {
    const chain = [
      () => this.tryPreset(container),
      () => this.tryDefaultPreset(container, presetId || this.defaultPresetId),
      () => this.tryMinimalStyle(container),
      () => this.renderPlaintext(container),
    ];

    for (const step of chain) {
      try {
        const applied = step();
        if (applied) return;
      } catch {
        // continue to next step
      }
    }
  }

  private tryPreset(container: HTMLElement): boolean {
    // If a preset class is already applied, treat as successful fallback
    const hasPreset = Array.from(container.classList).some((c) =>
      c.startsWith("camo-preset-")
    );
    return hasPreset;
  }

  private tryDefaultPreset(
    container: HTMLElement,
    defaultPresetId?: string
  ): boolean {
    if (!defaultPresetId) return false;
    const hasPreset = Array.from(container.classList).some((c) =>
      c.startsWith("camo-preset-")
    );
    if (hasPreset) return false;
    container.classList.add(`camo-preset-${defaultPresetId}`);
    return true;
  }

  private tryMinimalStyle(container: HTMLElement): boolean {
    if (container.classList.contains("camo-fallback-minimal")) return true;
    container.classList.add("camo-fallback-minimal");
    // Ensure content is visible
    const content = container.querySelector(
      ".camo-content"
    ) as HTMLElement | null;
    if (content) {
      content.style.removeProperty("display");
      content.style.removeProperty("opacity");
    }
    return true;
  }

  private renderPlaintext(container: HTMLElement): boolean {
    // Remove concealment classes and make content visible
    container.classList.remove(
      "camo-trigger-click",
      "camo-trigger-hover",
      "camo-trigger-timer"
    );
    const content = container.querySelector(
      ".camo-content"
    ) as HTMLElement | null;
    if (content) {
      content.style.display = "block";
      content.style.opacity = "1";
    }
    return true;
  }
}

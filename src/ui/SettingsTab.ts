import { App, PluginSettingTab, Setting } from "obsidian";
import type CamoPlugin from "../main";

export class CamoSettingTab extends PluginSettingTab {
  plugin: CamoPlugin;

  constructor(app: App, plugin: CamoPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "CAMO Settings" });

    new Setting(containerEl)
      .setName("Default preset")
      .setDesc("Default preset for new CAMO blocks")
      .addDropdown((dropdown) =>
        dropdown
          .addOptions({
            blackout: "Blackout",
            blueprint: "Blueprint",
            modern95: "Modern95",
            ghost: "Ghost",
            matrix: "Matrix",
            classified: "Classified",
          })
          .setValue(this.plugin.settings.defaultPreset)
          .onChange(async (value) => {
            this.plugin.settings.defaultPreset = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Reveal on hover")
      .setDesc("Automatically reveal content on mouse hover")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.revealOnHover)
          .onChange(async (value) => {
            this.plugin.settings.revealOnHover = value;
            await this.plugin.saveSettings();
            this.plugin.applyGlobalSettingsToDocument();
          })
      );

    new Setting(containerEl)
      .setName("Enable animations")
      .setDesc("Enable visual animations and effects")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.enableAnimations)
          .onChange(async (value) => {
            this.plugin.settings.enableAnimations = value;
            await this.plugin.saveSettings();
            this.plugin.applyGlobalSettingsToDocument();
          })
      );

    new Setting(containerEl)
      .setName("Print policy")
      .setDesc("Choose how CAMO renders on print/PDF export")
      .addDropdown((d) =>
        d
          .addOptions({ reveal: "Reveal", mask: "Mask" })
          .setValue((this.plugin.settings as any).printPolicy || "reveal")
          .onChange(async (value) => {
            (this.plugin.settings as any).printPolicy = value as
              | "reveal"
              | "mask";
            await this.plugin.saveSettings();
            this.plugin.refreshPrintStyles();
          })
      );

    new Setting(containerEl)
      .setName("Show metrics panel")
      .setDesc(
        "Display rolling IR/Effect metrics under CAMO blocks in debug mode"
      )
      .addToggle((toggle) =>
        toggle
          .setValue((this.plugin.settings as any).showMetricsPanel === true)
          .onChange(async (value) => {
            (this.plugin.settings as any).showMetricsPanel = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Performance mode")
      .setDesc("Reduce visual effects for better performance")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.performanceMode)
          .onChange(async (value) => {
            this.plugin.settings.performanceMode = value;
            await this.plugin.saveSettings();
            this.plugin.applyGlobalSettingsToDocument();
          })
      );

    new Setting(containerEl)
      .setName("Mobile optimizations")
      .setDesc("Optimize for touch and battery by reducing heavy effects")
      .addToggle((toggle) =>
        toggle
          .setValue((this.plugin.settings as any).mobileOptimizations === true)
          .onChange(async (value) => {
            (this.plugin.settings as any).mobileOptimizations = value;
            await this.plugin.saveSettings();
            this.plugin.applyGlobalSettingsToDocument();
          })
      );

    new Setting(containerEl)
      .setName("Compatibility mode")
      .setDesc("Use conservative styles to avoid conflicts with other plugins")
      .addToggle((toggle) =>
        toggle
          .setValue((this.plugin.settings as any).compatibilityMode === true)
          .onChange(async (value) => {
            (this.plugin.settings as any).compatibilityMode = value;
            await this.plugin.saveSettings();
            this.plugin.applyGlobalSettingsToDocument();
          })
      );

    containerEl.createEl("h3", { text: "Sync & Security (stubs)" });
    new Setting(containerEl)
      .setName("Enable settings sync (stub)")
      .setDesc("Placeholder for future sync")
      .addToggle((t) =>
        t.setValue(false).onChange(async () => {
          // no-op
        })
      );
    new Setting(containerEl)
      .setName("Enable security layer (stub)")
      .setDesc("Placeholder for future encryption/policy")
      .addToggle((t) =>
        t.setValue(false).onChange(async () => {
          // no-op
        })
      );

    containerEl.createEl("h3", { text: "Custom presets" });
    const presets = this.plugin.getCustomPresets();
    const list = containerEl.createEl("div", { cls: "camo-presets-list" });
    const keys = Object.keys(presets);
    if (keys.length === 0) {
      list.createEl("div", { text: "No custom presets yet." });
    } else {
      keys.forEach((id) => {
        const row = list.createEl("div", { cls: "camo-preset-row" });
        row.createEl("span", { text: id });
        new Setting(row).addButton((b) =>
          b.setButtonText("Delete").onClick(async () => {
            await this.plugin.deleteCustomPreset(id);
            this.display();
          })
        );
      });
    }

    new Setting(containerEl)
      .setName("Debug mode")
      .setDesc("Show error messages in blocks")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.debugMode)
          .onChange(async (value) => {
            this.plugin.settings.debugMode = value;
            await this.plugin.saveSettings();
          })
      );

    containerEl.createEl("h3", { text: "Preset gallery (built-in)" });
    const gallery = containerEl.createDiv({ cls: "camo-preset-gallery" });
    this.plugin.getBuiltInPresetIds().forEach((id: string) => {
      const card = gallery.createDiv({ cls: "camo-preset-card" });
      card.createEl("div", { text: id, cls: "camo-preset-name" });
      const preview = card.createDiv({ cls: "camo-preset-preview" });
      const container = preview.createDiv({
        cls: `camo-block camo-preset-${id}`,
      });
      const content = container.createDiv({ cls: "camo-content" });
      content.setText("Sample content line 1\nSample content line 2");

      // Apply preset preview
      const defaults = `:: set[blur] // content[all] % {intensity}(40) -> {visual[blurred]}`;
      this.plugin.previewApplyMetadata(defaults);
    });
  }
}

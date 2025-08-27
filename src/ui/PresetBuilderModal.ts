import { App, Modal, Notice, Setting } from "obsidian";

export interface PresetDraft {
  id: string;
  styles: { background?: string; color?: string };
  effects: { blur?: number };
}

export class CamoPresetBuilderModal extends Modal {
  private preset: PresetDraft = { id: "my-preset", styles: {}, effects: {} };
  private save: (preset: PresetDraft) => Promise<void>;

  constructor(app: App, savePreset: (preset: PresetDraft) => Promise<void>) {
    super(app);
    this.save = savePreset;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "CAMO Preset Builder" });

    new Setting(contentEl)
      .setName("Preset ID")
      .setDesc("Lowercase, hyphenated id")
      .addText((t) =>
        t
          .setPlaceholder("my-preset")
          .setValue(this.preset.id)
          .onChange((v) => {
            this.preset.id = v.trim();
            this.renderPreview(preview);
          })
      );

    new Setting(contentEl).setName("Background color").addText((t) =>
      t
        .setPlaceholder("#000000")
        .setValue(this.preset.styles.background || "")
        .onChange((v) => {
          this.preset.styles.background = v.trim();
          this.renderPreview(preview);
        })
    );

    new Setting(contentEl).setName("Text color").addText((t) =>
      t
        .setPlaceholder("#ffffff")
        .setValue(this.preset.styles.color || "")
        .onChange((v) => {
          this.preset.styles.color = v.trim();
          this.renderPreview(preview);
        })
    );

    new Setting(contentEl)
      .setName("Blur amount")
      .setDesc("0-10")
      .addSlider((s) =>
        s
          .setLimits(0, 10, 1)
          .setValue(this.preset.effects.blur ?? 0)
          .onChange((val) => {
            this.preset.effects.blur = val;
            this.renderPreview(preview);
          })
      );

    // Remove unused previewTitle variable
    contentEl.createEl("h3", { text: "Preview" });
    const preview = contentEl.createDiv({ cls: "camo-preset-preview" });
    this.renderPreview(preview);

    const controls = new Setting(contentEl);
    controls.addButton((b) =>
      b
        .setButtonText("Save Preset")
        .setCta()
        .onClick(async () => {
          await this.save(this.preset);
          this.close();
        })
    );
    controls.addButton((b) =>
      b.setButtonText("Export JSON").onClick(async () => {
        try {
          const blob = new Blob([JSON.stringify(this.preset, null, 2)], {
            type: "application/json",
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${this.preset.id || "preset"}.json`;
          a.click();
          URL.revokeObjectURL(url);
        } catch (e) {
          new Notice("Failed to export preset");
        }
      })
    );
    controls.addButton((b) =>
      b.setButtonText("Import JSON").onClick(async () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "application/json";
        input.onchange = async () => {
          const file = input.files && input.files[0];
          if (!file) return;
          try {
            const text = await file.text();
            const data = JSON.parse(text);
            // Minimal validation
            if (!data || typeof data !== "object" || !data.id) {
              new Notice("Invalid preset file");
              return;
            }
            this.preset = {
              id: String(data.id),
              styles: data.styles || {},
              effects: data.effects || {},
            };
            this.onOpen();
          } catch (e) {
            new Notice("Failed to import preset");
          }
        };
        input.click();
      })
    );
  }

  private renderPreview(el: HTMLElement) {
    el.empty();
    const block = el.createDiv({ cls: "camo-block camo-content" });
    block.setText("Preview content");
    if (this.preset.styles.background)
      block.style.background = this.preset.styles.background;
    if (this.preset.styles.color) block.style.color = this.preset.styles.color;
    if (typeof this.preset.effects.blur === "number")
      block.style.filter = `blur(${this.preset.effects.blur}px)`;
  }
}

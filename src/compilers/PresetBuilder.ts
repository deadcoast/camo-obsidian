import { App, Modal, Notice, Plugin, Setting } from 'obsidian';

interface CamoPreset {
  id: string;
  styles: {
    background?: string;
    color?: string;
  };
  effects: {
    blur?: number;
  };
}

export class CamoPresetBuilderModal extends Modal {
  private plugin: Plugin;
  private preset: CamoPreset;

  constructor(app: App, plugin: Plugin) {
    super(app);
    this.plugin = plugin;
    this.preset = this.createEmptyPreset();
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl('h2', { text: 'CAMO Preset Builder' });

    // Name input
    new Setting(contentEl)
      .setName('Preset name')
      .setDesc('Unique identifier for your preset')
      .addText(text =>
        text.setPlaceholder('my-preset').onChange(value => {
          this.preset.id = value;
        })
      );

    // Visual settings
    contentEl.createEl('h3', { text: 'Visual Settings' });

    new Setting(contentEl).setName('Background color').addText(text =>
      text.setPlaceholder('#000000').onChange(value => {
        this.preset.styles.background = value;
      })
    );

    new Setting(contentEl).setName('Text color').addText(text =>
      text.setPlaceholder('#ffffff').onChange(value => {
        this.preset.styles.color = value;
      })
    );

    // Effect settings
    contentEl.createEl('h3', { text: 'Effects' });

    new Setting(contentEl)
      .setName('Blur amount')
      .setDesc('0 = no blur, 10 = maximum blur')
      .addSlider(slider =>
        slider
          .setLimits(0, 10, 1)
          .setValue(0)
          .onChange(value => {
            this.preset.effects.blur = value;
          })
      );

    // Preview area
    contentEl.createEl('h3', { text: 'Preview' });
    const previewEl = contentEl.createDiv('camo-preset-preview');
    this.updatePreview(previewEl);

    // Save button
    new Setting(contentEl).addButton(btn =>
      btn
        .setButtonText('Save Preset')
        .setCta()
        .onClick(() => {
          this.savePreset();
          this.close();
        })
    );
  }

  private updatePreview(el: HTMLElement) {
    // Apply preset styles to preview
    el.empty();
    const block = el.createDiv('camo-block');
    // @ts-ignore Obsidian extends HTMLElement with setText
    (block as unknown as { setText?: (t: string) => void }).setText?.('Preview content');
    block.style.background = this.preset.styles.background || '#000000';
    block.style.color = this.preset.styles.color || '#ffffff';
    block.style.filter = `blur(${Number(this.preset.effects.blur || 0)}px)`;
    block.style.padding = '1em';
    block.style.borderRadius = '4px';
  }

  private async savePreset() {
    // Save to plugin data
    type DataShape = { customPresets?: Record<string, CamoPreset> };
    const loaded =
      (await (this.plugin as Plugin & { loadData: () => Promise<DataShape> }).loadData()) || {};
    const customPresets: Record<string, CamoPreset> = loaded.customPresets || {};
    customPresets[this.preset.id] = this.preset;
    await (this.plugin as Plugin & { saveData: (d: DataShape) => Promise<void> }).saveData({
      ...loaded,
      customPresets,
    });

    new Notice(`Preset "${this.preset.id}" saved!`);
  }

  private createEmptyPreset(): CamoPreset {
    return {
      id: '',
      styles: { background: '#000000', color: '#ffffff' },
      effects: { blur: 0 },
    };
  }
}

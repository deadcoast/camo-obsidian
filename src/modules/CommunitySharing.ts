/**
 * CAMO Community Sharing System
 *
 * Provides comprehensive preset marketplace functionality:
 * - GitHub-based preset sharing and discovery
 * - Community rating and voting system
 * - Secure preset validation and installation
 * - Obsidian-compliant UI using modals and commands
 */

import {
  App,
  FuzzySuggestModal,
  Modal,
  Notice,
  requestUrl,
  Setting,
  TFile,
} from "obsidian";
import type { CamoPreset } from "../processors/PresetProcessor";

export interface CommunityPreset extends CamoPreset {
  // Community-specific metadata
  community: {
    author: string;
    description: string;
    version: string;
    license: string;
    url: string;
    gistId: string;
    downloadCount: number;
    rating: number;
    ratingCount: number;
    tags: string[];
    category: "privacy" | "aesthetic" | "functional";
    created: string;
    updated: string;
    verified: boolean;
  };
}

export interface MarketplaceSettings {
  enableCommunityPresets: boolean;
  githubToken?: string;
  autoUpdate: boolean;
  enableBetaPresets: boolean;
  trustedAuthors: string[];
}

export interface PresetSearchResult {
  presets: CommunityPreset[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface PresetRating {
  presetId: string;
  rating: number;
  comment?: string;
  timestamp: string;
}

/**
 * Main Community Sharing Manager
 */
export class CommunitySharing {
  private app: App;
  private settings: MarketplaceSettings;
  private presetCache: Map<string, CommunityPreset> = new Map();
  private ratingsCache: Map<string, PresetRating[]> = new Map();

  constructor(app: App, settings: MarketplaceSettings) {
    this.app = app;
    this.settings = settings;
  }

  /**
   * Browse community presets with filtering and pagination
   */
  async browse(
    category?: string,
    tags?: string[],
    page: number = 1,
    pageSize: number = 20
  ): Promise<PresetSearchResult> {
    try {
      // For v1, we'll use GitHub API to search for CAMO preset gists
      // In future versions, this could be a dedicated marketplace API
      const searchQuery = this.buildGitHubSearchQuery(category, tags);

      const response = await requestUrl({
        url: `https://api.github.com/search/repositories?q=${searchQuery}&page=${page}&per_page=${pageSize}`,
        method: "GET",
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "CAMO-Obsidian-Plugin",
        },
      });

      if (response.status !== 200) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = response.json;
      const presets = await this.processGitHubResults(data.items);

      return {
        presets,
        totalCount: data.total_count,
        page,
        pageSize,
      };
    } catch (error) {
      console.error("CAMO Community: Failed to browse presets:", error);
      new Notice("Failed to load community presets. Check your connection.");
      return {
        presets: [],
        totalCount: 0,
        page,
        pageSize,
      };
    }
  }

  /**
   * Search for specific presets
   */
  async search(
    query: string,
    filters?: {
      category?: string;
      author?: string;
      minRating?: number;
    }
  ): Promise<CommunityPreset[]> {
    try {
      let searchQuery = `camo preset ${query}`;

      if (filters?.category) {
        searchQuery += ` ${filters.category}`;
      }

      if (filters?.author) {
        searchQuery += ` user:${filters.author}`;
      }

      const response = await requestUrl({
        url: `https://api.github.com/search/repositories?q=${encodeURIComponent(
          searchQuery
        )}`,
        method: "GET",
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "CAMO-Obsidian-Plugin",
        },
      });

      const data = response.json;
      let presets = await this.processGitHubResults(data.items);

      // Apply rating filter
      if (filters?.minRating) {
        presets = presets.filter(
          (p) => p.community.rating >= filters.minRating!
        );
      }

      return presets;
    } catch (error) {
      console.error("CAMO Community: Search failed:", error);
      new Notice("Search failed. Please try again.");
      return [];
    }
  }

  /**
   * Install a community preset
   */
  async installPreset(preset: CommunityPreset): Promise<boolean> {
    try {
      // Validate preset before installation
      if (!this.validatePreset(preset)) {
        new Notice("Invalid preset format. Installation cancelled.");
        return false;
      }

      // Check for conflicts with existing presets
      if (this.presetCache.has(preset.id)) {
        const shouldOverwrite = await this.confirmOverwrite(preset);
        if (!shouldOverwrite) {
          return false;
        }
      }

      // Save preset to vault
      await this.savePresetToVault(preset);

      // Update cache
      this.presetCache.set(preset.id, preset);

      // Update download count (best effort)
      await this.updateDownloadCount(preset.community.gistId);

      new Notice(`Preset "${preset.name}" installed successfully!`);
      return true;
    } catch (error) {
      console.error("CAMO Community: Installation failed:", error);
      new Notice("Failed to install preset. Please try again.");
      return false;
    }
  }

  /**
   * Share a preset to the community
   */
  async sharePreset(preset: CamoPreset): Promise<string | null> {
    if (!this.settings.githubToken) {
      new Notice(
        "GitHub token required for sharing. Please configure in settings."
      );
      return null;
    }

    try {
      const shareModal = new PresetShareModal(
        this.app,
        preset,
        async (metadata) => {
          const communityPreset: CommunityPreset = {
            id: preset.id,
            name: preset.name,
            cssClass: preset.cssClass,
            category: preset.category,
            description: preset.description,
            baseStyle: preset.baseStyle,
            defaultMetadata: preset.defaultMetadata,
            styles: preset.styles,
            flags: preset.flags,
            animations: preset.animations,
            community: {
              author: metadata.author,
              description: metadata.description,
              version: metadata.version,
              license: metadata.license,
              url: "",
              gistId: "",
              downloadCount: 0,
              rating: 0,
              ratingCount: 0,
              tags: metadata.tags,
              category: metadata.category,
              created: new Date().toISOString(),
              updated: new Date().toISOString(),
              verified: false,
            },
          };

          const gistUrl = await this.createGist(communityPreset);
          if (gistUrl) {
            new Notice(`Preset shared successfully! URL: ${gistUrl}`);
            return gistUrl;
          }
          return null;
        }
      );

      shareModal.open();
      return null; // URL will be returned via modal callback
    } catch (error) {
      console.error("CAMO Community: Sharing failed:", error);
      new Notice("Failed to share preset. Please try again.");
      return null;
    }
  }

  /**
   * Rate a community preset
   */
  async ratePreset(
    presetId: string,
    rating: number,
    comment?: string
  ): Promise<boolean> {
    try {
      const userRating: PresetRating = {
        presetId,
        rating,
        comment,
        timestamp: new Date().toISOString(),
      };

      // For v1, store ratings locally
      // In future versions, this could sync to a central rating service
      const ratings = this.ratingsCache.get(presetId) || [];

      // Remove existing rating from this user (if any)
      const filteredRatings = ratings.filter(
        (r) => r.timestamp !== userRating.timestamp
      );
      filteredRatings.push(userRating);

      this.ratingsCache.set(presetId, filteredRatings);

      // Update preset rating average
      const preset = this.presetCache.get(presetId);
      if (preset) {
        const avgRating =
          filteredRatings.reduce((sum, r) => sum + r.rating, 0) /
          filteredRatings.length;
        preset.community.rating = Math.round(avgRating * 10) / 10;
        preset.community.ratingCount = filteredRatings.length;
      }

      new Notice("Rating submitted successfully!");
      return true;
    } catch (error) {
      console.error("CAMO Community: Rating failed:", error);
      new Notice("Failed to submit rating.");
      return false;
    }
  }

  /**
   * Get installed community presets
   */
  getInstalledPresets(): CommunityPreset[] {
    return Array.from(this.presetCache.values());
  }

  /**
   * Update settings
   */
  updateSettings(settings: MarketplaceSettings): void {
    this.settings = settings;
  }

  // Private helper methods continue in next part...

  private buildGitHubSearchQuery(category?: string, tags?: string[]): string {
    let query = "camo preset";

    if (category) {
      query += ` ${category}`;
    }

    if (tags && tags.length > 0) {
      query += ` ${tags.join(" ")}`;
    }

    query += " in:name,description,readme";
    return encodeURIComponent(query);
  }

  private async processGitHubResults(items: any[]): Promise<CommunityPreset[]> {
    const presets: CommunityPreset[] = [];

    for (const item of items) {
      try {
        // Attempt to fetch preset data from repository
        const preset = await this.fetchPresetFromRepo(item);
        if (preset) {
          presets.push(preset);
        }
      } catch (error) {
        console.warn(`Failed to process repository ${item.name}:`, error);
      }
    }

    return presets;
  }

  private async fetchPresetFromRepo(
    repo: any
  ): Promise<CommunityPreset | null> {
    try {
      // Look for preset.json or similar files in the repository
      const response = await requestUrl({
        url: `https://api.github.com/repos/${repo.full_name}/contents`,
        method: "GET",
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "CAMO-Obsidian-Plugin",
        },
      });

      const files = response.json;
      const presetFile = files.find(
        (file: any) =>
          file.name.toLowerCase().includes("preset") &&
          file.name.endsWith(".json")
      );

      if (!presetFile) {
        return null;
      }

      // Fetch the preset file content
      const contentResponse = await requestUrl({
        url: presetFile.download_url,
        method: "GET",
      });

      const presetData = JSON.parse(contentResponse.text);

      // Convert to CommunityPreset format
      return this.convertToCommunityPreset(presetData, repo);
    } catch (error) {
      console.warn("Failed to fetch preset from repository:", error);
      return null;
    }
  }

  private convertToCommunityPreset(data: any, repo: any): CommunityPreset {
    return {
      id: data.id || repo.name,
      name: data.name || repo.name,
      cssClass: data.cssClass || `camo-${repo.name}`,
      category: data.category || "functional",
      description: data.description || repo.description || "",
      baseStyle: data.baseStyle || { background: "#000", color: "#fff" },
      defaultMetadata: data.defaultMetadata || [],
      styles: data.styles || "",
      flags: data.flags || [],
      animations: data.animations,
      community: {
        author: repo.owner.login,
        description: data.description || repo.description || "",
        version: data.version || "1.0.0",
        license: data.license || repo.license?.name || "MIT",
        url: repo.html_url,
        gistId: repo.id.toString(),
        downloadCount: repo.stargazers_count || 0,
        rating: 0,
        ratingCount: 0,
        tags: data.tags || [],
        category: data.category || "functional",
        created: repo.created_at,
        updated: repo.updated_at,
        verified: repo.owner.type === "Organization", // Simple verification logic
      },
    };
  }

  private validatePreset(preset: CommunityPreset): boolean {
    // Comprehensive validation
    if (!preset.id || !preset.name || !preset.cssClass) {
      return false;
    }

    if (!preset.community?.author || !preset.community?.version) {
      return false;
    }

    // Security check: ensure preset doesn't contain malicious content
    if (this.containsSuspiciousContent(preset)) {
      return false;
    }

    return true;
  }

  private containsSuspiciousContent(preset: CommunityPreset): boolean {
    const suspiciousPatterns = [
      /script\s*>/i,
      /javascript:/i,
      /eval\s*\(/i,
      /setTimeout\s*\(/i,
      /setInterval\s*\(/i,
      /document\./i,
      /window\./i,
    ];

    const contentToCheck = [
      preset.defaultMetadata.join(" "),
      preset.community.description,
      JSON.stringify(preset),
    ].join(" ");

    return suspiciousPatterns.some((pattern) => pattern.test(contentToCheck));
  }

  private async confirmOverwrite(preset: CommunityPreset): Promise<boolean> {
    return new Promise((resolve) => {
      const modal = new ConfirmOverwriteModal(this.app, preset, resolve);
      modal.open();
    });
  }

  private async savePresetToVault(preset: CommunityPreset): Promise<void> {
    const presetsFolder = ".obsidian/plugins/camo/community-presets";
    const fileName = `${preset.id}.json`;
    const filePath = `${presetsFolder}/${fileName}`;

    // Ensure directory exists
    const folder = this.app.vault.getAbstractFileByPath(presetsFolder);
    if (!folder) {
      await this.app.vault.createFolder(presetsFolder);
    }

    // Save preset
    const presetJson = JSON.stringify(preset, null, 2);
    const existingFile = this.app.vault.getAbstractFileByPath(filePath);

    if (existingFile instanceof TFile) {
      await this.app.vault.modify(existingFile, presetJson);
    } else {
      await this.app.vault.create(filePath, presetJson);
    }
  }

  private async createGist(preset: CommunityPreset): Promise<string | null> {
    try {
      const gistContent = {
        description: `CAMO Preset: ${preset.name}`,
        public: true,
        files: {
          [`${preset.id}.json`]: {
            content: JSON.stringify(preset, null, 2),
          },
          "README.md": {
            content: this.generatePresetReadme(preset),
          },
        },
      };

      const response = await requestUrl({
        url: "https://api.github.com/gists",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `token ${this.settings.githubToken}`,
          "User-Agent": "CAMO-Obsidian-Plugin",
        },
        body: JSON.stringify(gistContent),
      });

      if (response.status === 201) {
        const gist = response.json;
        preset.community.url = gist.html_url;
        preset.community.gistId = gist.id;
        return gist.html_url;
      }

      throw new Error(`Gist creation failed: ${response.status}`);
    } catch (error) {
      console.error("Failed to create gist:", error);
      return null;
    }
  }

  private generatePresetReadme(preset: CommunityPreset): string {
    return `# ${preset.name}

${preset.community.description}

## Usage

\`\`\`
${preset.cssClass}
Your content here
\`\`\`

## Metadata

${
  preset.defaultMetadata.length > 0
    ? preset.defaultMetadata.join(", ")
    : "No metadata provided"
}

## Details

- **Author**: ${preset.community.author}
- **Version**: ${preset.community.version}
- **License**: ${preset.community.license}
- **Category**: ${preset.community.category}
- **Tags**: ${preset.community.tags.join(", ")}

## Installation

1. Open CAMO settings in Obsidian
2. Go to Community Presets
3. Search for "${preset.name}" or use this URL: ${preset.community.url}
4. Click Install

---

Generated by CAMO Community Sharing System
`;
  }

  private async updateDownloadCount(gistId: string): Promise<void> {
    // Best effort to track downloads
    // In a real implementation, this would update a central counter
    try {
      console.log(`Preset ${gistId} downloaded`);
    } catch (error) {
      // Silent fail - this is not critical
    }
  }
}

/**
 * Modal for sharing presets
 */
class PresetShareModal extends Modal {
  private preset: CamoPreset;
  private onSubmit: (metadata: {
    author: string;
    description: string;
    version: string;
    license: string;
    tags: string[];
    category: "privacy" | "aesthetic" | "functional";
  }) => Promise<string | null>;

  private author = "";
  private description = "";
  private version = "1.0.0";
  private license = "MIT";
  private tags = "";
  private category: "privacy" | "aesthetic" | "functional" = "functional";

  constructor(
    app: App,
    preset: CamoPreset,
    onSubmit: (metadata: any) => Promise<string | null>
  ) {
    super(app);
    this.preset = preset;
    this.onSubmit = onSubmit;
    this.setTitle(`Share Preset: ${preset.name}`);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    new Setting(contentEl)
      .setName("Author")
      .setDesc("Your name or GitHub username")
      .addText((text) => {
        text.onChange((value) => {
          this.author = value;
        });
      });

    new Setting(contentEl)
      .setName("Description")
      .setDesc("Brief description of what this preset does")
      .addTextArea((text) => {
        text.onChange((value) => {
          this.description = value;
        });
      });

    new Setting(contentEl)
      .setName("Version")
      .setDesc("Semantic version (e.g., 1.0.0)")
      .addText((text) => {
        text.setValue(this.version);
        text.onChange((value) => {
          this.version = value;
        });
      });

    new Setting(contentEl)
      .setName("License")
      .setDesc("License for your preset")
      .addDropdown((dropdown) => {
        dropdown
          .addOption("MIT", "MIT")
          .addOption("Apache-2.0", "Apache 2.0")
          .addOption("GPL-3.0", "GPL 3.0")
          .addOption("CC0-1.0", "CC0 1.0")
          .setValue(this.license)
          .onChange((value) => {
            this.license = value;
          });
      });

    new Setting(contentEl)
      .setName("Category")
      .setDesc("Primary category for this preset")
      .addDropdown((dropdown) => {
        dropdown
          .addOption("privacy", "Privacy")
          .addOption("aesthetic", "Aesthetic")
          .addOption("functional", "Functional")
          .setValue(this.category)
          .onChange((value: "privacy" | "aesthetic" | "functional") => {
            this.category = value;
          });
      });

    new Setting(contentEl)
      .setName("Tags")
      .setDesc("Comma-separated tags (e.g., blur, dark-mode, minimal)")
      .addText((text) => {
        text.onChange((value) => {
          this.tags = value;
        });
      });

    new Setting(contentEl).addButton((btn) =>
      btn
        .setButtonText("Share Preset")
        .setCta()
        .onClick(async () => {
          if (!this.author || !this.description) {
            new Notice("Author and description are required.");
            return;
          }

          const metadata = {
            author: this.author,
            description: this.description,
            version: this.version,
            license: this.license,
            tags: this.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
            category: this.category,
          };

          this.close();
          await this.onSubmit(metadata);
        })
    );

    new Setting(contentEl).addButton((btn) =>
      btn.setButtonText("Cancel").onClick(() => {
        this.close();
      })
    );
  }
}

/**
 * Modal for confirming preset overwrite
 */
class ConfirmOverwriteModal extends Modal {
  private preset: CommunityPreset;
  private onConfirm: (confirmed: boolean) => void;

  constructor(
    app: App,
    preset: CommunityPreset,
    onConfirm: (confirmed: boolean) => void
  ) {
    super(app);
    this.preset = preset;
    this.onConfirm = onConfirm;
    this.setTitle("Preset Already Exists");
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl("p", {
      text: `A preset named "${this.preset.name}" already exists. Do you want to overwrite it?`,
    });

    const buttonContainer = contentEl.createDiv({
      cls: "modal-button-container",
    });

    new Setting(buttonContainer)
      .addButton((btn) =>
        btn
          .setButtonText("Overwrite")
          .setWarning()
          .onClick(() => {
            this.close();
            this.onConfirm(true);
          })
      )
      .addButton((btn) =>
        btn.setButtonText("Cancel").onClick(() => {
          this.close();
          this.onConfirm(false);
        })
      );
  }
}

/**
 * Suggest modal for browsing community presets
 */
export class CommunityPresetBrowserModal extends FuzzySuggestModal<CommunityPreset> {
  private communitySharing: CommunitySharing;
  private presets: CommunityPreset[] = [];
  private onInstall: (preset: CommunityPreset) => void;

  constructor(
    app: App,
    communitySharing: CommunitySharing,
    onInstall: (preset: CommunityPreset) => void
  ) {
    super(app);
    this.communitySharing = communitySharing;
    this.onInstall = onInstall;
    this.setPlaceholder("Search community presets...");
    this.loadPresets();
  }

  private async loadPresets() {
    try {
      const result = await this.communitySharing.browse();
      this.presets = result.presets;
    } catch (error) {
      console.error("Failed to load presets:", error);
      new Notice("Failed to load community presets.");
    }
  }

  getItems(): CommunityPreset[] {
    return this.presets;
  }

  getItemText(preset: CommunityPreset): string {
    return `${preset.name} by ${preset.community.author} - ${preset.community.description}`;
  }

  renderSuggestion(match: { item: CommunityPreset }, el: HTMLElement) {
    const preset = match.item;
    el.addClass("camo-preset-suggestion");

    const titleEl = el.createDiv({ cls: "camo-preset-title" });
    titleEl.createSpan({ text: preset.name, cls: "camo-preset-name" });
    titleEl.createSpan({
      text: `by ${preset.community.author}`,
      cls: "camo-preset-author",
    });

    const descEl = el.createDiv({ cls: "camo-preset-description" });
    descEl.textContent = preset.community.description;

    const metaEl = el.createDiv({ cls: "camo-preset-meta" });
    metaEl.createSpan({
      text: `★ ${preset.community.rating}`,
      cls: "camo-preset-rating",
    });
    metaEl.createSpan({
      text: `${preset.community.downloadCount} downloads`,
      cls: "camo-preset-downloads",
    });
    metaEl.createSpan({
      text: preset.community.category,
      cls: "camo-preset-category",
    });
  }

  onChooseItem(preset: CommunityPreset, evt: MouseEvent | KeyboardEvent) {
    this.onInstall(preset);
  }
}

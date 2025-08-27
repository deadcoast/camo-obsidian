import { Notice } from "obsidian";

export class CamoAccessibility {
  constructor() {}

  // Reading mode compatibility: ensure content is present and aria-labelled
  ensureReadingModeCompatibility(container: HTMLElement): void {
    container.setAttribute("role", "region");
    container.setAttribute("aria-label", "CAMO content");
  }

  // Screen reader announcement using Obsidian notices (fallback)
  announceBlockState(block: HTMLElement, message: string): void {
    const label =
      message ||
      (block.classList.contains("camo-revealed") ? "Revealed" : "Hidden");
    new Notice(`CAMO: ${label}`);
  }

  makeBlockAccessible(container: HTMLElement, contentEl: HTMLElement): void {
    if (!container.hasAttribute("tabindex"))
      container.setAttribute("tabindex", "0");
    const contentId =
      contentEl.getAttribute("id") ||
      this.ensureContentId(container, contentEl);
    container.setAttribute("aria-controls", contentId);
    contentEl.setAttribute("role", "group");
    const revealed = container.classList.contains("camo-revealed");
    this.applyAriaState(container, contentEl, revealed);
    container.addEventListener("keydown", (e: KeyboardEvent) => {
      const isToggleKey = e.key === " " || e.key === "Enter";
      if (!isToggleKey) return;
      if (container.classList.contains("camo-trigger-click")) {
        e.preventDefault();
        container.classList.toggle("camo-revealed");
        const isOpen = container.classList.contains("camo-revealed");
        this.applyAriaState(container, contentEl, isOpen);
        this.announceBlockState(container, isOpen ? "Revealed" : "Hidden");
      }
    });
  }

  applyAriaState(
    container: HTMLElement,
    contentEl: HTMLElement,
    revealed: boolean
  ): void {
    container.setAttribute("aria-expanded", revealed ? "true" : "false");
    contentEl.setAttribute("aria-hidden", revealed ? "false" : "true");
  }

  private ensureContentId(
    container: HTMLElement,
    contentEl: HTMLElement
  ): string {
    const bid = container.getAttribute("data-camo-id") || `camo-${Date.now()}`;
    const cid = `camo-content-${bid}`;
    contentEl.setAttribute("id", cid);
    return cid;
  }
}

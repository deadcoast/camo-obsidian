import { Plugin } from 'obsidian';
import { BaseEffectHandler, EffectContext, EffectResult } from './EffectHandler';

export class ProtectEventHandler extends BaseEffectHandler {
  readonly effectType = 'protect';
  private readonly plugin: Plugin;
  private protectedElements: Set<string> = new Set();

  constructor(plugin: Plugin) {
    super();
    this.plugin = plugin;
  }

  async apply(
    context: EffectContext,
    parameters: Record<string, string | number | boolean>
  ): Promise<EffectResult> {
    try {
      const effect = (parameters.effect as string) || 'protect';
      const blockId = context.blockId;

      switch (effect) {
        case 'protect':
          return this.protectElement(context, blockId, parameters);
        case 'lock':
          return this.lockElement(context, blockId, parameters);
        case 'secure':
          return this.secureElement(context, blockId, parameters);
        default:
          return { success: false, error: `Unknown effect: ${effect}` };
      }
    } catch (error) {
      console.error(`ProtectEventHandler error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async remove(context: EffectContext, effectId: string): Promise<boolean> {
    try {
      this.unprotectElement(context.element, context.blockId);
      return true;
    } catch (error) {
      console.error(`ProtectEventHandler remove error:`, error);
      return false;
    }
  }

  isApplied(context: EffectContext): boolean {
    return this.protectedElements.has(context.blockId);
  }

  private protectElement(
    context: EffectContext,
    blockId: string,
    parameters: Record<string, string | number | boolean>
  ): EffectResult {
    const level = (parameters.level as string) || 'medium';
    const duration = (parameters.duration as number) || 0; // 0 = permanent
    const element = context.element;

    // Add protection class
    element.classList.add(`camo-protected-${level}`);
    element.setAttribute('data-camo-protection', level);

    // Disable interactions
    element.style.pointerEvents = 'none';
    element.style.userSelect = 'none';

    // Add visual protection indicator
    element.style.border = '2px dashed #ff6b6b';
    element.style.backgroundColor = 'rgba(255, 107, 107, 0.1)';

    // Store protection state
    this.protectedElements.add(blockId);

    // Set timeout if duration specified
    if (duration > 0) {
      setTimeout(() => {
        this.unprotectElement(element, blockId);
      }, duration);
    }

    return { success: true, effectId: 'protect' };
  }

  private lockElement(
    context: EffectContext,
    blockId: string,
    parameters: Record<string, string | number | boolean>
  ): EffectResult {
    const password = (parameters.password as string) || '';
    const lockType = (parameters.type as string) || 'click';
    const element = context.element;

    // Add lock class
    element.classList.add('camo-locked');
    element.setAttribute('data-camo-lock-type', lockType);

    if (password) {
      element.setAttribute('data-camo-password', btoa(password)); // Simple encoding
    }

    // Add lock visual indicator
    element.style.position = 'relative';
    element.style.cursor = 'not-allowed';

    // Add lock icon overlay
    const lockOverlay = document.createElement('div');
    lockOverlay.className = 'camo-lock-overlay';
    lockOverlay.innerHTML = '🔒';
    lockOverlay.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 24px;
      color: #666;
      pointer-events: none;
      z-index: 1000;
    `;
    element.appendChild(lockOverlay);

    // Add click handler for unlock
    if (lockType === 'click') {
      element.addEventListener('click', e => {
        e.preventDefault();
        this.handleUnlock(element, blockId, password);
      });
    }

    this.protectedElements.add(blockId);
    return { success: true, effectId: 'lock' };
  }

  private secureElement(
    context: EffectContext,
    blockId: string,
    parameters: Record<string, string | number | boolean>
  ): EffectResult {
    const encryption = (parameters.encryption as boolean) || false;
    const obfuscation = (parameters.obfuscation as boolean) || true;
    const element = context.element;

    // Store original content
    const originalContent = element.textContent || '';
    element.setAttribute('data-camo-original', originalContent);

    if (obfuscation) {
      // Simple text obfuscation
      const obfuscatedContent = this.obfuscateText(originalContent);
      element.textContent = obfuscatedContent;
    }

    if (encryption) {
      // Mark for encryption (would integrate with SecurityIntegration)
      element.setAttribute('data-camo-encrypted', 'true');
    }

    // Add security visual indicator
    element.style.border = '2px solid #4ecdc4';
    element.style.backgroundColor = 'rgba(78, 205, 196, 0.1)';

    this.protectedElements.add(blockId);
    return { success: true, effectId: 'secure' };
  }

  private unprotectElement(element: HTMLElement, blockId: string): void {
    element.classList.remove('camo-protected-low', 'camo-protected-medium', 'camo-protected-high');
    element.removeAttribute('data-camo-protection');
    element.style.pointerEvents = '';
    element.style.userSelect = '';
    element.style.border = '';
    element.style.backgroundColor = '';

    this.protectedElements.delete(blockId);
  }

  private handleUnlock(element: HTMLElement, blockId: string, password: string): void {
    if (password) {
      // In a real implementation, this would show a password prompt
      const userPassword = prompt('Enter password to unlock:');
      if (userPassword !== password) {
        alert('Incorrect password');
        return;
      }
    }

    // Remove lock
    element.classList.remove('camo-locked');
    element.removeAttribute('data-camo-lock-type');
    element.removeAttribute('data-camo-password');
    element.style.position = '';
    element.style.cursor = '';

    // Remove lock overlay
    const lockOverlay = element.querySelector('.camo-lock-overlay');
    if (lockOverlay) {
      lockOverlay.remove();
    }

    this.protectedElements.delete(blockId);
  }

  private obfuscateText(text: string): string {
    return text.replace(/[a-zA-Z]/g, char => {
      return String.fromCharCode(char.charCodeAt(0) + 1);
    });
  }

  isProtected(blockId: string): boolean {
    return this.protectedElements.has(blockId);
  }

  getProtectedElements(): string[] {
    return Array.from(this.protectedElements);
  }

  clearAllProtections(): void {
    this.protectedElements.clear();
  }
}

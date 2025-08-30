import { Plugin } from 'obsidian';
import { CamoAST, CamoASTNode } from '../modules/AST';
import { CamoStateManager } from '../modules/StateManager';

interface ExecutionContext {
  blockId: string;
  block: HTMLElement;
  metadata: string[];
}

interface StatementResult {
  skipped: boolean;
  applied: boolean;
  info: string;
}

interface ExecutionResult {
  results: StatementResult[];
}

interface EffectHandler {
  apply: (target: HTMLElement, params: Record<string, unknown>) => Promise<StatementResult>;
}

export class CamoInstructionProcessor {
  private readonly plugin: Plugin;
  private readonly effects = new Map<string, EffectHandler>();
  private readonly state: CamoStateManager;

  constructor(plugin: Plugin) {
    this.plugin = plugin;
    this.state = new CamoStateManager(plugin);
  }

  async execute(ast: CamoAST, context: ExecutionContext): Promise<ExecutionResult> {
    const results: StatementResult[] = [];

    for (const statement of ast.statements) {
      try {
        const result = await this.executeStatement(statement, context);
        results.push(result);

        // Handle hierarchical dependencies
        if (statement.children) {
          for (const child of statement.children) {
            const childResult = await this.executeStatement(child, context);
            results.push(childResult);
          }
        }
      } catch (error) {
        this.handleExecutionError(error, statement, context);
      }
    }

    return { results };
  }

  private handleExecutionError(
    error: unknown,
    statement: CamoASTNode,
    context: ExecutionContext
  ): void {
    console.error(`Error executing statement:`, error);
  }

  private resolveTarget(target: string, context: ExecutionContext): HTMLElement {
    return context.block;
  }

  private prepareParameters(parameters: Record<string, unknown>): Record<string, unknown> {
    return parameters || {};
  }

  private evaluateCondition(condition: string, context: ExecutionContext): boolean {
    // Simple condition evaluation
    return true;
  }

  private async executeStatement(
    statement: CamoASTNode,
    context: ExecutionContext
  ): Promise<StatementResult> {
    // 1. Resolve target content
    const target = this.resolveTarget('', context);

    // 2. Prepare effect parameters
    const params = this.prepareParameters(statement.parameters || {});

    // 3. Check conditions
    if (statement.condition && !this.evaluateCondition(statement.condition, context)) {
      return { skipped: true, applied: false, info: 'Condition not met' };
    }

    // 4. Apply effect
    const effect = this.effects.get('default');
    if (!effect) {
      return {
        skipped: false,
        applied: false,
        info: 'No effect handler found',
      };
    }

    const result = await effect.apply(target, params);

    // 5. Update state (simplified)
    // this.state.update(context.blockId, statement, result);

    return result;
  }
}

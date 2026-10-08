import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

// Globals injected by the Claude Code Workflow runtime into .claude/workflows/*.js
const workflowGlobals = Object.fromEntries(
  ['args', 'agent', 'parallel', 'pipeline', 'phase', 'log', 'budget', 'workflow'].map((n) => [n, 'readonly']),
);

// TypeScript gets type-aware typescript-eslint strict + stylistic (ADR-0003, docs/coding-conventions.md).
// JavaScript (this file and the locked workflow harness files) keeps the earlier non-type-aware tier, so a
// harness update cannot be blocked by rules chosen for our TypeScript.
export default defineConfig(
  globalIgnores(['dist/', 'node_modules/', 'coverage/', 'openspec/', 'scripts/', 'evals/', 'design/']),
  {
    files: ['**/*.ts'],
    extends: [js.configs.recommended, tseslint.configs.strictTypeChecked, tseslint.configs.stylisticTypeChecked],
    languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } },
    rules: {
      // Numbers in template strings are intended: sizes, seeds and cell coordinates.
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
    },
  },
  { files: ['**/*.js'], extends: [js.configs.recommended, tseslint.configs.recommended] },
  { files: ['.claude/workflows/*.js'], languageOptions: { globals: workflowGlobals } },
);

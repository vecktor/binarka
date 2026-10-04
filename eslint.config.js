import js from '@eslint/js';
import tseslint from 'typescript-eslint';

// Globals injected by the Claude Code Workflow runtime into .claude/workflows/*.js
const workflowGlobals = Object.fromEntries(
  ['args', 'agent', 'parallel', 'pipeline', 'phase', 'log', 'budget', 'workflow'].map((n) => [n, 'readonly']),
);

export default tseslint.config(
  { ignores: ['dist/', 'node_modules/', 'coverage/', 'openspec/', 'scripts/', 'evals/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { files: ['.claude/workflows/*.js'], languageOptions: { globals: workflowGlobals } },
);

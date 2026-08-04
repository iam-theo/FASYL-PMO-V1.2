import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['backend/**/*.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: globals.node,
      parserOptions: { ecmaFeatures: { jsx: false } },
    },
    rules: {
      'no-unused-vars': ['error', { ignoreRestSiblings: true }],
    },
  },
  {
    files: ['**/*.{js,jsx}'],
    ignores: ['backend/**'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // React 18/19 without the compiler: these compiler-era rules flag the
      // pre-compiler "latest ref" / "prop sync" patterns the app uses
      // deliberately. Re-enable only if that code is refactored for them.
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/incompatible-library': 'off',
    },
  },
  {
    files: ['src/components/NotificationContext.jsx'],
    rules: {
      'react-refresh/only-export-components': ['error', { allowExportNames: ['useNotification'] }],
    },
  },
  {
    files: ['src/components/projects/tasks/ProjectSubTabs.jsx'],
    rules: {
      'react-refresh/only-export-components': ['error', { allowExportNames: ['PROJECT_WORKSPACE_TABS'] }],
    },
  },
  {
    files: ['src/components/reports/components/ui/FormField.jsx'],
    rules: {
      'react-refresh/only-export-components': ['error', { allowExportNames: ['controlClasses'] }],
    },
  },
  {
    files: ['src/components/reports/components/ui/Toast.jsx'],
    rules: {
      'react-refresh/only-export-components': ['error', { allowExportNames: ['useToast'] }],
    },
  },
])

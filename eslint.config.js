// @ts-check
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintConfigPrettier = require('eslint-config-prettier');

const domainRestrictedImports = {
  paths: [
    {
      name: 'react',
      message: 'Domain layer must not import React.',
    },
    {
      name: 'react-native',
      message: 'Domain layer must not import React Native.',
    },
    {
      name: '@tanstack/react-query',
      message: 'Domain layer must not import react-query.',
    },
    {
      name: 'zustand',
      message: 'Domain layer must not import zustand.',
    },
    {
      name: '@/data/db',
      message: 'Domain layer must not import data/db.',
    },
    {
      name: '@/ui',
      message: 'Domain layer must not import ui.',
    },
    {
      name: '@/features',
      message: 'Domain layer must not import features.',
    },
    {
      name: '@/platform',
      message: 'Domain layer must not import platform.',
    },
  ],
  patterns: [
    {
      group: ['expo', 'expo-*'],
      message: 'Domain layer must not import Expo.',
    },
  ],
};

module.exports = defineConfig([
  ...expoConfig,
  eslintConfigPrettier,
  {
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['src/domain/**/*.ts', 'src/domain/**/*.tsx'],
    rules: {
      'no-restricted-imports': ['error', domainRestrictedImports],
      'no-restricted-globals': ['error', 'parseFloat', 'parseInt'],
      'no-restricted-properties': [
        'error',
        { object: 'Number', property: 'parseFloat', message: 'Use domain/money parse.' },
        { object: 'Number', property: 'parseInt', message: 'Use domain/money parse.' },
      ],
    },
  },
  {
    files: ['src/data/**/*.ts', 'src/data/**/*.tsx'],
    rules: {
      'no-restricted-globals': ['error', 'parseFloat', 'parseInt'],
      'no-restricted-properties': [
        'error',
        { object: 'Number', property: 'parseFloat', message: 'Use domain/money parse.' },
        { object: 'Number', property: 'parseInt', message: 'Use domain/money parse.' },
      ],
    },
  },
  {
    files: ['src/features/**/*.ts', 'src/features/**/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/data/db',
              message: 'Features must use repositories or query hooks, not db directly.',
            },
          ],
          patterns: [
            {
              group: ['@/data/db/**'],
              message: 'Features must not import db directly.',
            },
          ],
        },
      ],
    },
  },
]);

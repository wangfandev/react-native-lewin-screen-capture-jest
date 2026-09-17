/**
 * Copyright (c) 2026 Huawei Technologies Co., Ltd.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const path = require('path');

module.exports = {
  testEnvironment: 'node',
  rootDir: path.resolve(__dirname, '..'),
  transform: {
    '^.+\\.tsx?$': [
      'babel-jest',
      {
        babelrc: false,
        configFile: false,
        presets: [
          ['@babel/preset-env', {targets: {node: 'current'}, modules: 'commonjs'}],
          '@babel/preset-typescript',
        ],
      },
    ],
    '^.+\\.js$': [
      'babel-jest',
      {
        babelrc: false,
        configFile: false,
        presets: [
          ['@babel/preset-env', {targets: {node: 'current'}, modules: 'commonjs'}],
          ['@babel/preset-flow', {all: true}],
        ],
        plugins: ['@babel/plugin-transform-react-jsx'],
      },
    ],
  },
  testMatch: ['<rootDir>/jest/__tests__/*-test.js'],
  testPathIgnorePatterns: ['/node_modules/'],
  setupFiles: ['<rootDir>/jest/jest.setup.js'],
  globals: {
    __DEV__: true,
  },
  transformIgnorePatterns: ['node_modules/(?!react-native|@react-native|react)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/__tests__/**',
    '!src/specs/v2/**',
  ],
  coverageDirectory: '<rootDir>/jest/coverage',
  coverageThreshold: {
    global: {branches: 60},
  },
};

/**
 * Copyright (c) 2026 Huawei Technologies Co., Ltd.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

global.nativeModuleProxy = global.nativeModuleProxy || {};

if (typeof global.nativeFabricUIManager === 'undefined') {
  const cache = {};
  global.nativeFabricUIManager = new Proxy(cache, {
    get: function (target, property) {
      if (!(property in target)) {
        target[property] = jest.fn();
      }
      return target[property];
    },
  });
}

if (typeof global.queueMicrotask === 'undefined') {
  global.queueMicrotask = function (callback) {
    return Promise.resolve().then(callback);
  };
}

jest.mock('react-native', () => {
  const listeners = {};
  const mockDeviceEventEmitter = {
    addListener: jest.fn((event, cb) => {
      if (!listeners[event]) {
        listeners[event] = [];
      }
      listeners[event].push(cb);
      return {
        remove: jest.fn(() => {
          listeners[event] = (listeners[event] || []).filter(fn => fn !== cb);
        }),
      };
    }),
    removeAllListeners: jest.fn(event => {
      if (event) {
        listeners[event] = [];
        return;
      }
      Object.keys(listeners).forEach(key => {
        listeners[key] = [];
      });
    }),
    emit: jest.fn((event, data) => {
      (listeners[event] || []).forEach(cb => cb(data));
    }),
  };

  const mockNativeScreenCapture = {
    startListener: jest.fn(() => Promise.resolve('success')),
    stopListener: jest.fn(() => Promise.resolve('true')),
    screenCapture: jest.fn(() =>
      Promise.resolve({
        code: '200',
        uri: 'file:///data/storage/el2/base/cache/lewin-screen-capture/screen-capture-20260101120000.png',
        base64: 'iVBORw0KGgo=',
      }),
    ),
    clearCache: jest.fn(() => Promise.resolve({code: '200'})),
  };

  global.__RNOH_JS_TEST_MOCKS__ = {
    DeviceEventEmitter: mockDeviceEventEmitter,
    NativeScreenCapture: mockNativeScreenCapture,
  };

  return {
    DeviceEventEmitter: mockDeviceEventEmitter,
    TurboModuleRegistry: {
      get: jest.fn(name => (name === 'ScreenCapture' ? mockNativeScreenCapture : null)),
      getEnforcing: jest.fn(name => {
        if (name === 'ScreenCapture') {
          return mockNativeScreenCapture;
        }
        throw new Error(
          "TurboModuleRegistry.getEnforcing(...): '" +
            name +
            "' could not be found.",
        );
      }),
    },
  };
});

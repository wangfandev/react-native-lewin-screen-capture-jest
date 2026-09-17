/**
 * Copyright (c) 2026 Huawei Technologies Co., Ltd.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import ScreenCaptureUtil from '../../src/index';

function getMocks() {
  return global.__RNOH_JS_TEST_MOCKS__;
}

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
}

describe('ScreenCaptureUtil', () => {
  beforeEach(() => {
    const {NativeScreenCapture, DeviceEventEmitter} = getMocks();
    NativeScreenCapture.startListener.mockReset().mockResolvedValue('success');
    NativeScreenCapture.stopListener.mockReset().mockResolvedValue('true');
    NativeScreenCapture.screenCapture.mockReset().mockResolvedValue({
      code: '200',
      uri: 'file:///data/storage/el2/base/cache/lewin-screen-capture/screen-capture-20260101120000.png',
      base64: 'iVBORw0KGgo=',
    });
    NativeScreenCapture.clearCache.mockReset().mockResolvedValue({code: '200'});
    DeviceEventEmitter.addListener.mockClear();
    DeviceEventEmitter.removeAllListeners.mockClear();
    DeviceEventEmitter.emit.mockClear();
    DeviceEventEmitter.removeAllListeners('ScreenCapture');
  });

  afterEach(() => {
    ScreenCaptureUtil.stopListener();
  });

  it('stopListener forwards to native when no listener was started', async () => {
    const {NativeScreenCapture} = getMocks();

    await expect(ScreenCaptureUtil.stopListener()).resolves.toBe('true');
    expect(NativeScreenCapture.stopListener).toHaveBeenCalledTimes(1);
  });

  describe('startListener', () => {
    it('registers DeviceEventEmitter and calls native startListener with keyWords', () => {
      const {NativeScreenCapture, DeviceEventEmitter} = getMocks();
      const callBack = jest.fn();

      const emitter = ScreenCaptureUtil.startListener(callBack, 'abc,test');

      expect(emitter).toBe(DeviceEventEmitter);
      expect(DeviceEventEmitter.addListener).toHaveBeenCalledWith(
        'ScreenCapture',
        expect.any(Function),
      );
      expect(NativeScreenCapture.startListener).toHaveBeenCalledWith('abc,test');
    });

    it('falls back to empty keyWords when omitted', () => {
      const {NativeScreenCapture} = getMocks();

      ScreenCaptureUtil.startListener(jest.fn());

      expect(NativeScreenCapture.startListener).toHaveBeenCalledWith('');
    });

    it('invokes callBack when ScreenCapture event is emitted', () => {
      const {DeviceEventEmitter} = getMocks();
      const callBack = jest.fn();
      const payload = {code: '200', uri: 'file://shot.png', base64: 'abc'};

      ScreenCaptureUtil.startListener(callBack, '');
      DeviceEventEmitter.emit('ScreenCapture', payload);

      expect(callBack).toHaveBeenCalledWith(payload);
    });

    it('does not throw when callBack is missing and an event arrives', () => {
      const {DeviceEventEmitter} = getMocks();

      expect(() => {
        ScreenCaptureUtil.startListener(undefined, '');
        DeviceEventEmitter.emit('ScreenCapture', {code: '500', uri: '', base64: ''});
      }).not.toThrow();
    });

    it('removes previous ScreenCapture listeners before attaching a new one', () => {
      const {DeviceEventEmitter} = getMocks();

      ScreenCaptureUtil.startListener(jest.fn(), 'first');
      DeviceEventEmitter.removeAllListeners.mockClear();
      ScreenCaptureUtil.startListener(jest.fn(), 'second');

      expect(DeviceEventEmitter.removeAllListeners).toHaveBeenCalledWith(
        'ScreenCapture',
      );
    });
  });

  describe('stopListener', () => {
    it('removes listeners and returns the native Promise', async () => {
      const {NativeScreenCapture, DeviceEventEmitter} = getMocks();
      ScreenCaptureUtil.startListener(jest.fn(), '');

      const result = await ScreenCaptureUtil.stopListener();

      expect(DeviceEventEmitter.removeAllListeners).toHaveBeenCalledWith(
        'ScreenCapture',
      );
      expect(NativeScreenCapture.stopListener).toHaveBeenCalledTimes(1);
      expect(result).toBe('true');
    });

    it('still forwards to native after listeners are already cleared', async () => {
      const {NativeScreenCapture} = getMocks();
      NativeScreenCapture.stopListener.mockClear();

      await expect(ScreenCaptureUtil.stopListener()).resolves.toBe('true');
      expect(NativeScreenCapture.stopListener).toHaveBeenCalledTimes(1);
    });
  });

  describe('clearCache', () => {
    it('forwards native success to callBack', async () => {
      const {NativeScreenCapture} = getMocks();
      const callBack = jest.fn();

      ScreenCaptureUtil.clearCache(callBack);
      await flushPromises();

      expect(NativeScreenCapture.clearCache).toHaveBeenCalledTimes(1);
      expect(callBack).toHaveBeenCalledWith({code: '200'});
    });

    it('forwards native rejection to callBack', async () => {
      const {NativeScreenCapture} = getMocks();
      const fail = {code: '500'};
      NativeScreenCapture.clearCache.mockRejectedValueOnce(fail);
      const callBack = jest.fn();

      ScreenCaptureUtil.clearCache(callBack);
      await flushPromises();

      expect(callBack).toHaveBeenCalledWith(fail);
    });

    it('does not throw when callBack is omitted', async () => {
      expect(() => ScreenCaptureUtil.clearCache()).not.toThrow();
      await flushPromises();
    });
  });

  describe('screenCapture', () => {
    it('defaults isHiddenStatus to true when undefined', async () => {
      const {NativeScreenCapture} = getMocks();
      const callBack = jest.fn();

      ScreenCaptureUtil.screenCapture(callBack, undefined, {
        extension: 'png',
        quality: 100,
        scale: 0,
      });
      await flushPromises();

      expect(NativeScreenCapture.screenCapture).toHaveBeenCalledWith(
        true,
        'png',
        100,
        0,
      );
      expect(callBack).toHaveBeenCalledWith({
        code: '200',
        uri: 'file:///data/storage/el2/base/cache/lewin-screen-capture/screen-capture-20260101120000.png',
        base64: 'iVBORw0KGgo=',
      });
    });

    it('defaults isHiddenStatus to true when null', async () => {
      const {NativeScreenCapture} = getMocks();

      ScreenCaptureUtil.screenCapture(jest.fn(), null, {
        extension: 'jpg',
        quality: 80,
        scale: 0.5,
      });
      await flushPromises();

      expect(NativeScreenCapture.screenCapture).toHaveBeenCalledWith(
        true,
        'jpg',
        80,
        0.5,
      );
    });

    it('keeps an explicit isHiddenStatus value', async () => {
      const {NativeScreenCapture} = getMocks();

      ScreenCaptureUtil.screenCapture(jest.fn(), false, {
        extension: 'png',
        quality: 100,
        scale: 0,
      });
      await flushPromises();

      expect(NativeScreenCapture.screenCapture).toHaveBeenCalledWith(
        false,
        'png',
        100,
        0,
      );
    });

    it('falls back to png/100/0 when option fields are falsy', async () => {
      const {NativeScreenCapture} = getMocks();

      ScreenCaptureUtil.screenCapture(jest.fn(), true, {
        extension: '',
        quality: 0,
        scale: 0,
      });
      await flushPromises();

      expect(NativeScreenCapture.screenCapture).toHaveBeenCalledWith(
        true,
        'png',
        100,
        0,
      );
    });

    it('forwards native rejection to callBack', async () => {
      const {NativeScreenCapture} = getMocks();
      const fail = {code: '500'};
      NativeScreenCapture.screenCapture.mockRejectedValueOnce(fail);
      const callBack = jest.fn();

      ScreenCaptureUtil.screenCapture(callBack, true, {
        extension: 'png',
        quality: 100,
        scale: 0,
      });
      await flushPromises();

      expect(callBack).toHaveBeenCalledWith(fail);
    });

    it('does not throw when callBack is omitted', async () => {
      expect(() =>
        ScreenCaptureUtil.screenCapture(undefined, true, {
          extension: 'png',
          quality: 100,
          scale: 0,
        }),
      ).not.toThrow();
      await flushPromises();
    });
  });
});

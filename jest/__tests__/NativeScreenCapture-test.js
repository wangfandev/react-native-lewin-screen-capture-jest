/**
 * Copyright (c) 2026 Huawei Technologies Co., Ltd.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {TurboModuleRegistry} from 'react-native';
import NativeScreenCapture from '../../src/specs/v1/NativeScreenCapture';

describe('NativeScreenCapture', () => {
  const native = global.__RNOH_JS_TEST_MOCKS__.NativeScreenCapture;

  it('registers TurboModule via getEnforcing with name ScreenCapture', () => {
    expect(TurboModuleRegistry.getEnforcing).toHaveBeenCalledWith('ScreenCapture');
    expect(NativeScreenCapture).toBe(native);
  });

  it('exposes the Spec methods', () => {
    expect(typeof NativeScreenCapture.startListener).toBe('function');
    expect(typeof NativeScreenCapture.stopListener).toBe('function');
    expect(typeof NativeScreenCapture.screenCapture).toBe('function');
    expect(typeof NativeScreenCapture.clearCache).toBe('function');
  });

  it('startListener resolves success', async () => {
    await expect(NativeScreenCapture.startListener('abc,test')).resolves.toBe(
      'success',
    );
    expect(native.startListener).toHaveBeenCalledWith('abc,test');
  });

  it('stopListener resolves true', async () => {
    await expect(NativeScreenCapture.stopListener()).resolves.toBe('true');
    expect(native.stopListener).toHaveBeenCalledTimes(1);
  });

  it('screenCapture resolves capture payload', async () => {
    const result = await NativeScreenCapture.screenCapture(true, 'png', 100, 0);
    expect(result).toEqual({
      code: '200',
      uri: 'file:///data/storage/el2/base/cache/lewin-screen-capture/screen-capture-20260101120000.png',
      base64: 'iVBORw0KGgo=',
    });
    expect(native.screenCapture).toHaveBeenCalledWith(true, 'png', 100, 0);
  });

  it('clearCache resolves code 200', async () => {
    await expect(NativeScreenCapture.clearCache()).resolves.toEqual({
      code: '200',
    });
    expect(native.clearCache).toHaveBeenCalledTimes(1);
  });
});

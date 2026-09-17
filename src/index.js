'use strict'

import NativeScreenCapture from './specs/v1/NativeScreenCapture';
import { DeviceEventEmitter } from 'react-native';

let screenCaptureEmitter = undefined

type CALL_BBACK_PROPS = {
  code: string, // 200 为正常 其他为异常
  uri: string, // 文件路径
  base64: string, // 图片base64 png
}

/**
 * 获取系统截屏事件/截屏工具类（鸿蒙适配版）
 * 鸿蒙窗口快照默认不含系统状态栏（对齐 android 默认不含状态栏的语义）
 */
export default class ScreenCaptureUtil  {

  /**
   * 开始监听截屏事件
   * keyWords 为 API 兼容保留参数：鸿蒙使用系统原生截屏事件（window.on('screenshot')），
   * 无需 Android 的截屏文件名关键字判定，参数值不参与逻辑
   * @param {*} callBack
   */
  static startListener (callBack : ((data:CALL_BBACK_PROPS) => void), keyWords) {
    // 鸿蒙走 Android 风格 emitDeviceEvent 通道，统一使用 DeviceEventEmitter
    screenCaptureEmitter && screenCaptureEmitter.removeAllListeners('ScreenCapture')

    screenCaptureEmitter = DeviceEventEmitter;

    screenCaptureEmitter.addListener('ScreenCapture', (data : CALL_BBACK_PROPS) => {
      if (callBack) {
        callBack(data)
      }
    })
    NativeScreenCapture.startListener(keyWords || '');
    return screenCaptureEmitter
  }

  /**
   * 停止监听
   */
  static stopListener () {
    screenCaptureEmitter && screenCaptureEmitter.removeAllListeners('ScreenCapture')
    return NativeScreenCapture.stopListener();
  }

  /**
   * 清除截屏缓存文件
   * @param {*} callBack
   */
  static clearCache (callBack:((data:CALL_BBACK_PROPS) => void)) {
    NativeScreenCapture.clearCache().then(res=>{
      callBack && callBack(res)
    }).catch(err=>{
      callBack && callBack(err)
    })
  }

  /**
   * 截取当前屏幕方法
   */
  static screenCapture = (callBack:((data:CALL_BBACK_PROPS) => void), isHiddenStatus, { extension = 'png', quality = 100, scale = 0 }) => {
    if (isHiddenStatus === undefined || isHiddenStatus === null) {
      // 鸿蒙窗口快照天然不含系统状态栏，缺省对齐 android 默认不含状态栏语义
      isHiddenStatus = true
    }
    NativeScreenCapture.screenCapture(isHiddenStatus, extension || 'png', quality || 100, scale || 0).then(res=>{
      callBack && callBack(res)
    }).catch(err=>{
      callBack && callBack(err)
    })
  }
}

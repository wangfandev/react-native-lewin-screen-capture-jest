/**
 * react-native-lewin-screen-capture 插件类型声明（Example 本地 shim）。
 *
 * 插件入口为 JS（src/index.js，含内联类型注解，未发布 .d.ts），
 * tsc(strict) 下按原始包名（harmony.alias）导入会报 TS2307/TS7016，
 * 故在 Example 侧补充与环境一致的模块声明；方法签名以源仓 index.js 为准。
 */

declare module 'react-native-lewin-screen-capture' {
  /** 截屏结果（code: '200' 正常，其余异常；uri 为沙箱文件路径；base64 为图片编码） */
  export interface ScreenCaptureResult {
    code: string;
    uri: string;
    base64: string;
  }

  export default class ScreenCaptureUtil {
    /** 开始监听系统截屏事件，返回事件 emitter（鸿蒙 keyWords 参数兼容保留，值不参与逻辑） */
    static startListener(
      callBack: (data: ScreenCaptureResult) => void,
      keyWords?: string,
    ): { removeAllListeners: (eventType: string) => void };

    /** 停止监听，成功 resolve 'true'，失败 reject */
    static stopListener(): Promise<string>;

    /** 清除截屏缓存文件，结果经 callBack 回调 */
    static clearCache(callBack: (data: { code: string }) => void): void;

    /** 截取当前屏幕（isHiddenStatus 缺省 true；quality 仅 jpg/jpeg 生效；scale>0 等比缩放） */
    static screenCapture(
      callBack: (data: ScreenCaptureResult) => void,
      isHiddenStatus?: boolean,
      options?: { extension?: string; quality?: number; scale?: number },
    ): void;
  }
}

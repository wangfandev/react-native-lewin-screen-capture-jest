import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  /**
   * 开始监听系统截屏事件。keyWords 为 API 兼容保留参数（鸿蒙走系统原生
   * window.on('screenshot') 事件，无需 Android 的截屏文件名关键字启发式判定）。
   * resolve 'success'，失败 reject code '500'。
   */
  startListener(keyWords: string): Promise<string>;

  /**
   * 停止监听系统截屏事件。resolve 'true'，失败 reject code '500'。
   */
  stopListener(): Promise<string>;

  /**
   * 截取当前屏幕（应用窗口快照）。
   * 成功 resolve {code:'200', uri:'file://<沙箱绝对路径>', base64}，
   * 失败 resolve {code:'500'}（对齐 Android 行为，不 reject）。
   * isHiddenStatus 为兼容保留参数（鸿蒙窗口快照天然不含系统状态栏，无需裁剪）。
   */
  screenCapture(
    isHiddenStatus: boolean,
    extension: string,
    quality: number,
    scale: number
  ): Promise<Object>;

  /**
   * 递归删除截屏缓存目录。成功/目录不存在 resolve {code:'200'}，
   * 异常 resolve {code:'500'}。
   */
  clearCache(): Promise<Object>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('ScreenCapture');

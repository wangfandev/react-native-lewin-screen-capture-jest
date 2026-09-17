import { UITurboModule, UITurboModuleContext } from '@rnoh/react-native-openharmony/ts';
import { TM } from './generated/ts';
import { window } from '@kit.ArkUI';
import { image } from '@kit.ImageKit';
import { fileIo } from '@kit.CoreFileKit';
import { util } from '@kit.ArkTS';
import { BusinessError } from '@kit.BasicServicesKit';
import hilog from '@ohos.hilog';

const DOMAIN = 0x0501;
const TAG = 'ScreenCaptureTurboModule';

/** 截屏事件名（JS 侧 DeviceEventEmitter 监听同名事件，与 Android/iOS 一致） */
const EVENT_NAME = 'ScreenCapture';
/** 截图缓存目录名（应用 cacheDir 下，命名沿用 iOS 侧目录名） */
const CACHE_DIR_NAME = 'lewin-screen-capture';
/** 截图文件名前缀（时间戳风格与原库一致） */
const FILE_PREFIX = 'screen-capture-';
/** 结果 code：成功 */
const CODE_SUCCESS = '200';
/** 结果 code：失败 */
const CODE_FAIL = '500';

/** 截图完整结果（与 Android/iOS 回调结构一致） */
interface CaptureResult {
  code: string;
  uri: string;
  base64: string;
}

/** 仅含 code 的结果（失败返回 / 缓存清理返回） */
interface CodeResult {
  code: string;
}

export class ScreenCaptureTurboModule extends UITurboModule implements TM.ScreenCapture.Spec {
  /** 已注册截屏事件监听的窗口实例（停止/销毁时配对 off 并清理引用） */
  private listenedWindow: window.Window | null = null;
  /** on/off 配对的回调引用 */
  private screenshotCallback: (() => void) | null = null;

  constructor(ctx: UITurboModuleContext) {
    super(ctx);
  }

  /**
   * 开始监听系统截屏事件。
   * keyWords 为 API 兼容保留参数：鸿蒙使用系统原生截屏事件 window.on('screenshot')
   * （对控制中心截屏、hdc 命令截屏、整屏截屏接口生效），无需 Android 的
   * 媒体库时间/尺寸/路径关键字启发式判定，参数值不参与逻辑。
   */
  startListener(keyWords: string): Promise<string> {
    // 先注册监听再 resolve；异步等待窗口获取结果
    return this.registerScreenshotListener();
  }

  /** 获取窗口并注册系统截屏事件监听 */
  private async registerScreenshotListener(): Promise<string> {
    try {
      const win = await window.getLastWindow(this.ctx.uiAbilityContext);
      this.unregisterScreenshotListener();
      this.listenedWindow = win;
      this.screenshotCallback = (): void => {
        this.onScreenshotTaken();
      };
      win.on('screenshot', this.screenshotCallback);
      hilog.info(DOMAIN, TAG, 'screenshot listener registered');
      return 'success';
    } catch (err) {
      const e = err as BusinessError;
      hilog.error(DOMAIN, TAG, `startListener failed: code=${e.code}, message=${e.message}`);
      return Promise.reject<string>(CODE_FAIL);
    }
  }

  /**
   * 停止监听系统截屏事件。
   */
  async stopListener(): Promise<string> {
    try {
      this.unregisterScreenshotListener();
      hilog.info(DOMAIN, TAG, 'screenshot listener unregistered');
      return 'true';
    } catch (err) {
      const e = err as BusinessError;
      hilog.error(DOMAIN, TAG, `stopListener failed: code=${e.code}, message=${e.message}`);
      return Promise.reject<string>(CODE_FAIL);
    }
  }

  /**
   * 截取当前屏幕（应用窗口快照，等价 Android PixelCopy 截 Activity 窗口）。
   * isHiddenStatus 为兼容保留参数：鸿蒙窗口快照天然不含系统状态栏，无需裁剪。
   * 失败 resolve {code:'500'}（对齐 Android 行为，不 reject）。
   */
  async screenCapture(isHiddenStatus: boolean, extension: string, quality: number, scale: number): Promise<Object> {
    const ext = this.normalizeExtension(extension);
    try {
      const win = await window.getLastWindow(this.ctx.uiAbilityContext);
      const pixelMap = await win.snapshot();
      const result = await this.pixelMapToResult(pixelMap, ext, quality, scale);
      hilog.info(DOMAIN, TAG, `screenCapture success, uri=${result.uri}`);
      return result;
    } catch (err) {
      const e = err as BusinessError;
      hilog.error(DOMAIN, TAG, `screenCapture failed: code=${e.code}, message=${e.message}`);
      const failResult: CodeResult = { code: CODE_FAIL };
      return failResult;
    }
  }

  /**
   * 递归删除截图缓存目录。
   * 目录不存在视为清理成功（幂等，对齐 iOS 行为）；异常 resolve {code:'500'}。
   */
  async clearCache(): Promise<Object> {
    const dirPath = this.getCacheDirPath();
    try {
      const exists = await fileIo.access(dirPath);
      if (exists) {
        await fileIo.rmdir(dirPath);
      }
      hilog.info(DOMAIN, TAG, `clearCache done, dir=${dirPath}`);
      const result: CodeResult = { code: CODE_SUCCESS };
      return result;
    } catch (err) {
      const e = err as BusinessError;
      hilog.error(DOMAIN, TAG, `clearCache failed: code=${e.code}, message=${e.message}`);
      const result: CodeResult = { code: CODE_FAIL };
      return result;
    }
  }

  /** UITurboModule 销毁钩子：移除监听、清理窗口引用，防止泄漏 */
  __onDestroy__(): void {
    this.unregisterScreenshotListener();
  }

  /**
   * 系统截屏事件触发处理（对齐 iOS 实现：通知触发时主动生成当前窗口截图作为载荷）。
   * 行为差异：Android 回调系统截图原图文件，鸿蒙无法读取系统截屏产物
   * （媒体库读取权限受限），以事件时刻应用窗口快照替代。
   */
  private onScreenshotTaken(): void {
    const win = this.listenedWindow;
    if (win === null) {
      return;
    }
    win.snapshot()
      .then((pixelMap: image.PixelMap) => {
        return this.pixelMapToResult(pixelMap, 'png', 100, 0);
      })
      .then((result: CaptureResult) => {
        hilog.info(DOMAIN, TAG, `screenshot event emitted, uri=${result.uri}`);
        this.ctx.rnInstance.emitDeviceEvent(EVENT_NAME, result);
      })
      .catch((err: BusinessError) => {
        hilog.error(DOMAIN, TAG, `handle screenshot event failed: code=${err.code}, message=${err.message}`);
        const failResult: CaptureResult = { code: CODE_FAIL, uri: '', base64: '' };
        this.ctx.rnInstance.emitDeviceEvent(EVENT_NAME, failResult);
      });
  }

  /**
   * PixelMap → 编码 → 写文件 → {code, uri, base64}。
   * quality 仅对 jpg/jpeg 生效（PNG 无损，与 Android Bitmap.compress 对 PNG
   * 忽略 quality 的行为一致）；scale > 0 时等比缩放。
   * PixelMap 与 ImagePacker 使用完毕必须释放。
   */
  private async pixelMapToResult(pixelMap: image.PixelMap, extension: string, quality: number,
    scale: number): Promise<CaptureResult> {
    let packer: image.ImagePacker | null = null;
    try {
      if (scale > 0) {
        await pixelMap.scale(scale, scale);
      }
      const isJpeg = extension === 'jpg' || extension === 'jpeg';
      const options: image.PackingOption = {
        format: isJpeg ? 'image/jpeg' : 'image/png',
        quality: isJpeg ? this.clampQuality(quality) : 100,
      };
      packer = image.createImagePacker();
      const buffer = await packer.packToData(pixelMap, options);
      const dirPath = this.getCacheDirPath();
      this.ensureDir(dirPath);
      const filePath = dirPath + '/' + FILE_PREFIX + this.formatTimestamp() + '.' + extension;
      this.writeBufferToFile(filePath, buffer);
      const base64Str = new util.Base64Helper().encodeToStringSync(new Uint8Array(buffer));
      const result: CaptureResult = { code: CODE_SUCCESS, uri: 'file://' + filePath, base64: base64Str };
      return result;
    } catch (err) {
      const e = err as BusinessError;
      hilog.error(DOMAIN, TAG, `encode/write screenshot failed: code=${e.code}, message=${e.message}`);
      throw new Error(`pixelMapToResult failed: ${e.message}`);
    } finally {
      if (packer !== null) {
        packer.release().catch((err: BusinessError) => {
          hilog.warn(DOMAIN, TAG, `imagePacker release failed: ${err.message}`);
        });
      }
      pixelMap.release().catch((err: BusinessError) => {
        hilog.warn(DOMAIN, TAG, `pixelMap release failed: ${err.message}`);
      });
    }
  }

  /** 注销截屏事件监听并清理窗口/回调引用 */
  private unregisterScreenshotListener(): void {
    if (this.listenedWindow !== null && this.screenshotCallback !== null) {
      this.listenedWindow.off('screenshot', this.screenshotCallback);
    }
    this.listenedWindow = null;
    this.screenshotCallback = null;
  }

  /** 截图缓存目录绝对路径（应用沙箱 cacheDir 下，读写无需权限） */
  private getCacheDirPath(): string {
    return this.ctx.uiAbilityContext.cacheDir + '/' + CACHE_DIR_NAME;
  }

  /** 确保目录存在（递归创建） */
  private ensureDir(dirPath: string): void {
    try {
      if (!fileIo.accessSync(dirPath)) {
        fileIo.mkdirSync(dirPath, true);
      }
    } catch (err) {
      const e = err as BusinessError;
      hilog.error(DOMAIN, TAG, `ensureDir failed: code=${e.code}, message=${e.message}`);
      throw new Error(`ensureDir failed: ${e.message}`);
    }
  }

  /** 将编码字节流写入文件 */
  private writeBufferToFile(filePath: string, buffer: ArrayBuffer): void {
    let file: fileIo.File | null = null;
    try {
      file = fileIo.openSync(filePath,
        fileIo.OpenMode.READ_WRITE | fileIo.OpenMode.CREATE | fileIo.OpenMode.TRUNC);
      fileIo.writeSync(file.fd, buffer);
      fileIo.closeSync(file);
      file = null;
    } catch (err) {
      if (file !== null) {
        try {
          fileIo.closeSync(file);
        } catch (closeErr) {
          hilog.warn(DOMAIN, TAG, 'closeSync after write failure also failed');
        }
      }
      const e = err as BusinessError;
      hilog.error(DOMAIN, TAG, `writeBufferToFile failed: code=${e.code}, message=${e.message}`);
      throw new Error(`writeBufferToFile failed: ${e.message}`);
    }
  }

  /** 输出格式归一化：仅接受 png/jpg/jpeg，其余按 png 处理（对齐 JS 层缺省 'png'） */
  private normalizeExtension(extension: string): string {
    if (extension === 'jpg' || extension === 'jpeg' || extension === 'png') {
      return extension;
    }
    return 'png';
  }

  /** 压缩质量收敛到 [0,100]（PackingOption.quality 合法区间） */
  private clampQuality(quality: number): number {
    if (quality < 0) {
      return 0;
    }
    if (quality > 100) {
      return 100;
    }
    return quality;
  }

  /** 生成 yyyyMMddHHmmss 时间戳文件名（与原库命名风格一致） */
  private formatTimestamp(): string {
    const now = new Date();
    const year = `${now.getFullYear()}`;
    const month = this.pad2(now.getMonth() + 1);
    const day = this.pad2(now.getDate());
    const hour = this.pad2(now.getHours());
    const minute = this.pad2(now.getMinutes());
    const second = this.pad2(now.getSeconds());
    return year + month + day + hour + minute + second;
  }

  /** 两位数字补零 */
  private pad2(value: number): string {
    return value < 10 ? '0' + value : `${value}`;
  }
}

# @oh-rn/react-native-lewin-screen-capture for HarmonyOS

本项目基于 [react-native-lewin-screen-capture](https://github.com/LewinJun/react-native-lewin-screen-capture) 开发，为 React Native 鸿蒙（OpenHarmony）适配版本。

## 版本对应关系

| 鸿蒙适配包版本 | 原始库版本 | 支持 RN 版本 | Autolink | 编译 API 版本 |
| ------------ | ---------- | ------------ | -------- | ------------- |
| 1.1.0 | 1.1.0 | 0.72+ | 是 | API 13+ |

## 安装

```bash
npm install @oh-rn/react-native-lewin-screen-capture
```

## 使用

```tsx
import ScreenCaptureUtil from 'react-native-lewin-screen-capture';

// 1. 监听系统截屏事件（截屏触发时回调）
const emitter = ScreenCaptureUtil.startListener(data => {
  // data: { code: '200', uri: 'file://<沙箱路径>', base64: '<图片编码>' }
  console.log('screenshot event', data.code, data.uri);
}, '');

// 2. 主动截取当前屏幕（结果经 callBack 返回）
ScreenCaptureUtil.screenCapture(
  data => {
    if (data.code === '200') {
      console.log('captured:', data.uri, data.base64.length);
    }
  },
  true,
  {extension: 'png', quality: 100, scale: 0},
);

// 3. 停止监听（返回 Promise<string>，成功 resolve 'true'）
const res = await ScreenCaptureUtil.stopListener();

// 4. 清除截屏缓存文件
ScreenCaptureUtil.clearCache(data => {
  console.log('clearCache:', data.code); // '200'
});
```

> import 时使用原库名 `'react-native-lewin-screen-capture'`（由 Metro 端 harmony 别名自动重定向到 `@oh-rn/react-native-lewin-screen-capture`），而非直接 import 鸿蒙包名。

**平台差异**：
- `startListener` 的 `keyWords` 参数在鸿蒙端保留但值不参与逻辑（使用系统原生截屏事件 `window.on('screenshot')`，无需关键字过滤）
- `startListener` 回调图片为截屏事件触发时刻的应用窗口快照（系统截屏产物的媒体库读取受权限限制），`{code, uri, base64}` 结构与 Android/iOS 一致
- `screenCapture` 的 `quality` 仅对 jpg/jpeg 生效（PNG 无损），与 Android 行为一致

**权限要求**：
- 无需任何特殊权限；截屏文件读写均在应用沙箱内完成，`module.json5` 无需声明权限

## Link

| 版本 | 是否支持 Autolink |
|------|------------------|
| 当前版本 | 是 |

如使用版本支持 Autolink 且工程已接入，可跳过手动配置。

<details>
<summary>Manual Link 配置</summary>

> **说明**：本模块需要同时在 C++ 侧和 ETS 侧注册 Package。

### 1. Overrides RN SDK

在工程根目录 `oh-package.json5` 添加：

```json
{
  "overrides": {
    "@rnoh/react-native-openharmony": "./react_native_openharmony"
  }
}
```

### 2. 引入原生端依赖

打开 `entry/oh-package.json5`，添加：

```json
"dependencies": {
  "@oh-rn/react-native-lewin-screen-capture": "file:../../node_modules/@oh-rn/react-native-lewin-screen-capture/harmony/lewin_screen_capture.har"
}
```

执行 `ohpm install`。

### 3. 配置 CMakeLists

打开 `entry/src/main/cpp/CMakeLists.txt`，添加：

```cmake
set(OH_MODULES "${CMAKE_CURRENT_SOURCE_DIR}/../../../oh_modules")

add_subdirectory("${OH_MODULES}/@oh-rn/react-native-lewin-screen-capture/src/main/cpp" ./lewin_screen_capture)

target_link_libraries(rnoh_app PUBLIC lewin_screen_capture)
```

### 4. 注册 Package（C++ 侧）

打开 `entry/src/main/cpp/PackageProvider.cpp`，添加：

```cpp
#include "LewinScreenCapturePackage.h"

std::vector<std::shared_ptr<Package>> PackageProvider::getPackages(Package::Context ctx) {
    return {
        std::make_shared<LewinScreenCapturePackage>(ctx),
    };
}
```

### 5. 注册 Package（ETS 侧）

打开 `entry/src/main/ets/RNPackagesFactory.ets`，添加：

```typescript
import { LewinScreenCapturePackage } from '@oh-rn/react-native-lewin-screen-capture/ts';

export function createRNPackages(ctx: RNPackageContext): RNPackage[] {
  return [
    new LewinScreenCapturePackage(ctx),
  ];
}
```

</details>

## 属性 / API

| API | 描述 | 参数 | 返回值 | HarmonyOS 支持 |
|-----|------|------|--------|----------------|
| startListener | 监听系统截屏事件 | callBack: (data) => void, keyWords?: string | Emitter（可 removeAllListeners）；事件经 callBack 回调 `{code, uri, base64}` | ⚠️ 部分支持（keyWords 不参与过滤；回调图片为应用窗口快照） |
| stopListener | 停止截屏事件监听 | 无 | Promise\<string\>（成功 'true'） | ✅ 完全支持 |
| screenCapture | 主动截取当前屏幕 | callBack, isHiddenStatus?: boolean, options?: {extension, quality, scale} | 经 callBack 回调 `{code, uri, base64}` | ✅ 完全支持 |
| clearCache | 清除截屏缓存文件 | callBack: (data) => void | 经 callBack 回调 `{code}` | ✅ 完全支持 |

### 平台差异

- `startListener`：鸿蒙端基于系统原生截屏事件 `window.on('screenshot')`（API 9+，无需权限），`keyWords` 参数保留但不参与逻辑；回调图片为事件触发时刻的应用窗口快照（系统截屏产物的媒体库读取受权限限制），载荷结构 `{code, uri, base64}` 与 Android/iOS 一致
- `screenCapture`：鸿蒙窗口快照天然不含系统状态栏，`isHiddenStatus` 保留但无实际影响；`quality` 仅 jpg/jpeg 生效（PNG 无损）；`scale > 0` 时等比缩放
- 截屏结果 `base64` 可达数 MB，跨层传递存在字符串拷贝开销，高频调用场景请关注性能

### 未实现功能

无（原库 4 个 API 均已实现）

### 使用限制

- 无需在 `module.json5` 声明任何权限（截屏文件读写均在应用沙箱内完成）

## 快速验证（运行 Example）

### 前置条件

| 依赖 | 版本要求 |
|------|----------|
| Node.js | >= 18 |
| DevEco Studio | 5.0+ / 6.0+ |
| HarmonyOS SDK | API 13+ |

### 运行步骤

**1. 克隆仓库**

```bash
git clone <仓库地址>
cd <仓库目录>
```

**2. 安装依赖并构建**

```bash
npm install --legacy-peer-deps
npm pack           # 生成 tgz 包
```

**3. 进入 example 目录，安装依赖**

```bash
cd example
npm install --legacy-peer-deps
```

**4. 生成 JS Bundle**

```bash
npm run dev
```

产物：`harmony/entry/src/main/resources/rawfile/bundle.harmony.js`

**5. 用 DevEco Studio 打开鸿蒙工程**

- 打开 DevEco Studio
- 选择 `example/harmony` 目录
- 等待 Sync 完成

**6. 编译并运行 HAP**

在 DevEco Studio 中点击运行按钮，将 HAP 安装到设备/模拟器。

> **注意**：Example 中已预置插件依赖和 Package 注册，无需手动配置 Link。

## 约束与限制

### 兼容性

- RNOH: 0.72+
- HarmonyOS SDK: API 13+（compatibleSdkVersion 5.0.1(13)，targetSdkVersion 6.0.1(21)）
- DevEco Studio: 5.0+

## 遗留问题

- `startListener` 回调载荷为应用窗口快照而非系统截图原图（媒体库读取权限受限），建议真机验证确认满足业务需求
- 大尺寸截图的 base64 字符串跨层传递存在性能开销，高分辨率设备上建议关注耗时

## 开源协议

本项目基于 [ISC License](https://github.com/LewinJun/react-native-lewin-screen-capture/blob/master/LICENSE)，详见 [LICENSE](./LICENSE) 文件。
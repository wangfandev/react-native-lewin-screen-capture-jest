import { RNOHPackage } from '@rnoh/react-native-openharmony/ets';
import type { UITurboModule, UITurboModuleContext } from '@rnoh/react-native-openharmony/ts';
import { ScreenCaptureTurboModule } from './ScreenCaptureTurboModule';
import { TM } from './generated/ts';

export class LewinScreenCapturePackage extends RNOHPackage {
  getUITurboModuleFactoryByNameMap(): Map<string, (ctx: UITurboModuleContext) => UITurboModule | null> {
    const map = new Map<string, (ctx: UITurboModuleContext) => UITurboModule | null>();
    map.set(TM.ScreenCapture.NAME, (ctx: UITurboModuleContext) => new ScreenCaptureTurboModule(ctx));
    return map;
  }

  override async createEagerUITurboModuleByNameMap(ctx: UITurboModuleContext): Promise<Map<string, UITurboModule>> {
    const module = new ScreenCaptureTurboModule(ctx);
    return new Map()
      .set(TM.ScreenCapture.NAME, module)
  }
}

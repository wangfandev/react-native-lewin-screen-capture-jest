/**
 * react-native-lewin-screen-capture（截屏事件监听 / 主动截屏）OpenHarmony Example 测试页
 *
 * 覆盖 03-coding-library implemented_methods 的全部 4 个方法：
 * 每个方法一个 Run 按钮（testID: test-{method}-btn），结果写入 Result:/Error: 区块。
 * startListener 的截屏事件经鸿蒙 DeviceEventEmitter 通道回调（库内部管理 emitter），
 * 组件卸载时若仍在监听则调用 stopListener 注销，避免监听泄漏。
 */

import React, {useEffect, useRef, useState} from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ScreenCaptureUtil, {
  ScreenCaptureResult,
} from 'react-native-lewin-screen-capture';

const PAGE_TITLE = 'Lewin Screen Capture';

type MethodName = 'startListener' | 'stopListener' | 'screenCapture' | 'clearCache';

const METHOD_ORDER: MethodName[] = [
  'startListener',
  'stopListener',
  'screenCapture',
  'clearCache',
];

function formatCapture(data: ScreenCaptureResult): string {
  const base64 = data?.base64 ?? '';
  return `code=${data?.code ?? 'unknown'} uri=${data?.uri ?? ''} base64=${base64.length} chars`;
}

function App(): JSX.Element {
  const [results, setResults] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [listening, setListening] = useState(false);
  const [previewBase64, setPreviewBase64] = useState('');
  const listeningRef = useRef(false);

  useEffect(() => {
    return () => {
      // 卸载时注销截屏监听（stopListener 同时移除 JS 侧事件订阅并调用原生 off）
      if (listeningRef.current) {
        try {
          ScreenCaptureUtil.stopListener().catch(() => {});
        } catch (e) {
          // 忽略卸载路径上的清理异常
        }
      }
    };
  }, []);

  const setResult = (method: MethodName, text: string): void => {
    setResults(prev => ({...prev, [method]: text}));
    setErrors(prev => ({...prev, [method]: ''}));
  };

  const setError = (method: MethodName, text: string): void => {
    setErrors(prev => ({...prev, [method]: text}));
    setResults(prev => ({...prev, [method]: ''}));
  };

  const handleStartListener = (): void => {
    try {
      ScreenCaptureUtil.startListener(data => {
        // 系统截屏事件载荷：成功 {code:'200', uri, base64}，失败 {code:'500', uri:'', base64:''}
        if (data && data.code === '200') {
          setResult('startListener', `screenshot event ${formatCapture(data)}`);
          if (data.base64) {
            setPreviewBase64(data.base64);
          }
        } else {
          setError('startListener', `screenshot event ${formatCapture(data)}`);
        }
      }, 'abc,test');
      listeningRef.current = true;
      setListening(true);
      setResult('startListener', 'success - listening for screenshot events');
    } catch (e) {
      setError('startListener', String(e));
    }
  };

  const handleStopListener = async (): Promise<void> => {
    try {
      const res = await ScreenCaptureUtil.stopListener();
      listeningRef.current = false;
      setListening(false);
      setResult('stopListener', `success: ${String(res)}`);
    } catch (e) {
      setError('stopListener', String(e));
    }
  };

  const handleScreenCapture = (): void => {
    try {
      ScreenCaptureUtil.screenCapture(
        data => {
          if (!data) {
            setError('screenCapture', 'empty result');
            return;
          }
          if (data.code !== '200') {
            setError('screenCapture', formatCapture(data));
            return;
          }
          setResult('screenCapture', formatCapture(data));
          if (data.base64) {
            setPreviewBase64(data.base64);
          }
        },
        undefined,
        {extension: 'png', quality: 100, scale: 0},
      );
    } catch (e) {
      setError('screenCapture', String(e));
    }
  };

  const handleClearCache = (): void => {
    try {
      ScreenCaptureUtil.clearCache(data => {
        if (!data) {
          setError('clearCache', 'empty result');
          return;
        }
        if (data.code !== '200') {
          setError('clearCache', `code=${data.code}`);
          return;
        }
        setResult('clearCache', `code=${data.code} (cache cleared)`);
      });
    } catch (e) {
      setError('clearCache', String(e));
    }
  };

  const runMethod = (method: MethodName): void => {
    switch (method) {
      case 'startListener':
        handleStartListener();
        break;
      case 'stopListener':
        void handleStopListener();
        break;
      case 'screenCapture':
        handleScreenCapture();
        break;
      case 'clearCache':
        handleClearCache();
        break;
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text testID="app-title" accessibilityLabel="app-title" style={styles.title}>
          {PAGE_TITLE}
        </Text>
        <Text style={styles.status}>
          {`screenshot listener: ${listening ? 'ON' : 'OFF'}`}
        </Text>
        <Text style={styles.hint}>
          startListener 后从控制中心下拉截屏（或音量下+电源键）触发事件回调
        </Text>

        {METHOD_ORDER.map(method => (
          <View key={method} style={styles.section}>
            <TouchableOpacity
              testID={`test-${method}-btn`}
              accessibilityLabel={`test-${method}-btn`}
              style={styles.button}
              activeOpacity={0.6}
              onPress={() => runMethod(method)}>
              <Text style={styles.buttonText}>{`Run ${method}`}</Text>
            </TouchableOpacity>

            {results[method] ? (
              <View testID={`result-${method}-box`} style={styles.resultBox}>
                <Text style={styles.resultLabel}>Result:</Text>
                <Text testID={`result-${method}`} style={styles.resultText}>
                  {results[method]}
                </Text>
              </View>
            ) : null}

            {errors[method] ? (
              <View testID={`error-${method}-box`} style={styles.errorBox}>
                <Text style={styles.errorLabel}>Error:</Text>
                <Text testID={`error-${method}`} style={styles.resultText}>
                  {errors[method]}
                </Text>
              </View>
            ) : null}
          </View>
        ))}

        {previewBase64 ? (
          <View style={styles.previewSection}>
            <Text style={styles.resultLabel}>Captured image (base64 preview):</Text>
            <Image
              testID="capture-preview"
              style={styles.preview}
              resizeMode="contain"
              source={{uri: `data:image/png;base64,${previewBase64}`}}
            />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#222',
    textAlign: 'center',
    marginTop: 8,
  },
  status: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginTop: 6,
  },
  hint: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  section: {
    marginTop: 16,
  },
  button: {
    backgroundColor: '#2A6ED9',
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  resultBox: {
    marginTop: 8,
    backgroundColor: '#EAF3EA',
    borderRadius: 6,
    padding: 10,
  },
  resultLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E6B2E',
  },
  resultText: {
    fontSize: 13,
    color: '#333',
    marginTop: 4,
  },
  errorBox: {
    marginTop: 8,
    backgroundColor: '#F9E9E9',
    borderRadius: 6,
    padding: 10,
  },
  errorLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#A33',
  },
  previewSection: {
    marginTop: 20,
    alignItems: 'center',
  },
  preview: {
    width: 240,
    height: 360,
    marginTop: 8,
    backgroundColor: '#DDD',
    borderRadius: 6,
  },
});

export default App;

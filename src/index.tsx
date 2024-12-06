import type { Options } from './NativeFileViewerTurbo';

import { Platform, NativeModules, NativeEventEmitter } from 'react-native';
import uuid from 'react-native-uuid';

// @ts-expect-error
const isTurboModuleEnabled = global.__turboModuleProxy != null;

const FileViewerTurbo = isTurboModuleEnabled
  ? require('./NativeFileViewerTurbo').default
  : NativeModules.FileViewerTurbo;

const eventEmitter = isTurboModuleEnabled
  ? null
  : new NativeEventEmitter(FileViewerTurbo);

export async function open(
  path: string,
  options: Partial<Options & { onDismiss: () => void }> = {}
) {
  const { onDismiss, ...nativeOptions } = options;
  try {
    const currentId = uuid.v4();

    await FileViewerTurbo.open(normalize(path), currentId, nativeOptions);

    if (Platform.OS !== 'ios') {
      return;
    }

    const dismissSubscription = addListener(
      'onViewerDidDismiss',
      ({ id }: { id: string }) => {
        if (id === currentId) {
          dismissSubscription?.remove();
          onDismiss && onDismiss();
        }
      }
    );
  } catch (error) {
    throw error;
  }
}

const addListener = (event: string, listener: (event: any) => void) => {
  return isTurboModuleEnabled
    ? FileViewerTurbo[event](listener)
    : eventEmitter?.addListener(event, listener);
};

function normalize(path: string) {
  const filePrefix = 'file://';
  if (path.startsWith(filePrefix)) {
    path = path.substring(filePrefix.length);
    try {
      path = decodeURI(path);
    } catch (e) {}
  }

  return path;
}

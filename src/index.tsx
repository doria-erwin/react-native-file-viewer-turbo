import type { Options } from './NativeFileViewerTurbo';

import {
  NativeModules,
  NativeEventEmitter,
  Platform,
  type EmitterSubscription,
} from 'react-native';
import { createRef, type MutableRefObject } from 'react';

// @ts-expect-error
const isTurboModuleEnabled = global.__turboModuleProxy != null;

const FileViewerTurbo = isTurboModuleEnabled
  ? require('./NativeFileViewerTurbo').default
  : NativeModules.FileViewerTurbo;

const eventEmitter =
  // android relies on legacy emitter for backward compatibility
  isTurboModuleEnabled && Platform.OS === 'ios'
    ? null
    : new NativeEventEmitter(FileViewerTurbo);

const dismissListener: MutableRefObject<EmitterSubscription | null> =
  createRef();

export async function open(
  path: string,
  options: Partial<Options & { onDismiss: () => void }> = {}
) {
  const { onDismiss, ...nativeOptions } = options;
  try {
    await FileViewerTurbo.open(normalize(path), nativeOptions);

    dismissListener.current = addListener('onViewerDidDismiss', () => {
      dismissListener.current?.remove();
      onDismiss && onDismiss();
    });
  } catch (error) {
    throw error;
  }
}

const addListener = (
  event: string,
  listener: (event: any) => void
): EmitterSubscription => {
  // android relies on legacy emitter for backward compatibility
  return !isTurboModuleEnabled || Platform.OS === 'android'
    ? eventEmitter?.addListener(event, listener) ?? { remove: () => { } }
    : FileViewerTurbo[event](listener);
};

function normalize(path: string) {
  const filePrefix = 'file://';
  if (path.startsWith(filePrefix)) {
    path = path.substring(filePrefix.length);
    try {
      path = decodeURI(path);
    } catch (e) { }
  }

  return path;
}

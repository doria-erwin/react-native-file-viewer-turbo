import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import type { EventEmitter } from 'react-native/Libraries/Types/CodegenTypes';

export type Options = {
  displayName?: string;
  showOpenWithDialog?: boolean;
  showAppsSuggestions?: boolean;
};

type OnViewerDidDismissEvent = { id: number };

export interface Spec extends TurboModule {
  // not able to use options as typed object due to backward compatibility with iOS
  open(path: string, currentId: string, options: Object): Promise<void>;

  readonly onViewerDidDismiss: EventEmitter<OnViewerDidDismissEvent>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('FileViewerTurbo');

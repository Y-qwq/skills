import { useMount } from './runtime';
import {
  appLifecycle,
  createRoomConnection,
  reportLifecycleState,
} from './services';

export function AppLifecycleObserver() {
  useMount(() => {
    const subscription = appLifecycle.subscribe(reportLifecycleState);
    return () => subscription.remove();
  });

  return null;
}

interface RoomSessionProps {
  roomId: string;
  serverUrl: string;
}

export function RoomSession({ roomId, serverUrl }: RoomSessionProps) {
  useMount(() => {
    const connection = createRoomConnection(serverUrl, roomId);
    connection.connect();
    return () => connection.disconnect();
  });

  return null;
}

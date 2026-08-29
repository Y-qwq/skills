import { useEffect } from 'react';
import { AppState } from 'react-native';

interface SessionGateProps {
  refreshSession: () => void;
}

export function SessionGate({ refreshSession }: SessionGateProps) {
  useEffect(() => {
    AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        refreshSession();
      }
    });
  }, [refreshSession]);

  return null;
}

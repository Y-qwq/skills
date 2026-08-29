import { useEffect } from 'react';
import type { EffectCallback } from 'react';

export function useMount(setup: EffectCallback) {
  useEffect(setup, []);
}

import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

function isStateOnline(state: NetInfoState): boolean {
  return Boolean(state.isConnected) && state.isInternetReachable !== false;
}

export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [lastOnline, setLastOnline] = useState<Date | null>(null);

  useEffect(() => {
    let active = true;

    void NetInfo.fetch().then((state) => {
      if (!active) return;
      const online = isStateOnline(state);
      setIsOnline(online);
      if (online) setLastOnline(new Date());
    });

    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = isStateOnline(state);
      setIsOnline(online);
      if (online) setLastOnline(new Date());
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return { isOnline, lastOnline };
}

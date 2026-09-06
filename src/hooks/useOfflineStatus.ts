import { useEffect, useState } from 'react';

import NetInfo from '@react-native-community/netinfo';

export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [lastOnline, setLastOnline] = useState<Date | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = !!(state.isConnected && state.isInternetReachable);
      setIsOnline(online);
      if (online) setLastOnline(new Date());
    });
    return unsubscribe;
  }, []);

  return { isOnline, lastOnline };
}

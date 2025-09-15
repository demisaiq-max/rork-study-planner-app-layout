import { useEffect, useState, useRef } from 'react';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { trpcClient } from '@/lib/trpc';

export function useClerkSupabaseSync() {
  const { user, isLoaded: userLoaded } = useUser();
  const { isSignedIn } = useAuth();
  const [hasSynced, setHasSynced] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<Error | null>(null);
  const lastSyncedUserIdRef = useRef<string | null>(null);
  
  useEffect(() => {
    // Reset sync status when user signs out
    if (!isSignedIn) {
      setHasSynced(false);
      setIsSyncing(false);
      setSyncError(null);
      lastSyncedUserIdRef.current = null;
      return;
    }

    // Only sync if user is loaded, signed in, and we have user data
    if (!userLoaded || !isSignedIn || !user || isSyncing) {
      return;
    }

    // Check if this is a new user (different from the last synced user)
    const isNewUser = lastSyncedUserIdRef.current !== user.id;
    
    // Don't sync again if already synced for this user
    if (hasSynced && !isNewUser) {
      return;
    }

    // Reset sync status for new user
    if (isNewUser) {
      setHasSynced(false);
      setSyncError(null);
    }

    // Perform sync
    const syncUser = async () => {
      try {
        setIsSyncing(true);
        setSyncError(null);
        
        const userData = {
          clerkUserId: user.id,
          email: user.primaryEmailAddress?.emailAddress || '',
          name: user.fullName || user.firstName || user.username || undefined,
          profilePictureUrl: user.imageUrl || undefined,
        };

        console.log('🔄 Syncing Clerk user to Supabase:', userData);
        
        const result = await trpcClient.users.syncClerkUser.mutate(userData);
        
        console.log('✅ User synced to Supabase:', result.created ? 'Created' : 'Updated');
        setHasSynced(true);
        lastSyncedUserIdRef.current = user.id;
      } catch (error) {
        console.error('❌ Failed to sync user to Supabase:', error);
        setSyncError(error instanceof Error ? error : new Error('Unknown sync error'));
        setHasSynced(false);
      } finally {
        setIsSyncing(false);
      }
    };

    syncUser();
  }, [userLoaded, isSignedIn, user?.id, hasSynced, isSyncing]);

  return {
    isSyncing,
    syncError,
    syncSuccess: hasSynced,
    isUserReady: (isSignedIn && hasSynced) || (!isSignedIn && userLoaded),
  };
}
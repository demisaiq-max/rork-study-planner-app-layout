import { useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { trpc } from '@/lib/trpc';

export function useClerkSupabaseSync() {
  const { user, isLoaded: userLoaded } = useUser();
  const { isSignedIn } = useAuth();
  
  const syncUserMutation = trpc.users.syncClerkUser.useMutation({
    onSuccess: (data) => {
      console.log('✅ User synced to Supabase:', data.created ? 'Created' : 'Updated');
    },
    onError: (error) => {
      console.error('❌ Failed to sync user to Supabase:', error);
    },
  });

  useEffect(() => {
    // Only sync if user is loaded, signed in, and we have user data
    if (!userLoaded || !isSignedIn || !user) {
      return;
    }

    // Prepare user data for sync
    const userData = {
      clerkUserId: user.id,
      email: user.primaryEmailAddress?.emailAddress || '',
      name: user.fullName || user.firstName || user.username || undefined,
      profilePictureUrl: user.imageUrl || undefined,
    };

    console.log('🔄 Syncing Clerk user to Supabase:', userData);

    // Sync user to Supabase
    syncUserMutation.mutate(userData);
  }, [userLoaded, isSignedIn, user?.id]); // Only re-run when these key values change

  return {
    isSyncing: syncUserMutation.isPending,
    syncError: syncUserMutation.error,
    syncSuccess: syncUserMutation.isSuccess,
  };
}
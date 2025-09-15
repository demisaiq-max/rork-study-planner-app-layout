import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { trpc } from '@/lib/trpc';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ClerkSyncTestScreen() {
  const insets = useSafeAreaInsets();
  const { user, isLoaded: userLoaded } = useUser();
  const { isSignedIn } = useAuth();
  
  // Manual sync mutation
  const syncUserMutation = trpc.users.syncClerkUser.useMutation({
    onSuccess: (data) => {
      console.log('✅ Manual sync successful:', data);
    },
    onError: (error) => {
      console.error('❌ Manual sync failed:', error);
    },
  });
  
  // Get user profile from Supabase
  const userProfileQuery = trpc.users.getUserProfile.useQuery(
    { userId: user?.id || '' },
    { 
      enabled: !!user?.id,
      retry: false,
    }
  );

  const handleManualSync = () => {
    if (!user) return;
    
    syncUserMutation.mutate({
      clerkUserId: user.id,
      email: user.primaryEmailAddress?.emailAddress || '',
      name: user.fullName || user.firstName || user.username || undefined,
      profilePictureUrl: user.imageUrl || undefined,
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.content, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.title}>Clerk-Supabase Sync Test</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Clerk User Status</Text>
          <View style={styles.infoBox}>
            <Text style={styles.label}>Loaded:</Text>
            <Text style={styles.value}>{userLoaded ? '✅ Yes' : '❌ No'}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.label}>Signed In:</Text>
            <Text style={styles.value}>{isSignedIn ? '✅ Yes' : '❌ No'}</Text>
          </View>
        </View>

        {user && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Clerk User Data</Text>
            <View style={styles.infoBox}>
              <Text style={styles.label}>ID:</Text>
              <Text style={styles.value}>{user.id}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{user.primaryEmailAddress?.emailAddress || 'N/A'}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.label}>Name:</Text>
              <Text style={styles.value}>
                {user.fullName || user.firstName || user.username || 'N/A'}
              </Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.label}>Image URL:</Text>
              <Text style={styles.value} numberOfLines={2}>
                {user.imageUrl || 'N/A'}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Supabase User Status</Text>
          {userProfileQuery.isLoading && (
            <ActivityIndicator size="small" color="#007AFF" />
          )}
          {userProfileQuery.error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>
                ❌ Error: {userProfileQuery.error.message}
              </Text>
            </View>
          )}
          {userProfileQuery.data && (
            <>
              <View style={styles.infoBox}>
                <Text style={styles.label}>ID:</Text>
                <Text style={styles.value}>{userProfileQuery.data.id}</Text>
              </View>
              <View style={styles.infoBox}>
                <Text style={styles.label}>Email:</Text>
                <Text style={styles.value}>{userProfileQuery.data.email}</Text>
              </View>
              <View style={styles.infoBox}>
                <Text style={styles.label}>Name:</Text>
                <Text style={styles.value}>{userProfileQuery.data.name || 'N/A'}</Text>
              </View>
              <View style={styles.infoBox}>
                <Text style={styles.label}>Profile Picture:</Text>
                <Text style={styles.value} numberOfLines={2}>
                  {userProfileQuery.data.profilePictureUrl || 'N/A'}
                </Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Manual Sync</Text>
          <TouchableOpacity 
            style={[styles.button, !user && styles.buttonDisabled]}
            onPress={handleManualSync}
            disabled={!user || syncUserMutation.isPending}
          >
            {syncUserMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sync User to Supabase</Text>
            )}
          </TouchableOpacity>
          
          {syncUserMutation.isSuccess && (
            <View style={styles.successBox}>
              <Text style={styles.successText}>
                ✅ Sync successful! User {syncUserMutation.data?.created ? 'created' : 'updated'} in Supabase.
              </Text>
            </View>
          )}
          
          {syncUserMutation.error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>
                ❌ Sync failed: {syncUserMutation.error.message}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={() => userProfileQuery.refetch()}
        >
          <Text style={styles.buttonText}>Refresh Supabase Data</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  infoBox: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    width: 120,
  },
  value: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  refreshButton: {
    backgroundColor: '#28a745',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  successBox: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  successText: {
    color: '#155724',
    fontSize: 14,
  },
  errorBox: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  errorText: {
    color: '#721c24',
    fontSize: 14,
  },
});
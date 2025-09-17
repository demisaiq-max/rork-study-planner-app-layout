import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '@/hooks/auth-context';
import { trpcClient } from '@/lib/trpc';
import { supabase } from '@/lib/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TestSyncScreen() {
  const { user, isLoading: authLoading } = useAuth();
  const insets = useSafeAreaInsets();
  const isSignedIn = !!user;
  const userLoaded = !authLoading;
  const [syncResult, setSyncResult] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbTestResult, setDbTestResult] = useState<any>(null);

  const testDatabaseConnection = async () => {
    try {
      console.log('🔍 Testing database connection...');
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (error) {
        console.error('❌ Database test failed:', error);
        setDbTestResult({ success: false, error: error.message });
      } else {
        console.log('✅ Database test successful');
        setDbTestResult({ success: true, data });
      }
    } catch (err: any) {
      console.error('❌ Database test error:', err);
      setDbTestResult({ success: false, error: err.message });
    }
  };

  const manualSync = async () => {
    if (!user) {
      setError('No user logged in');
      return;
    }

    setIsSyncing(true);
    setError(null);
    setSyncResult(null);

    try {
      const userData = {
        clerkUserId: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || user.email?.split('@')[0] || undefined,
        profilePictureUrl: user.user_metadata?.avatar_url || undefined,
      };

      console.log('📤 Sending sync request:', userData);

      const result = await trpcClient.users.syncClerkUser.mutate(userData);
      
      console.log('✅ Sync successful:', result);
      setSyncResult(result);
    } catch (err: any) {
      console.error('❌ Sync failed:', err);
      setError(err.message || 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const checkUserInDatabase = async () => {
    if (!user) {
      setError('No user logged in');
      return;
    }

    setIsSyncing(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Check user failed:', error);
        setError(error.message);
      } else if (data) {
        console.log('✅ User found in database:', data);
        setSyncResult({ userInDb: true, userData: data });
      } else {
        console.log('⚠️ User not found in database');
        setSyncResult({ userInDb: false });
      }
    } catch (err: any) {
      console.error('❌ Check user error:', err);
      setError(err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>Supabase User Sync Test</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Supabase User Info</Text>
            {userLoaded ? (
              isSignedIn && user ? (
                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>ID: {user.id}</Text>
                  <Text style={styles.infoText}>Email: {user.email}</Text>
                  <Text style={styles.infoText}>Name: {user.user_metadata?.name || user.email?.split('@')[0] || 'N/A'}</Text>
                </View>
              ) : (
                <Text style={styles.warningText}>Not signed in</Text>
              )
            ) : (
              <ActivityIndicator />
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Database Connection</Text>
            <TouchableOpacity 
              style={styles.button} 
              onPress={testDatabaseConnection}
              disabled={isSyncing || authLoading}
            >
              <Text style={styles.buttonText}>Test Database Connection</Text>
            </TouchableOpacity>
            {dbTestResult && (
              <View style={[styles.resultBox, dbTestResult.success ? styles.successBox : styles.errorBox]}>
                <Text style={styles.resultText}>
                  {dbTestResult.success ? '✅ Connected' : `❌ Failed: ${dbTestResult.error}`}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sync Actions</Text>
            
            <TouchableOpacity 
              style={[styles.button, (!user || isSyncing || authLoading) && styles.buttonDisabled]} 
              onPress={manualSync}
              disabled={!user || isSyncing || authLoading}
            >
              <Text style={styles.buttonText}>
                {isSyncing ? 'Syncing...' : 'Manual Sync User'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.buttonSecondary, (!user || isSyncing || authLoading) && styles.buttonDisabled]} 
              onPress={checkUserInDatabase}
              disabled={!user || isSyncing || authLoading}
            >
              <Text style={styles.buttonText}>Check User in Database</Text>
            </TouchableOpacity>
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>Error: {error}</Text>
            </View>
          )}

          {syncResult && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Result</Text>
              <View style={styles.resultBox}>
                <Text style={styles.resultText}>
                  {JSON.stringify(syncResult, null, 2)}
                </Text>
              </View>
            </View>
          )}

          {isSyncing && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#555',
  },
  infoBox: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  infoText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonSecondary: {
    backgroundColor: '#34C759',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultBox: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginTop: 10,
  },
  successBox: {
    borderColor: '#34C759',
    backgroundColor: '#f0fff4',
  },
  errorBox: {
    backgroundColor: '#ffebee',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff3b30',
    marginBottom: 20,
  },
  resultText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'monospace',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 14,
  },
  warningText: {
    color: '#ff9500',
    fontSize: 14,
  },
  loadingContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
});
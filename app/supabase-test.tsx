import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { trpc } from '@/lib/trpc';

type ConnectionStatus = {
  server: 'checking' | 'connected' | 'failed';
  supabase: 'checking' | 'connected' | 'failed';
  trpc: 'checking' | 'connected' | 'failed';
};

export default function SupabaseTestScreen() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    server: 'checking',
    supabase: 'checking',
    trpc: 'checking'
  });
  
  const [debugInfo, setDebugInfo] = useState<{
    server?: any;
    serverError?: string;
    networkInfo?: any;
    networkTest?: string;
  }>({});
  
  // Debug tRPC availability
  useEffect(() => {
    console.log('🔍 Debugging tRPC availability:');
    console.log('trpc object:', trpc);
    console.log('trpc.tests:', trpc.tests);
    console.log('trpc.tests.supabaseTest:', trpc.tests?.supabaseTest);
    console.log('trpc.tests.supabaseTest.useQuery:', trpc.tests?.supabaseTest?.useQuery);
    console.log('typeof trpc.tests.supabaseTest.useQuery:', typeof trpc.tests?.supabaseTest?.useQuery);
  }, []);
  
  // Test basic server connection
  useEffect(() => {
    const testServerConnection = async () => {
      try {
        const baseUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL || 'https://7twaok3a9gdls7o4bz61l.rork.com';
        
        console.log('🔍 Testing server connection to:', baseUrl);
        
        // First test basic connectivity
        const healthResponse = await fetch(`${baseUrl}/api/`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
        
        if (!healthResponse.ok) {
          throw new Error(`Server returned ${healthResponse.status}: ${healthResponse.statusText}`);
        }
        
        const healthData = await healthResponse.json();
        console.log('✅ Server health response:', healthData);
        
        // Then test debug endpoint
        const debugResponse = await fetch(`${baseUrl}/api/debug`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
        
        const debugData = await debugResponse.json();
        console.log('✅ Server debug response:', debugData);
        
        setDebugInfo((prev) => ({ 
          ...prev, 
          server: { health: healthData, debug: debugData },
          networkTest: 'Server is reachable'
        }));
        setConnectionStatus((prev) => ({ ...prev, server: 'connected' }));
      } catch (error) {
        console.error('❌ Server connection failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // Additional network diagnostics
        const networkInfo = {
          error: errorMessage,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent || 'Unknown',
          online: navigator.onLine !== undefined ? navigator.onLine : 'Unknown'
        };
        
        console.log('🔍 Network diagnostics:', networkInfo);
        
        setDebugInfo((prev) => ({ 
          ...prev, 
          serverError: errorMessage,
          networkInfo
        }));
        setConnectionStatus((prev) => ({ ...prev, server: 'failed' }));
      }
    };
    
    testServerConnection();
  }, []);
  
  // Safely call the query with error handling
  let supabaseTest: any = { isLoading: true, data: null, error: null, refetch: () => {} };
  
  try {
    if (trpc && trpc.tests && trpc.tests.supabaseTest && typeof trpc.tests.supabaseTest.useQuery === 'function') {
      supabaseTest = trpc.tests.supabaseTest.useQuery();
    } else {
      console.error('❌ tRPC tests.supabaseTest.useQuery is not available');
      supabaseTest = {
        isLoading: false,
        data: null,
        error: new Error('tRPC tests.supabaseTest.useQuery is not a function'),
        refetch: () => {}
      };
    }
  } catch (error) {
    console.error('❌ Error calling supabaseTest.useQuery:', error);
    supabaseTest = {
      isLoading: false,
      data: null,
      error,
      refetch: () => {}
    };
  }
  
  // Handle supabase test results
  React.useEffect(() => {
    if (supabaseTest.data) {
      console.log('✅ Supabase test successful:', supabaseTest.data);
      setConnectionStatus((prev) => ({ ...prev, supabase: 'connected', trpc: 'connected' }));
    }
    if (supabaseTest.error) {
      console.error('❌ Supabase test failed:', supabaseTest.error);
      setConnectionStatus((prev) => ({ ...prev, supabase: 'failed', trpc: 'failed' }));
    }
  }, [supabaseTest.data, supabaseTest.error]);
  
  const latestTestResults = trpc.tests.getLatestTestResults.useQuery('550e8400-e29b-41d4-a716-446655440000', {
    enabled: connectionStatus.trpc === 'connected'
  });
  
  const communityPosts = trpc.community.posts.getPosts.useQuery({}, {
    enabled: connectionStatus.trpc === 'connected'
  });
  
  const communityGroups = trpc.community.groups.getGroups.useQuery({}, {
    enabled: connectionStatus.trpc === 'connected'
  });
  
  const communityQuestions = trpc.community.questions.getQuestions.useQuery({}, {
    enabled: connectionStatus.trpc === 'connected'
  });

  const refetchAll = () => {
    console.log('🔄 Refetching all queries...');
    supabaseTest.refetch();
    latestTestResults.refetch();
    communityPosts.refetch();
    communityGroups.refetch();
    communityQuestions.refetch();
  };
  
  const testDirectConnection = async () => {
    try {
      const baseUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL || 'https://7twaok3a9gdls7o4bz61l.rork.com';
      
      console.log('🔍 Testing direct API connection to:', `${baseUrl}/api/`);
      
      // Test main API endpoint
      const response = await fetch(`${baseUrl}/api/`);
      const data = await response.json();
      
      console.log('✅ Direct API response:', data);
      
      // Test Supabase endpoint
      const supabaseResponse = await fetch(`${baseUrl}/api/test-supabase`);
      const supabaseData = await supabaseResponse.json();
      
      console.log('✅ Direct Supabase test response:', supabaseData);
      
      Alert.alert(
        'Direct API Test', 
        `API Status: ${data.status}\n` +
        `Supabase: ${supabaseData.status}\n` +
        `Message: ${supabaseData.message || data.message}`
      );
    } catch (error) {
      console.error('❌ Direct API test failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Direct API Test Failed', errorMessage);
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return '#28a745';
      case 'failed': return '#dc3545';
      default: return '#ffc107';
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return '✅ Connected';
      case 'failed': return '❌ Failed';
      default: return '🔄 Checking...';
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Database Connection Test' }} />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.refreshButton} onPress={refetchAll}>
            <Text style={styles.refreshButtonText}>Refresh All Tests</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.testButton} onPress={testDirectConnection}>
            <Text style={styles.testButtonText}>Test Direct API</Text>
          </TouchableOpacity>
        </View>
        
        {/* Connection Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connection Status</Text>
          
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Server:</Text>
            <Text style={[styles.statusValue, { color: getStatusColor(connectionStatus.server) }]}>
              {getStatusText(connectionStatus.server)}
            </Text>
          </View>
          
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>tRPC:</Text>
            <Text style={[styles.statusValue, { color: getStatusColor(connectionStatus.trpc) }]}>
              {getStatusText(connectionStatus.trpc)}
            </Text>
          </View>
          
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Supabase:</Text>
            <Text style={[styles.statusValue, { color: getStatusColor(connectionStatus.supabase) }]}>
              {getStatusText(connectionStatus.supabase)}
            </Text>
          </View>
        </View>

        {/* Supabase Connection Test */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Supabase Connection Test</Text>
          {supabaseTest.isLoading && <Text style={styles.loading}>Loading...</Text>}
          {supabaseTest.error && (
            <Text style={styles.error}>Error: {supabaseTest.error.message}</Text>
          )}
          {supabaseTest.data && (
            <View>
              <Text style={styles.success}>
                Status: {supabaseTest.data.success ? 'Connected ✅' : 'Failed ❌'}
              </Text>
              {supabaseTest.data.success && (
                <View style={styles.tableInfo}>
                  <Text style={styles.tableTitle}>Table Counts:</Text>
                  {Object.entries(supabaseTest.data.tables).map(([table, count]) => (
                    <Text key={table} style={styles.tableRow}>
                      {table}: {String(count)} records
                    </Text>
                  ))}
                </View>
              )}
              {supabaseTest.data.error && (
                <Text style={styles.error}>Error: {supabaseTest.data.error}</Text>
              )}
            </View>
          )}
        </View>

        {/* Test Results Test */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latest Test Results</Text>
          {latestTestResults.isLoading && <Text style={styles.loading}>Loading...</Text>}
          {latestTestResults.error && (
            <Text style={styles.error}>Error: {latestTestResults.error.message}</Text>
          )}
          {latestTestResults.data && (
            <Text style={styles.success}>
              Found {latestTestResults.data.length} test results ✅
            </Text>
          )}
        </View>

        {/* Community Posts Test */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Community Posts</Text>
          {communityPosts.isLoading && <Text style={styles.loading}>Loading...</Text>}
          {communityPosts.error && (
            <Text style={styles.error}>Error: {communityPosts.error.message}</Text>
          )}
          {communityPosts.data && (
            <Text style={styles.success}>
              Found {communityPosts.data.length} posts ✅
            </Text>
          )}
        </View>

        {/* Community Groups Test */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Community Groups</Text>
          {communityGroups.isLoading && <Text style={styles.loading}>Loading...</Text>}
          {communityGroups.error && (
            <Text style={styles.error}>Error: {communityGroups.error.message}</Text>
          )}
          {communityGroups.data && (
            <Text style={styles.success}>
              Found {communityGroups.data.length} groups ✅
            </Text>
          )}
        </View>

        {/* Community Questions Test */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Community Questions</Text>
          {communityQuestions.isLoading && <Text style={styles.loading}>Loading...</Text>}
          {communityQuestions.error && (
            <Text style={styles.error}>Error: {communityQuestions.error.message}</Text>
          )}
          {communityQuestions.data && (
            <Text style={styles.success}>
              Found {communityQuestions.data.length} questions ✅
            </Text>
          )}
        </View>

        <View style={styles.debugSection}>
          <Text style={styles.sectionTitle}>Debug Info</Text>
          <Text style={styles.debugText}>
            User ID: 550e8400-e29b-41d4-a716-446655440000
          </Text>
          <Text style={styles.debugText}>
            Supabase URL: {process.env.EXPO_PUBLIC_SUPABASE_URL || 'Not configured'}
          </Text>
          <Text style={styles.debugText}>
            API Base URL: {process.env.EXPO_PUBLIC_RORK_API_BASE_URL || 'Not configured'}
          </Text>
          
          {debugInfo.server && (
            <View style={styles.debugData}>
              <Text style={styles.debugTitle}>Server Response:</Text>
              <Text style={styles.debugJson}>
                {JSON.stringify(debugInfo.server, null, 2)}
              </Text>
            </View>
          )}
          
          {debugInfo.serverError && (
            <View style={styles.debugData}>
              <Text style={styles.debugTitle}>Server Error:</Text>
              <Text style={styles.errorText}>
                {debugInfo.serverError}
              </Text>
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
    padding: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  testButton: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
  },
  testButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  debugData: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
  },
  debugTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  debugJson: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#666',
  },
  errorText: {
    fontSize: 12,
    color: '#dc3545',
    fontFamily: 'monospace',
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  loading: {
    color: '#666',
    fontStyle: 'italic',
  },
  success: {
    color: '#28a745',
    fontWeight: '500',
  },
  error: {
    color: '#dc3545',
    fontWeight: '500',
  },
  tableInfo: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
  },
  tableTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tableRow: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  debugSection: {
    backgroundColor: '#e9ecef',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  debugText: {
    fontSize: 12,
    color: '#6c757d',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
});
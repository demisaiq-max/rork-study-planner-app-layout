import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { trpc } from '@/lib/trpc';

export default function TRPCDebugScreen() {
  const [debugInfo, setDebugInfo] = React.useState<any>({});

  useEffect(() => {
    console.log('🔍 === TRPC DEBUG START ===');
    
    // Check if trpc is available
    console.log('1. trpc object exists:', !!trpc);
    console.log('2. trpc type:', typeof trpc);
    console.log('3. trpc keys:', Object.keys(trpc));
    
    // Check specific namespaces
    console.log('4. trpc.tests exists:', !!trpc.tests);
    console.log('5. trpc.tests type:', typeof trpc.tests);
    
    if (trpc.tests) {
      console.log('6. trpc.tests keys:', Object.keys(trpc.tests));
      console.log('7. trpc.tests.supabaseTest exists:', !!trpc.tests.supabaseTest);
      
      if (trpc.tests.supabaseTest) {
        console.log('8. trpc.tests.supabaseTest type:', typeof trpc.tests.supabaseTest);
        console.log('9. trpc.tests.supabaseTest keys:', Object.keys(trpc.tests.supabaseTest));
        console.log('10. trpc.tests.supabaseTest.useQuery exists:', !!trpc.tests.supabaseTest.useQuery);
        console.log('11. trpc.tests.supabaseTest.useQuery type:', typeof trpc.tests.supabaseTest.useQuery);
      }
    }
    
    // Check other namespaces
    console.log('12. trpc.example exists:', !!trpc.example);
    if (trpc.example) {
      console.log('13. trpc.example keys:', Object.keys(trpc.example));
      console.log('14. trpc.example.debug exists:', !!trpc.example.debug);
      if (trpc.example.debug) {
        console.log('15. trpc.example.debug.useQuery type:', typeof trpc.example.debug?.useQuery);
      }
    }
    
    console.log('🔍 === TRPC DEBUG END ===');
    
    // Store debug info for display
    setDebugInfo({
      trpcExists: !!trpc,
      trpcType: typeof trpc,
      trpcKeys: Object.keys(trpc),
      testsExists: !!trpc.tests,
      testsKeys: trpc.tests ? Object.keys(trpc.tests) : [],
      exampleExists: !!trpc.example,
      exampleKeys: trpc.example ? Object.keys(trpc.example) : [],
    });
  }, []);

  // Try to call the debug procedure if it exists
  let debugQuery: any = { isLoading: false, data: null, error: null };
  
  try {
    if (trpc?.example?.debug?.useQuery && typeof trpc.example.debug.useQuery === 'function') {
      debugQuery = trpc.example.debug.useQuery();
    }
  } catch (error) {
    console.error('Error calling debug query:', error);
    debugQuery = { isLoading: false, data: null, error };
  }

  const testDirectAPI = async () => {
    try {
      const baseUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL || 'https://7twaok3a9gdls7o4bz61l.rork.com';
      console.log('Testing direct tRPC call to:', `${baseUrl}/api/trpc/example.debug`);
      
      const response = await fetch(`${baseUrl}/api/trpc/example.debug`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.text();
      console.log('Direct API response:', data);
      
      try {
        const parsed = JSON.parse(data);
        console.log('Parsed response:', parsed);
      } catch (e) {
        console.log('Response is not JSON:', data);
      }
    } catch (error) {
      console.error('Direct API test failed:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'tRPC Debug' }} />
      
      <ScrollView style={styles.scrollView}>
        <TouchableOpacity style={styles.button} onPress={testDirectAPI}>
          <Text style={styles.buttonText}>Test Direct tRPC API</Text>
        </TouchableOpacity>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>tRPC Client Debug Info</Text>
          
          <Text style={styles.debugText}>
            tRPC Exists: {debugInfo.trpcExists ? '✅' : '❌'}
          </Text>
          
          <Text style={styles.debugText}>
            tRPC Type: {debugInfo.trpcType}
          </Text>
          
          <Text style={styles.debugText}>
            tRPC Keys: {JSON.stringify(debugInfo.trpcKeys, null, 2)}
          </Text>
          
          <Text style={styles.debugText}>
            Tests Namespace Exists: {debugInfo.testsExists ? '✅' : '❌'}
          </Text>
          
          <Text style={styles.debugText}>
            Tests Keys: {JSON.stringify(debugInfo.testsKeys, null, 2)}
          </Text>
          
          <Text style={styles.debugText}>
            Example Namespace Exists: {debugInfo.exampleExists ? '✅' : '❌'}
          </Text>
          
          <Text style={styles.debugText}>
            Example Keys: {JSON.stringify(debugInfo.exampleKeys, null, 2)}
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Debug Query Result</Text>
          
          {debugQuery.isLoading && <Text>Loading...</Text>}
          {debugQuery.error && (
            <Text style={styles.error}>
              Error: {debugQuery.error?.message || String(debugQuery.error)}
            </Text>
          )}
          {debugQuery.data && (
            <Text style={styles.success}>
              {JSON.stringify(debugQuery.data, null, 2)}
            </Text>
          )}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Environment</Text>
          
          <Text style={styles.debugText}>
            API Base URL: {process.env.EXPO_PUBLIC_RORK_API_BASE_URL || 'Not set'}
          </Text>
          
          <Text style={styles.debugText}>
            Supabase URL: {process.env.EXPO_PUBLIC_SUPABASE_URL || 'Not set'}
          </Text>
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
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
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
  debugText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  error: {
    color: '#dc3545',
    fontWeight: '500',
  },
  success: {
    color: '#28a745',
    fontWeight: '500',
    fontSize: 12,
    fontFamily: 'monospace',
  },
});
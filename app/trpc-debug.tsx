import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { trpc, formatTRPCError, trpcClient } from '@/lib/trpc';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message?: string;
  data?: any;
  duration?: number;
}

export default function TRPCDebugScreen() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);

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

  const updateTestResult = (name: string, result: Partial<TestResult>) => {
    setTestResults(prev => {
      const existing = prev.find(r => r.name === name);
      if (existing) {
        return prev.map(r => r.name === name ? { ...r, ...result } : r);
      } else {
        return [...prev, { name, status: 'pending', ...result }];
      }
    });
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    const tests = [
      {
        name: 'Backend Health Check',
        test: async () => {
          const baseUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL || 'https://7twaok3a9gdls7o4bz61l.rork.com';
          const response = await fetch(`${baseUrl}/api`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
          });
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return await response.json();
        }
      },
      {
        name: 'tRPC Example Hi',
        test: async () => {
          const result = await trpcClient.example.hi.mutate({ name: 'Debug Test' });
          return result;
        }
      },
      {
        name: 'tRPC Example Debug',
        test: async () => {
          const result = await trpcClient.example.debug.query();
          return result;
        }
      },
      {
        name: 'Supabase Test',
        test: async () => {
          const result = await trpcClient.tests.supabaseTest.query();
          return result;
        }
      },
    ];

    for (const { name, test } of tests) {
      updateTestResult(name, { status: 'pending' });
      
      try {
        const startTime = Date.now();
        const result = await test();
        const duration = Date.now() - startTime;
        
        updateTestResult(name, {
          status: 'success',
          message: 'Success',
          data: result,
          duration
        });
      } catch (error) {
        const duration = Date.now();
        const errorMessage = formatTRPCError(error);
        
        updateTestResult(name, {
          status: 'error',
          message: errorMessage,
          data: error,
          duration
        });
      }
      
      // Small delay between tests
      await new Promise((resolve: (value: unknown) => void) => setTimeout(resolve, 500));
    }

    setIsRunning(false);
  };

  const testDirectAPI = async () => {
    try {
      const baseUrl = process.env.EXPO_PUBLIC_RORK_API_BASE_URL || 'https://7twaok3a9gdls7o4bz61l.rork.com';
      console.log('Testing direct API health check:', `${baseUrl}/api`);
      
      const response = await fetch(`${baseUrl}/api`, {
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
        console.log('API Test Success:', parsed);
      } catch (e) {
        console.log('Response is not JSON:', data);
        console.log('API Test Result (not JSON):', data.substring(0, 500));
      }
    } catch (error) {
      console.error('Direct API test failed:', error);
      console.error('API Test Failed:', error instanceof Error ? error.message : String(error));
    }
  };

  const showTestDetails = (result: TestResult) => {
    const details = JSON.stringify(result.data, null, 2);
    console.log(`${result.name} Details:`, details);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'tRPC Debug' }} />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, isRunning && styles.disabledButton]} 
            onPress={runAllTests}
            disabled={isRunning}
          >
            <Text style={styles.buttonText}>
              {isRunning ? 'Running Tests...' : 'Run All Tests'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={testDirectAPI}>
            <Text style={styles.secondaryButtonText}>Test Direct API</Text>
          </TouchableOpacity>
        </View>
        
        {testResults.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Test Results</Text>
            {testResults.map((result) => (
              <TouchableOpacity 
                key={result.name} 
                style={[
                  styles.testResult,
                  result.status === 'success' && styles.successResult,
                  result.status === 'error' && styles.errorResult,
                  result.status === 'pending' && styles.pendingResult,
                ]}
                onPress={() => showTestDetails(result)}
              >
                <View style={styles.testHeader}>
                  <Text style={styles.testName}>{result.name}</Text>
                  <Text style={styles.testStatus}>
                    {result.status === 'pending' ? '⏳' : result.status === 'success' ? '✅' : '❌'}
                  </Text>
                </View>
                {result.message && (
                  <Text style={[
                    styles.testMessage,
                    result.status === 'error' && styles.errorMessage
                  ]}>
                    {result.message}
                  </Text>
                )}
                {result.duration && (
                  <Text style={styles.testDuration}>{result.duration}ms</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
        
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
    </SafeAreaView>
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
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  testResult: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  successResult: {
    backgroundColor: '#f1f8e9',
    borderColor: '#4CAF50',
  },
  errorResult: {
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
  },
  pendingResult: {
    backgroundColor: '#fff3e0',
    borderColor: '#ff9800',
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  testName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  testStatus: {
    fontSize: 16,
  },
  testMessage: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  errorMessage: {
    color: '#d32f2f',
  },
  testDuration: {
    fontSize: 10,
    color: '#999',
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
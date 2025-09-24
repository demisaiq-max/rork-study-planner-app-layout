import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { trpc } from '@/lib/trpc';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function AnswerKeyCategories() {
  const list = trpc.answerKeys.getCategories.useQuery();
  const create = trpc.answerKeys.createCategory.useMutation();

  const [name, setName] = useState<string>('');
  const [color, setColor] = useState<string>('#007AFF');

  const onCreate = async () => {
    try {
      await create.mutateAsync({ name: name.trim(), color });
      setName('');
      list.refetch();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to create category');
    }
  };

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Categories', headerShown: true }} />

        <View style={styles.row}>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Category name" />
          <TextInput style={[styles.input, { width: 110 }]} value={color} onChangeText={setColor} placeholder="#RRGGBB" />
          <TouchableOpacity style={styles.primary} onPress={onCreate} disabled={create.isPending}>
            {create.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Add</Text>}
          </TouchableOpacity>
        </View>

        {list.isLoading ? (
          <View style={styles.center}><ActivityIndicator /></View>
        ) : list.error ? (
          <View style={styles.center}><Text style={{ color: '#B91C1C' }}>{String(list.error.message)}</Text></View>
        ) : (
          <FlatList
            data={(list.data as any[]) ?? []}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => (
              <View style={styles.item}>
                <View style={[styles.swatch, { backgroundColor: item.color || '#CBD5E1' }]} />
                <Text style={styles.name}>{item.name}</Text>
              </View>
            )}
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        )}
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  row: { flexDirection: 'row', gap: 8, padding: 12 },
  input: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  primary: { backgroundColor: '#111827', paddingHorizontal: 16, justifyContent: 'center', borderRadius: 10 },
  primaryText: { color: '#fff', fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  item: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, marginHorizontal: 12, marginVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 10 },
  swatch: { width: 18, height: 18, borderRadius: 4 },
  name: { color: '#111827', fontWeight: '600' },
});

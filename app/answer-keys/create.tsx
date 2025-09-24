import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { trpc } from '@/lib/trpc';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useAuth } from '@/hooks/auth-context';
import { useLanguage } from '@/hooks/language-context';

export default function CreateAnswerKey() {
  const { isLoading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [templateName, setTemplateName] = useState<string>('');
  const [subject, setSubject] = useState<'korean' | 'mathematics' | 'english' | 'others'>('mathematics');
  const [testType, setTestType] = useState<'mock' | 'midterm' | 'final'>('mock');
  const [mcq, setMcq] = useState<string>('20');
  const [textQ, setTextQ] = useState<string>('0');
  const [desc, setDesc] = useState<string>('');
  
  

  const total = useMemo(() => Number(mcq || '0') + Number(textQ || '0'), [mcq, textQ]);
  const createMutation = trpc.answerKeys.createAnswerKey.useMutation();

  const onCreate = async () => {
    try {
      const res = await createMutation.mutateAsync({
        templateName: templateName.trim(),
        subject,
        testType,
        totalQuestions: total,
        mcqQuestions: Number(mcq || '0'),
        textQuestions: Number(textQ || '0'),
        description: desc.trim() || undefined,
        isActive: true,
        
      });
      router.replace(`/answer-keys/${res.id}` as any);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to create');
    }
  };

  // Unified Subject Management: load user's subjects so key management stays in sync
    const { user } = useAuth();
    const subjectsQuery = trpc.tests.getUserSubjects.useQuery(
      { userId: String((user as any)?.id ?? '') },
      { enabled: !!(user as any)?.id }
    );
    const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

    const mapNameToSubjectEnum = (name: string): 'korean' | 'mathematics' | 'english' | 'others' => {
      const n = name.toLowerCase();
      if (n.includes('국어') || n.includes('korean')) return 'korean';
      if (n.includes('수학') || n.includes('math')) return 'mathematics';
      if (n.includes('영어') || n.includes('english')) return 'english';
      return 'others';
    };

    const subjects = (subjectsQuery.data as Array<{ id: string; name: string; color?: string }> | undefined) ?? [];

    return (
    <ErrorBoundary>
      <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.container}>
        <Stack.Screen options={{ title: t('newAnswerKeyTitle'), headerShown: true }} />
        <Text style={styles.label}>{t('templateName')}</Text>
        <TextInput value={templateName} onChangeText={setTemplateName} placeholder={t('templateNamePlaceholder')} style={styles.input} placeholderTextColor="#8E8E93" testID="template-name" />

        <Text style={styles.label}>{t('subjectLabel')}</Text>
        {subjectsQuery.isLoading ? (
          <View style={styles.chipsWrap}><ActivityIndicator /></View>
        ) : subjectsQuery.error ? (
          <Text style={styles.error}>{t('failedToLoad')}</Text>
        ) : (
          <View style={styles.row}>
            {subjects.map((s) => {
              const active = selectedSubjectId === s.id;
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.chip, active && styles.chipActive, { borderColor: s.color ?? '#E5E7EB' }]}
                  onPress={() => {
                    setSelectedSubjectId(s.id);
                    setSubject(mapNameToSubjectEnum(s.name));
                  }}
                  testID={`subject-${s.id}`}
                >
                  <View style={[styles.catDot, { backgroundColor: s.color ?? '#CBD5E1' }]} />
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{s.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <Text style={styles.label}>{t('answerKeyTestType')}</Text>
        <View style={styles.row}>
          {(['mock','midterm','final'] as const).map(s => (
            <TouchableOpacity key={s} style={[styles.chip, testType === s && styles.chipActive]} onPress={() => setTestType(s)} testID={`type-${s}`}>
              <Text style={[styles.chipText, testType === s && styles.chipTextActive]}>{t(s)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>{t('questions')}</Text>
        <View style={styles.split}>
          <View style={styles.flex1}>
            <Text style={styles.sublabel}>{t('mcq')}</Text>
            <TextInput value={mcq} onChangeText={setMcq} keyboardType="number-pad" style={styles.input} testID="mcq-count" />
          </View>
          <View style={styles.spacer} />
          <View style={styles.flex1}>
            <Text style={styles.sublabel}>{t('textQuestion')}</Text>
            <TextInput value={textQ} onChangeText={setTextQ} keyboardType="number-pad" style={styles.input} testID="text-count" />
          </View>
        </View>
        <Text style={styles.total}>{t('total')}: {total}</Text>

        <Text style={styles.label}>{t('description')}</Text>
        <TextInput value={desc} onChangeText={setDesc} placeholder={t('optional')} style={[styles.input, { height: 90 }]} multiline placeholderTextColor="#8E8E93" />

        <TouchableOpacity style={styles.primary} onPress={onCreate} disabled={createMutation.isPending || !selectedSubjectId} testID="create-submit">
          {createMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{t('create')}</Text>}
        </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#F2F2F7' },
  label: { marginTop: 12, marginBottom: 6, fontWeight: '700', color: '#111827' },
  sublabel: { marginBottom: 6, color: '#374151' },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, color: '#111827' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  split: { flexDirection: 'row', alignItems: 'flex-start' },
  flex1: { flex: 1 },
  spacer: { width: 12 },
  total: { marginTop: 8, color: '#6B7280' },
  chip: { backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipActive: { backgroundColor: '#DBEAFE', borderColor: '#3B82F6' },
  chipText: { color: '#374151' },
  chipTextActive: { color: '#1D4ED8', fontWeight: '700' },
  catDot: { width: 10, height: 10, borderRadius: 5 },
  primary: { backgroundColor: '#007AFF', marginTop: 16, paddingVertical: 14, alignItems: 'center', borderRadius: 12 },
  primaryText: { color: '#fff', fontWeight: '700' },
  chipsWrap: { paddingVertical: 8 },
  error: { color: '#B91C1C' },
});

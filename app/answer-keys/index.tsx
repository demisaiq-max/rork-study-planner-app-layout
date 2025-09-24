import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/auth-context';
import { useUser } from '@/hooks/user-context';
import { Plus, Lock, KeyRound } from 'lucide-react-native';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useLanguage } from '@/hooks/language-context';

interface AnswerKeySummary {
  id: string;
  template_name: string;
  subject: 'korean' | 'mathematics' | 'english' | 'others';
  test_type: 'mock' | 'midterm' | 'final';
  total_questions: number;
  mcq_questions: number;
  text_questions: number;
  created_at?: string | null;
}

type UserSubject = { id: string; name: string; color?: string | null };


export default function AnswerKeysHome() {
  const { user: authUser, isLoading: authLoading } = useAuth();
  const { user } = useUser();
  const { t } = useLanguage();
  const [search, setSearch] = useState<string>('');
  const query = trpc.answerKeys.getAnswerKeys.useQuery({ includeStats: true, search, limit: 50 }, { enabled: !authLoading });

  // Use auth user ID for consistency with backend
  const userId = authUser?.id || user?.id || null;
  
  // Load unified subjects for current user
  const subjectsQuery = trpc.tests.getUserSubjects.useQuery(
    { userId },
    { enabled: true }
  );
  const subjects: UserSubject[] = (subjectsQuery.data as UserSubject[] | undefined) ?? [];

  const isAdmin = useMemo(() => {
    return !!(authUser || user);
  }, [authUser, user]);

  const subjectDisplay = useCallback((subjectEnum: AnswerKeySummary['subject']): { name: string; color: string } => {
    const lower = (s: string) => s.toLowerCase();
    const findByIncludes = (needles: string[]) =>
      subjects.find(s => {
        const n = lower(s.name);
        return needles.some(nd => n.includes(nd));
      });

    let match: UserSubject | undefined;
    if (subjectEnum === 'korean') match = findByIncludes(['국어','korean']);
    else if (subjectEnum === 'mathematics') match = findByIncludes(['수학','math']);
    else if (subjectEnum === 'english') match = findByIncludes(['영어','english']);
    else match = undefined;

    const defaultNames: Record<AnswerKeySummary['subject'], string> = {
      korean: t('korean'),
      mathematics: t('mathematics'),
      english: t('english'),
      others: t('others'),
    };

    return { name: match?.name ?? defaultNames[subjectEnum], color: (match?.color as string) ?? '#EEF2FF' };
  }, [subjects, t]);

  const renderItem = useCallback(({ item }: { item: AnswerKeySummary }) => {
    const disp = subjectDisplay(item.subject);
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/answer-keys/${item.id}` as any)}
        testID={`answer-key-${item.id}`}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.template_name}</Text>
          <View style={[styles.badgeWrap, { backgroundColor: disp.color + '22', borderColor: disp.color }]}> 
            <Text style={styles.badgeText}>{disp.name}</Text>
          </View>
        </View>
        <View style={styles.cardRow}>
          <Text style={styles.meta}>{t(item.test_type)}</Text>
          <Text style={styles.meta}>{item.total_questions} {t('qsShort')} • {item.mcq_questions} {t('mcq')} • {item.text_questions} {t('textQuestion')}</Text>
        </View>
      </TouchableOpacity>
    );
  }, [subjectDisplay, t]);

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Stack.Screen options={{ title: t('answerKeys'), headerShown: true }} />

        <View style={styles.toolbar}>
          <View style={styles.searchWrap}>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={t('searchTemplates')}
              placeholderTextColor="#8E8E93"
              style={styles.searchInput}
              testID="search-input"
            />
          </View>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/answer-keys/create' as any)} testID="create-button">
            <Plus color="#fff" size={18} />
          </TouchableOpacity>
        </View>

        {query.isLoading || subjectsQuery.isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator />
          </View>
        ) : query.error ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{String(query.error.message ?? 'Failed to load')}</Text>
          </View>
        ) : subjectsQuery.error ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{t('failedToLoad')}</Text>
          </View>
        ) : (
          <FlatList
            data={(query.data as AnswerKeySummary[]) ?? []}
            renderItem={renderItem}
            keyExtractor={(i) => i.id}
            contentContainerStyle={styles.listContent}
          />
        )}

        {!isAdmin && (
          <View style={styles.adminHint}>
            <Lock size={14} color="#6B7280" />
            <Text style={styles.adminHintText}>{t('adminOnlyCreationHint')}</Text>
          </View>
        )}

        {Platform.OS !== 'web' && (
          <TouchableOpacity style={styles.fab} onPress={() => router.push('/answer-keys/create' as any)} testID="fab-create">
            <KeyRound color="#fff" size={22} />
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  toolbar: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  searchWrap: { flex: 1 },
  searchInput: { backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#E5E7EB', color: '#111827' },
  iconButton: { backgroundColor: '#007AFF', padding: 12, borderRadius: 10 },
  listContent: { paddingHorizontal: 16, paddingBottom: 80 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginVertical: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  badgeWrap: { backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: '#EEF2FF' },
  badgeText: { color: '#111827', fontSize: 12 },
  cardRow: { marginTop: 6, flexDirection: 'row', justifyContent: 'space-between' },
  meta: { color: '#6B7280', fontSize: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#B91C1C' },
  adminHint: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 12, justifyContent: 'center' },
  adminHintText: { color: '#6B7280' },
  fab: { position: 'absolute', right: 20, bottom: 24, backgroundColor: '#007AFF', padding: 16, borderRadius: 28, elevation: 3 },
});

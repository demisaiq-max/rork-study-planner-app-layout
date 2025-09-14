import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Animated,
  Alert,
  Modal,
  Platform,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Play, Pause, RotateCcw, Clock, Plus, Minus, Coffee, UtensilsCrossed } from "lucide-react-native";
import CircularProgress from "@/components/CircularProgress";
import { useStudyStore } from "@/hooks/study-store";
import { useLanguage } from "@/hooks/language-context";
import { useUser } from "@/hooks/user-context";
import { trpc } from "@/lib/trpc";

type TimerType = 'general' | 'tea' | 'lunch';

export default function TimerScreen() {
  const { width } = Dimensions.get("window");
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TimerType>('general');
  const [timeElapsed, setTimeElapsed] = useState(0); // For general timer (stopwatch)
  const [timeLeft, setTimeLeft] = useState(15 * 60); // For tea/lunch breaks
  const [initialTime, setInitialTime] = useState(15 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [tempHours, setTempHours] = useState(0);
  const [tempMinutes, setTempMinutes] = useState(15);
  const [tempSeconds, setTempSeconds] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const { updateStudyTime } = useStudyStore();
  const { t } = useLanguage();
  const { user } = useUser();
  
  // tRPC mutations for timer operations
  const createTimerSession = trpc.timers.createTimerSession.useMutation();
  const updateTimerSession = trpc.timers.updateTimerSession.useMutation();
  const createPauseLog = trpc.timers.createPauseLog.useMutation();
  
  // Query for active timer
  const { data: activeTimer } = trpc.timers.getActiveTimer.useQuery(
    { userId: user?.id || '550e8400-e29b-41d4-a716-446655440000' },
    { 
      enabled: !!user?.id,
      refetchInterval: false,
    }
  );
  
  // Query for timer sessions history
  const { data: timerSessions, refetch: refetchSessions } = trpc.timers.getTimerSessions.useQuery(
    { 
      userId: user?.id || '550e8400-e29b-41d4-a716-446655440000',
      limit: 10
    },
    { enabled: !!user?.id }
  );
  
  // Load active timer on mount
  useEffect(() => {
    if (activeTimer && !currentSessionId) {
      // Resume active timer
      const startTime = new Date(activeTimer.start_time);
      const now = new Date();
      const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      
      if (activeTimer.subject === 'general-timer') {
        // For general timer, show elapsed time
        if (!activeTimer.is_completed) {
          setCurrentSessionId(activeTimer.id);
          setTimeElapsed(elapsedSeconds);
          setActiveTab('general');
        }
      } else {
        // For break timers, show remaining time
        const remainingTime = activeTimer.duration - elapsedSeconds;
        if (remainingTime > 0 && !activeTimer.is_completed) {
          setCurrentSessionId(activeTimer.id);
          setTimeLeft(remainingTime);
          setInitialTime(activeTimer.duration);
          setActiveTab(activeTimer.subject === 'tea-break' ? 'tea' : 'lunch');
        }
      }
    }
  }, [activeTimer, currentSessionId]);
  
  // Calculate today's total focus time from sessions
  const todaysTotalTime = timerSessions ? (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaysSessions = timerSessions.filter(session => {
      const sessionDate = new Date(session.start_time);
      sessionDate.setHours(0, 0, 0, 0);
      return sessionDate.getTime() === today.getTime() && session.is_completed;
    });
    
    return todaysSessions.reduce((total, session) => total + session.duration, 0);
  })() : 0;
  
  const todaysSessionCount = timerSessions ? (() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return timerSessions.filter(session => {
      const sessionDate = new Date(session.start_time);
      sessionDate.setHours(0, 0, 0, 0);
      return sessionDate.getTime() === today.getTime() && session.is_completed;
    }).length;
  })() : 0;

  const setCustomTime = useCallback(() => {
    const totalSeconds = tempHours * 3600 + tempMinutes * 60 + tempSeconds;
    if (totalSeconds > 0 && activeTab !== 'general') {
      setTimeLeft(totalSeconds);
      setInitialTime(totalSeconds);
      setIsRunning(false);
      setShowTimeModal(false);
      
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (activeTab === 'general') {
      setShowTimeModal(false);
    } else {
      if (Platform.OS !== 'web') {
        Alert.alert('Invalid Time', 'Please set a time greater than 0');
      } else {
        console.log('Invalid Time: Please set a time greater than 0');
      }
    }
  }, [tempHours, tempMinutes, tempSeconds, fadeAnim, activeTab]);

  const handleTimerComplete = useCallback(async () => {
    // Mark current session as completed
    if (currentSessionId) {
      try {
        const sessionDuration = activeTab === 'general' ? timeElapsed : initialTime;
        
        await updateTimerSession.mutateAsync({
          id: currentSessionId,
          endTime: new Date().toISOString(),
          isCompleted: true,
        });
        
        // Refetch sessions to update stats
        refetchSessions();
        
        // Show completion alert
        const timerName = activeTab === 'general' ? (t('generalTimer') || '일반 타이머') : 
                         activeTab === 'tea' ? (t('teaBreak') || '차 휴식') : 
                         (t('lunchBreak') || '점심 휴식');
        
        if (Platform.OS !== 'web') {
          Alert.alert(
            t('timerComplete') || '타이머 완료!',
            `${timerName} ${Math.floor(sessionDuration / 60)}${t('minutes') || '분'} ${t('sessionFinished') || '세션이 완료되었습니다.'}`,
            [{ text: 'OK' }]
          );
        } else {
          console.log(`${timerName} ${Math.floor(sessionDuration / 60)} minute session finished.`);
        }
      } catch (error) {
        console.error('Failed to complete timer session:', error);
      }
    }
    
    setCurrentSessionId(null);
    updateStudyTime((activeTab === 'general' ? timeElapsed : initialTime) / 60);
  }, [initialTime, timeElapsed, activeTab, updateStudyTime, currentSessionId, updateTimerSession, refetchSessions, t]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isRunning) {
      interval = setInterval(() => {
        if (activeTab === 'general') {
          // General timer counts up (stopwatch)
          setTimeElapsed((prev) => prev + 1);
        } else {
          // Break timers count down
          setTimeLeft((prev) => {
            if (prev <= 1) {
              setIsRunning(false);
              handleTimerComplete();
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, activeTab, handleTimerComplete]);

  const toggleTimer = useCallback(async () => {
    if (!isRunning) {
      // Start timer
      if (!currentSessionId) {
        // Create new session
        try {
          const subjectMap = {
            general: 'general-timer',
            tea: 'tea-break',
            lunch: 'lunch-break'
          };
          
          const sessionDuration = activeTab === 'general' ? 0 : initialTime; // General timer has no preset duration
          
          const result = await createTimerSession.mutateAsync({
            userId: user?.id || '550e8400-e29b-41d4-a716-446655440000',
            subject: subjectMap[activeTab],
            duration: sessionDuration,
            startTime: new Date().toISOString(),
          });
          
          setCurrentSessionId(result.id);
        } catch (error) {
          console.error('Failed to create timer session:', error);
          if (Platform.OS !== 'web') {
            Alert.alert('Error', 'Failed to start timer session');
          } else {
            console.log('Error: Failed to start timer session');
          }
          return;
        }
      } else if (activeTimer?.is_paused) {
        // Resume from pause
        try {
          await updateTimerSession.mutateAsync({
            id: currentSessionId,
            isPaused: false,
          });
        } catch (error) {
          console.error('Failed to resume timer:', error);
        }
      }
    } else {
      // Pause timer
      if (currentSessionId) {
        try {
          await createPauseLog.mutateAsync({
            sessionId: currentSessionId,
            pauseTime: new Date().toISOString(),
          });
          
          await updateTimerSession.mutateAsync({
            id: currentSessionId,
            isPaused: true,
          });
        } catch (error) {
          console.error('Failed to pause timer:', error);
        }
      }
    }
    
    setIsRunning(!isRunning);
  }, [isRunning, currentSessionId, initialTime, activeTab, user?.id, createTimerSession, updateTimerSession, createPauseLog, activeTimer]);

  const resetTimer = useCallback(async () => {
    // For general timer, save the session when reset
    if (currentSessionId) {
      try {
        if (activeTab === 'general' && timeElapsed > 0) {
          // Save the general timer session with actual elapsed time
          await updateTimerSession.mutateAsync({
            id: currentSessionId,
            endTime: new Date().toISOString(),
            isCompleted: true,
            duration: timeElapsed, // Update duration to actual elapsed time
          });
          
          // Refetch sessions to update stats
          refetchSessions();
          
          // Show save confirmation
          if (Platform.OS !== 'web') {
            Alert.alert(
              t('sessionSaved') || '세션 저장됨',
              `${Math.floor(timeElapsed / 60)}${t('minutes') || '분'} ${Math.floor(timeElapsed % 60)}${t('seconds') || '초'} ${t('sessionSavedMessage') || '세션이 저장되었습니다.'}`,
              [{ text: 'OK' }]
            );
          }
        } else {
          // Cancel other timer sessions
          await updateTimerSession.mutateAsync({
            id: currentSessionId,
            endTime: new Date().toISOString(),
            isCompleted: false,
          });
        }
      } catch (error) {
        console.error('Failed to handle timer session:', error);
      }
    }
    
    setCurrentSessionId(null);
    setIsRunning(false);
    
    if (activeTab === 'general') {
      setTimeElapsed(0);
    } else {
      setTimeLeft(initialTime);
    }
  }, [initialTime, timeElapsed, activeTab, currentSessionId, updateTimerSession, refetchSessions, t]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const getProgress = useCallback(() => {
    if (activeTab === 'general') {
      // For general timer, show a pulsing animation or no progress
      return (timeElapsed % 60) * (100 / 60); // Creates a cycling progress
    } else {
      return ((initialTime - timeLeft) / initialTime) * 100;
    }
  }, [initialTime, timeLeft, timeElapsed, activeTab]);

  const getTimerColor = useCallback(() => {
    switch (activeTab) {
      case 'general':
        return "#007AFF";
      case 'tea':
        return "#34C759";
      case 'lunch':
        return "#FF9500";
      default:
        return "#007AFF";
    }
  }, [activeTab]);
  
  const getTimerTitle = useCallback(() => {
    switch (activeTab) {
      case 'general':
        return t('generalTimer') || '일반 타이머';
      case 'tea':
        return t('teaBreak') || '차 휴식';
      case 'lunch':
        return t('lunchBreak') || '점심 휴식';
      default:
        return t('generalTimer') || '일반 타이머';
    }
  }, [activeTab, t]);
  
  const getTimerSubtitle = useCallback(() => {
    switch (activeTab) {
      case 'general':
        return t('stayFocused') || '집중하고, 생산적으로';
      case 'tea':
        return t('enjoyYourTea') || '차 한 잔의 여유를';
      case 'lunch':
        return t('enjoyYourMeal') || '맛있는 식사 시간';
      default:
        return t('stayFocused') || '집중하고, 생산적으로';
    }
  }, [activeTab, t]);
  
  const getCurrentTime = useCallback(() => {
    if (activeTab === 'general') {
      return timeElapsed;
    } else {
      return timeLeft;
    }
  }, [activeTab, timeElapsed, timeLeft]);
  
  const handleTabChange = useCallback((tab: TimerType) => {
    if (isRunning) {
      if (Platform.OS !== 'web') {
        Alert.alert(
          t('timerRunning') || '타이머 실행 중',
          t('stopTimerFirst') || '먼저 타이머를 정지해주세요.',
          [{ text: 'OK' }]
        );
      }
      return;
    }
    
    setActiveTab(tab);
    
    // Reset times when switching tabs
    if (tab === 'general') {
      setTimeElapsed(0);
    } else {
      const defaultTimes = {
        tea: 15 * 60,   // 15 minutes for tea break
        lunch: 30 * 60  // 30 minutes for lunch break
      };
      const defaultTime = defaultTimes[tab] || 15 * 60;
      setTimeLeft(defaultTime);
      setInitialTime(defaultTime);
    }
  }, [isRunning, t]);

  return (
    <View style={[styles.container, { backgroundColor: getTimerColor() + "10", paddingTop: insets.top }]}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'general' && { backgroundColor: getTimerColor() }]}
          onPress={() => handleTabChange('general')}
        >
          <Clock size={20} color={activeTab === 'general' ? '#FFFFFF' : '#8E8E93'} />
          <Text style={[styles.tabText, { color: activeTab === 'general' ? '#FFFFFF' : '#8E8E93' }]}>
            {t('generalTimer') || '일반'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'tea' && { backgroundColor: getTimerColor() }]}
          onPress={() => handleTabChange('tea')}
        >
          <Coffee size={20} color={activeTab === 'tea' ? '#FFFFFF' : '#8E8E93'} />
          <Text style={[styles.tabText, { color: activeTab === 'tea' ? '#FFFFFF' : '#8E8E93' }]}>
            {t('teaBreak') || '차 휴식'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'lunch' && { backgroundColor: getTimerColor() }]}
          onPress={() => handleTabChange('lunch')}
        >
          <UtensilsCrossed size={20} color={activeTab === 'lunch' ? '#FFFFFF' : '#8E8E93'} />
          <Text style={[styles.tabText, { color: activeTab === 'lunch' ? '#FFFFFF' : '#8E8E93' }]}>
            {t('lunchBreak') || '점심'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>{getTimerTitle()}</Text>
        <Text style={styles.subtitle}>{getTimerSubtitle()}</Text>
      </View>

      {activeTab !== 'general' && (
        <TouchableOpacity 
          style={styles.timeSelector}
          onPress={() => {
            const hours = Math.floor(initialTime / 3600);
            const minutes = Math.floor((initialTime % 3600) / 60);
            const seconds = initialTime % 60;
            setTempHours(hours);
            setTempMinutes(minutes);
            setTempSeconds(seconds);
            setShowTimeModal(true);
          }}
          disabled={isRunning}
        >
          <Clock size={20} color={getTimerColor()} />
          <Text style={[styles.timeSelectorText, { color: getTimerColor() }]}>
            {t('setTimerDuration') || '타이머 시간 설정'}
          </Text>
        </TouchableOpacity>
      )}

      <Animated.View style={[styles.timerContainer, { opacity: fadeAnim }]}>
        <View style={styles.progressWrapper}>
          <CircularProgress
            percentage={getProgress()}
            size={width * 0.7}
            strokeWidth={20}
            color={getTimerColor()}
          />
          <View style={styles.timerDisplay}>
            <Text style={[styles.timeText, { color: getTimerColor() }]}>
              {formatTime(getCurrentTime())}
            </Text>
            <Text style={styles.sessionText}>
              {activeTab === 'general' ? (t('elapsedTime') || '경과 시간') : 
               activeTab === 'tea' ? (t('teaTime') || '차 시간') : 
               (t('lunchTime') || '점심 시간')}
            </Text>
          </View>
        </View>
      </Animated.View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={resetTimer}
        >
          <RotateCcw size={24} color="#8E8E93" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.playButton, { backgroundColor: getTimerColor() }]}
          onPress={toggleTimer}
        >
          {isRunning ? (
            <Pause size={32} color="#FFFFFF" />
          ) : (
            <Play size={32} color="#FFFFFF" />
          )}
        </TouchableOpacity>
        
        {activeTab !== 'general' && (
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => {
              const hours = Math.floor(initialTime / 3600);
              const minutes = Math.floor((initialTime % 3600) / 60);
              const seconds = initialTime % 60;
              setTempHours(hours);
              setTempMinutes(minutes);
              setTempSeconds(seconds);
              setShowTimeModal(true);
            }}
            disabled={isRunning}
          >
            <Clock size={24} color="#8E8E93" />
          </TouchableOpacity>
        )}
        
        {activeTab === 'general' && (
          <View style={styles.controlButton}>
            {/* Empty space for symmetry */}
          </View>
        )}
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{todaysSessionCount}</Text>
          <Text style={styles.statLabel}>{t('sessions') || "뽀모도로"}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{Math.floor(todaysTotalTime / 3600)}{t('hours') || "시간"} {Math.floor((todaysTotalTime % 3600) / 60)}{t('minutes') || "분"}</Text>
          <Text style={styles.statLabel}>{t('totalFocus') || "총 집중 시간"}</Text>
        </View>
      </View>
      
      {/* Recent Sessions */}
      {timerSessions && timerSessions.length > 0 && (
        <ScrollView style={styles.recentSessions} showsVerticalScrollIndicator={false}>
          <Text style={styles.recentTitle}>{t('recentSessions') || '최근 세션'}</Text>
          {timerSessions.slice(0, 5).map((session) => {
            const hours = Math.floor(session.duration / 3600);
            const minutes = Math.floor((session.duration % 3600) / 60);
            const seconds = session.duration % 60;
            const sessionDate = new Date(session.start_time);
            
            const getSessionIcon = (subject: string) => {
              switch (subject) {
                case 'general-timer': return '🎯';
                case 'tea-break': return '☕';
                case 'lunch-break': return '🍽️';
                default: return '⏱️';
              }
            };
            
            const getSessionName = (subject: string) => {
              switch (subject) {
                case 'general-timer': return t('generalTimer') || '일반 타이머';
                case 'tea-break': return t('teaBreak') || '차 휴식';
                case 'lunch-break': return t('lunchBreak') || '점심 휴식';
                default: return t('timerSession') || '타이머 세션';
              }
            };
            
            return (
              <View key={session.id} style={styles.sessionItem}>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionType}>
                    {getSessionIcon(session.subject)} {getSessionName(session.subject)}
                  </Text>
                  <Text style={styles.sessionDuration}>
                    {hours > 0 ? `${hours}${t('hours') || 'h'} ` : ''}
                    {minutes > 0 ? `${minutes}${t('minutes') || 'm'} ` : ''}
                    {hours === 0 && minutes === 0 ? `${seconds}${t('seconds') || 's'}` : ''}
                  </Text>
                </View>
                <Text style={styles.sessionTime}>
                  {sessionDate.toLocaleTimeString('ko-KR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      )}
      
      {/* Time Picker Modal */}
      <Modal
        visible={showTimeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTimeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('setTimerDuration') || '타이머 시간 설정'}</Text>
            
            <View style={styles.timePickerContainer}>
              {/* Hours */}
              <View style={styles.timePickerSection}>
                <Text style={styles.timePickerLabel}>{t('hours') || '시간'}</Text>
                <View style={styles.timePickerControls}>
                  <TouchableOpacity
                    style={styles.timePickerButton}
                    onPress={() => setTempHours(Math.max(0, tempHours - 1))}
                  >
                    <Minus size={20} color={getTimerColor()} />
                  </TouchableOpacity>
                  <Text style={styles.timePickerValue}>{tempHours.toString().padStart(2, '0')}</Text>
                  <TouchableOpacity
                    style={styles.timePickerButton}
                    onPress={() => setTempHours(Math.min(23, tempHours + 1))}
                  >
                    <Plus size={20} color={getTimerColor()} />
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Minutes */}
              <View style={styles.timePickerSection}>
                <Text style={styles.timePickerLabel}>{t('minutes') || '분'}</Text>
                <View style={styles.timePickerControls}>
                  <TouchableOpacity
                    style={styles.timePickerButton}
                    onPress={() => setTempMinutes(Math.max(0, tempMinutes - 1))}
                  >
                    <Minus size={20} color={getTimerColor()} />
                  </TouchableOpacity>
                  <Text style={styles.timePickerValue}>{tempMinutes.toString().padStart(2, '0')}</Text>
                  <TouchableOpacity
                    style={styles.timePickerButton}
                    onPress={() => setTempMinutes(Math.min(59, tempMinutes + 1))}
                  >
                    <Plus size={20} color={getTimerColor()} />
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Seconds */}
              <View style={styles.timePickerSection}>
                <Text style={styles.timePickerLabel}>{t('seconds') || '초'}</Text>
                <View style={styles.timePickerControls}>
                  <TouchableOpacity
                    style={styles.timePickerButton}
                    onPress={() => setTempSeconds(Math.max(0, tempSeconds - 1))}
                  >
                    <Minus size={20} color={getTimerColor()} />
                  </TouchableOpacity>
                  <Text style={styles.timePickerValue}>{tempSeconds.toString().padStart(2, '0')}</Text>
                  <TouchableOpacity
                    style={styles.timePickerButton}
                    onPress={() => setTempSeconds(Math.min(59, tempSeconds + 1))}
                  >
                    <Plus size={20} color={getTimerColor()} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowTimeModal(false)}
              >
                <Text style={styles.modalCancelText}>{t('cancel') || '취소'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSetButton, { backgroundColor: getTimerColor() }]}
                onPress={setCustomTime}
              >
                <Text style={styles.modalSetText}>{t('setTimer') || '설정'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    alignItems: "center",
    paddingTop: 15,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#8E8E93",
  },
  timeSelector: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    marginHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  timeSelectorText: {
    fontSize: 16,
    fontWeight: "600",
  },
  timerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  progressWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  timerDisplay: {
    position: "absolute",
    alignItems: "center",
  },
  timeText: {
    fontSize: 48,
    fontWeight: "bold",
  },
  sessionText: {
    fontSize: 16,
    color: "#8E8E93",
    marginTop: 8,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 40,
    gap: 30,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  playButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  stats: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 40,
    paddingBottom: 20,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000000",
  },
  statLabel: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 4,
  },
  recentSessions: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 12,
  },
  sessionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  sessionInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sessionType: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000000",
  },
  sessionDuration: {
    fontSize: 14,
    color: "#8E8E93",
  },
  sessionTime: {
    fontSize: 12,
    color: "#8E8E93",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    margin: 20,
    minWidth: 300,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 24,
    color: "#000000",
  },
  timePickerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  timePickerSection: {
    alignItems: "center",
    flex: 1,
  },
  timePickerLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E8E93",
    marginBottom: 12,
  },
  timePickerControls: {
    alignItems: "center",
    gap: 12,
  },
  timePickerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F2F2F7",
    justifyContent: "center",
    alignItems: "center",
  },
  timePickerValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
    minWidth: 40,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#F2F2F7",
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8E8E93",
  },
  modalSetButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalSetText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
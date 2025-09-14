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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Play, Pause, RotateCcw, Clock, Plus, Minus } from "lucide-react-native";
import CircularProgress from "@/components/CircularProgress";
import { useStudyStore } from "@/hooks/study-store";
import { useLanguage } from "@/hooks/language-context";
import { useUser } from "@/hooks/user-context";
import { trpc } from "@/lib/trpc";

export default function TimerScreen() {
  const { width } = Dimensions.get("window");
  const insets = useSafeAreaInsets();
  const [timeLeft, setTimeLeft] = useState(25 * 60); // Default 25 minutes
  const [initialTime, setInitialTime] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [tempHours, setTempHours] = useState(0);
  const [tempMinutes, setTempMinutes] = useState(25);
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
      const remainingTime = activeTimer.duration - elapsedSeconds;
      
      if (remainingTime > 0 && !activeTimer.is_completed) {
        setCurrentSessionId(activeTimer.id);
        setTimeLeft(remainingTime);
        setInitialTime(activeTimer.duration);
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
    if (totalSeconds > 0) {
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
    } else {
      if (Platform.OS !== 'web') {
        Alert.alert('Invalid Time', 'Please set a time greater than 0');
      } else {
        console.log('Invalid Time: Please set a time greater than 0');
      }
    }
  }, [tempHours, tempMinutes, tempSeconds, fadeAnim]);

  const handleTimerComplete = useCallback(async () => {
    // Mark current session as completed
    if (currentSessionId) {
      try {
        await updateTimerSession.mutateAsync({
          id: currentSessionId,
          endTime: new Date().toISOString(),
          isCompleted: true,
        });
        
        // Refetch sessions to update stats
        refetchSessions();
        
        // Show completion alert
        if (Platform.OS !== 'web') {
          Alert.alert(
            'Timer Complete!',
            `Your ${Math.floor(initialTime / 60)} minute session is finished.`,
            [{ text: 'OK' }]
          );
        } else {
          console.log(`Timer Complete! Your ${Math.floor(initialTime / 60)} minute session is finished.`);
        }
      } catch (error) {
        console.error('Failed to complete timer session:', error);
      }
    }
    
    setCurrentSessionId(null);
    updateStudyTime(initialTime / 60);
  }, [initialTime, updateStudyTime, currentSessionId, updateTimerSession, refetchSessions]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, handleTimerComplete]);

  const toggleTimer = useCallback(async () => {
    if (!isRunning) {
      // Start timer
      if (!currentSessionId) {
        // Create new session
        try {
          const result = await createTimerSession.mutateAsync({
            userId: user?.id || '550e8400-e29b-41d4-a716-446655440000',
            subject: 'general-timer',
            duration: initialTime,
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
  }, [isRunning, currentSessionId, initialTime, user?.id, createTimerSession, updateTimerSession, createPauseLog, activeTimer]);

  const resetTimer = useCallback(async () => {
    // Cancel current session if running
    if (currentSessionId && isRunning) {
      try {
        await updateTimerSession.mutateAsync({
          id: currentSessionId,
          endTime: new Date().toISOString(),
          isCompleted: false,
        });
      } catch (error) {
        console.error('Failed to cancel timer session:', error);
      }
    }
    
    setCurrentSessionId(null);
    setIsRunning(false);
    setTimeLeft(initialTime);
  }, [initialTime, currentSessionId, isRunning, updateTimerSession]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const getProgress = useCallback(() => {
    return ((initialTime - timeLeft) / initialTime) * 100;
  }, [initialTime, timeLeft]);

  const getTimerColor = useCallback(() => {
    return "#007AFF";
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: getTimerColor() + "10", paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('generalTimer') || "집중 타이머"}</Text>
        <Text style={styles.subtitle}>{t('stayFocused') || "집중하고, 생산적으로"}</Text>
      </View>

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
          Set Timer Duration
        </Text>
      </TouchableOpacity>

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
              {formatTime(timeLeft)}
            </Text>
            <Text style={styles.sessionText}>
              {t('focusTime') || "집중 시간"}
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
        <View style={styles.recentSessions}>
          <Text style={styles.recentTitle}>Recent Sessions</Text>
          {timerSessions.slice(0, 3).map((session) => {
            const hours = Math.floor(session.duration / 3600);
            const minutes = Math.floor((session.duration % 3600) / 60);
            const sessionDate = new Date(session.start_time);
            
            return (
              <View key={session.id} style={styles.sessionItem}>
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionType}>
                    🎯 Timer Session
                  </Text>
                  <Text style={styles.sessionDuration}>
                    {hours > 0 ? `${hours}h ` : ''}{minutes}m
                  </Text>
                </View>
                <Text style={styles.sessionTime}>
                  {sessionDate.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
              </View>
            );
          })}
        </View>
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
            <Text style={styles.modalTitle}>Set Timer Duration</Text>
            
            <View style={styles.timePickerContainer}>
              {/* Hours */}
              <View style={styles.timePickerSection}>
                <Text style={styles.timePickerLabel}>Hours</Text>
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
                <Text style={styles.timePickerLabel}>Minutes</Text>
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
                <Text style={styles.timePickerLabel}>Seconds</Text>
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
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSetButton, { backgroundColor: getTimerColor() }]}
                onPress={setCustomTime}
              >
                <Text style={styles.modalSetText}>Set Timer</Text>
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
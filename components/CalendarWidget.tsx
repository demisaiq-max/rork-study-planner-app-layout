import React, { useState, useCallback, useRef, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Dimensions } from "react-native";
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Calendar, Clock, MapPin, X } from 'lucide-react-native';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location?: string;
  description?: string;
  color: string;
}

interface CalendarWidgetProps {
  currentDate: Date;
}

export default function CalendarWidget({ currentDate }: CalendarWidgetProps) {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentMonth, setCurrentMonth] = useState<string>('');
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const date = currentDate.getDate();
  
  const monthNames = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  // Load events when component mounts and when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, [])
  );
  
  const loadEvents = async () => {
    try {
      const stored = await AsyncStorage.getItem('calendar_events');
      if (stored) {
        setEvents(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };
  
  const formatDate = (date: Date) => {
    // Use local date formatting to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  

  
  const getEventsForDate = (checkDate: Date) => {
    const dateStr = formatDate(checkDate);
    return events.filter(event => event.date === dateStr);
  };
  
  const getAllDates = () => {
    const allDates = [];
    const today = new Date();
    const todayDate = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();
    
    // Generate dates for 3 months (previous, current, next)
    for (let monthOffset = -1; monthOffset <= 1; monthOffset++) {
      const targetMonth = new Date(year, month + monthOffset, 1);
      const daysInMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();
      
      for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), day);
        const dayEvents = getEventsForDate(dateObj);
        allDates.push({
          date: day,
          month: dateObj.getMonth(),
          year: dateObj.getFullYear(),
          fullDate: new Date(dateObj),
          day: dayNames[dateObj.getDay()],
          isToday: day === todayDate && dateObj.getMonth() === todayMonth && dateObj.getFullYear() === todayYear,
          hasEvents: dayEvents.length > 0,
          eventColors: dayEvents.slice(0, 3).map(e => e.color),
        });
      }
    }
    return allDates;
  };
  
  const handleDatePress = (dateItem: any) => {
    setSelectedDate(dateItem.fullDate);
    setModalVisible(true);
  };
  
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];
  
  const allDates = getAllDates();
  
  // Find today's index and scroll to it on mount
  useEffect(() => {
    const todayIndex = allDates.findIndex(item => item.isToday);
    if (todayIndex !== -1 && scrollViewRef.current) {
      // Delay to ensure layout is complete
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ 
          x: Math.max(0, todayIndex * 56 - 100), // 56 is approx width of each date item
          animated: false 
        });
      }, 100);
    }
  }, []);
  
  // Update current month based on scroll position
  const handleScroll = (event: any) => {
    const scrollX = event.nativeEvent.contentOffset.x;
    const index = Math.floor((scrollX + 100) / 56); // 56 is approx width of each date item
    if (allDates[index]) {
      const monthYear = `${allDates[index].year}년 ${monthNames[allDates[index].month]}`;
      if (monthYear !== currentMonth) {
        setCurrentMonth(monthYear);
      }
    }
  };
  
  // Initialize current month on mount
  useEffect(() => {
    setCurrentMonth(`${year}년 ${monthNames[month]}`);
  }, []);
  
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.headerTouchable}
        onPress={() => router.push('/calendar')}
        activeOpacity={0.8}
      >
        <View style={styles.header}>
          <Text style={styles.monthYear}>{currentMonth || `${year}년 ${monthNames[month]}`}</Text>
        </View>
      </TouchableOpacity>
      
      <ScrollView 
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.weekScrollView}
        contentContainerStyle={styles.weekContainer}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {allDates.map((item, index) => (
          <TouchableOpacity 
            key={index} 
            style={[styles.dayItem, item.isToday && styles.todayItem]}
            onPress={() => handleDatePress(item)}
          >
            <Text style={[styles.dayNumber, item.isToday && styles.todayText]}>
              {item.date}
            </Text>
            <Text style={[styles.dayName, item.isToday && styles.todayText]}>
              {item.day}
            </Text>
            {item.hasEvents && (
              <View style={styles.eventIndicators}>
                {item.eventColors.map((color, i) => (
                  <View
                    key={i}
                    style={[styles.eventDot, { backgroundColor: color }]}
                  />
                ))}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>
                  {selectedDate && `${selectedDate.getFullYear()}년 ${monthNames[selectedDate.getMonth()]} ${selectedDate.getDate()}일`}
                </Text>
                <Text style={styles.modalSubtitle}>
                  {selectedDateEvents.length > 0 
                    ? `${selectedDateEvents.length}개의 일정` 
                    : '일정 없음'}
                </Text>
              </View>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <X size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.eventsList} showsVerticalScrollIndicator={false}>
              {selectedDateEvents.length > 0 ? (
                selectedDateEvents.map((event) => (
                  <View key={event.id} style={styles.eventCard}>
                    <View style={[styles.eventColorBar, { backgroundColor: event.color }]} />
                    <View style={styles.eventContent}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      
                      <View style={styles.eventDetail}>
                        <Clock size={14} color="#8E8E93" />
                        <Text style={styles.eventDetailText}>{event.time}</Text>
                      </View>
                      
                      {event.location && (
                        <View style={styles.eventDetail}>
                          <MapPin size={14} color="#8E8E93" />
                          <Text style={styles.eventDetailText}>{event.location}</Text>
                        </View>
                      )}
                      
                      {event.description && (
                        <Text style={styles.eventDescription}>{event.description}</Text>
                      )}
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.noEventsContainer}>
                  <Calendar size={48} color="#C7C7CC" />
                  <Text style={styles.noEventsText}>이 날짜에 일정이 없습니다</Text>
                  <TouchableOpacity 
                    style={styles.addEventButton}
                    onPress={() => {
                      setModalVisible(false);
                      router.push('/calendar');
                    }}
                  >
                    <Text style={styles.addEventButtonText}>일정 추가하기</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
            
            {selectedDateEvents.length > 0 && (
              <TouchableOpacity 
                style={styles.viewCalendarButton}
                onPress={() => {
                  setModalVisible(false);
                  router.push('/calendar');
                }}
              >
                <Text style={styles.viewCalendarButtonText}>전체 캘린더 보기</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTouchable: {
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  monthYear: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },

  weekScrollView: {
    marginHorizontal: -8,
  },
  weekContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
  },
  dayItem: {
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    width: 52,
    marginHorizontal: 2,
  },
  todayItem: {
    backgroundColor: "#007AFF",
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 4,
  },
  dayName: {
    fontSize: 11,
    color: "#8E8E93",
  },
  todayText: {
    color: "#FFFFFF",
  },
  eventIndicators: {
    flexDirection: "row",
    marginTop: 4,
    justifyContent: "center",
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#8E8E93",
  },
  closeButton: {
    padding: 4,
  },
  eventsList: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  eventCard: {
    flexDirection: "row",
    backgroundColor: "#F9F9FB",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
  },
  eventColorBar: {
    width: 4,
  },
  eventContent: {
    flex: 1,
    padding: 12,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 8,
  },
  eventDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  eventDetailText: {
    fontSize: 13,
    color: "#8E8E93",
    marginLeft: 6,
  },
  eventDescription: {
    fontSize: 13,
    color: "#3C3C43",
    marginTop: 8,
    lineHeight: 18,
  },
  noEventsContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  noEventsText: {
    fontSize: 16,
    color: "#8E8E93",
    marginTop: 16,
    marginBottom: 20,
  },
  addEventButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addEventButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  viewCalendarButton: {
    backgroundColor: "#007AFF",
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  viewCalendarButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
import React, { useState, useCallback, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Dimensions } from "react-native";
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Calendar, Clock, MapPin, X, ChevronLeft, ChevronRight } from 'lucide-react-native';

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
  const [weekOffset, setWeekOffset] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Calculate the displayed week based on offset
  const getDisplayedDate = () => {
    const displayDate = new Date(currentDate);
    displayDate.setDate(currentDate.getDate() + (weekOffset * 7));
    return displayDate;
  };
  
  const displayedDate = getDisplayedDate();
  const year = displayedDate.getFullYear();
  const month = displayedDate.getMonth();
  const date = displayedDate.getDate();
  const day = displayedDate.getDay();
  
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
  
  const getWeekDates = () => {
    const weekDates = [];
    const today = new Date();
    const todayDate = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();
    
    // Create a new date object to avoid mutating the original
    const startOfWeek = new Date(year, month, date);
    // Calculate the start of the week (Sunday)
    startOfWeek.setDate(date - day);
    
    for (let i = 0; i < 7; i++) {
      // Create a fresh date for each day of the week
      const weekDate = new Date(year, month, date - day + i);
      const dayEvents = getEventsForDate(weekDate);
      weekDates.push({
        date: weekDate.getDate(),
        month: weekDate.getMonth(),
        fullDate: new Date(weekDate),
        day: dayNames[weekDate.getDay()],
        isToday: weekDate.getDate() === todayDate && weekDate.getMonth() === todayMonth && weekDate.getFullYear() === todayYear,
        hasEvents: dayEvents.length > 0,
        eventColors: dayEvents.slice(0, 3).map(e => e.color),
      });
    }
    return weekDates;
  };
  
  const handleDatePress = (dateItem: any) => {
    setSelectedDate(dateItem.fullDate);
    setModalVisible(true);
  };
  
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];
  
  const weekDates = getWeekDates();
  
  const handlePreviousWeek = () => {
    setWeekOffset(weekOffset - 1);
  };
  
  const handleNextWeek = () => {
    setWeekOffset(weekOffset + 1);
  };
  
  const handleToday = () => {
    setWeekOffset(0);
  };
  
  // Get the month/year text for the header
  const getHeaderText = () => {
    const firstDay = weekDates[0];
    const lastDay = weekDates[6];
    
    if (firstDay && lastDay) {
      if (firstDay.month === lastDay.month) {
        return `${year}년 ${monthNames[firstDay.month]}`;
      } else {
        // Week spans two months
        const firstMonth = monthNames[firstDay.month];
        const lastMonth = monthNames[lastDay.month];
        return `${year}년 ${firstMonth} - ${lastMonth}`;
      }
    }
    return `${year}년 ${monthNames[month]}`;
  };
  
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.headerTouchable}
        onPress={() => router.push('/calendar')}
        activeOpacity={0.8}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.monthYear}>{getHeaderText()}</Text>
            {weekOffset !== 0 && (
              <TouchableOpacity 
                style={styles.todayButton}
                onPress={handleToday}
              >
                <Text style={styles.todayButtonText}>오늘</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.navigationButtons}>
            <TouchableOpacity 
              style={styles.navButton}
              onPress={handlePreviousWeek}
            >
              <ChevronLeft size={20} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.navButton}
              onPress={handleNextWeek}
            >
              <ChevronRight size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
      
      <ScrollView 
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        style={styles.weekScrollView}
        contentContainerStyle={styles.weekContainer}
      >
        {weekDates.map((item, index) => (
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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  monthYear: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  todayButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  todayButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  navigationButtons: {
    flexDirection: "row",
    gap: 4,
  },
  navButton: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: "#F2F2F7",
  },
  weekScrollView: {
    marginHorizontal: -8,
  },
  weekContainer: {
    flexDirection: "row",
    paddingHorizontal: 8,
    gap: 8,
  },
  dayItem: {
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    minWidth: 48,
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
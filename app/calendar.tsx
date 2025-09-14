import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { Stack, useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Plus, X, Edit2, Trash2, Clock, MapPin } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Event {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  description?: string;
  color: string;
}

const COLORS = ['#007AFF', '#34C759', '#FF3B30', '#FF9500', '#AF52DE', '#5856D6'];

export default function CalendarScreen() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    startTime: '',
    endTime: '',
    location: '',
    description: '',
    color: COLORS[0],
  });
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [selectedStartTime, setSelectedStartTime] = useState(new Date());
  const [selectedEndTime, setSelectedEndTime] = useState(new Date());

  useEffect(() => {
    loadEvents();
  }, []);

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

  const saveEvents = async (newEvents: Event[]) => {
    try {
      await AsyncStorage.setItem('calendar_events', JSON.stringify(newEvents));
      setEvents(newEvents);
    } catch (error) {
      console.error('Error saving events:', error);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const formatDate = (date: Date) => {
    // Use local date formatting to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = formatDate(date);
    return events.filter(event => event.date === dateStr);
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDatePress = (date: Date) => {
    setSelectedDate(date);
  };

  const handleAddEvent = () => {
    if (!selectedDate) {
      Alert.alert('Select a Date', 'Please select a date first');
      return;
    }
    setEditingEvent(null);
    setEventForm({
      title: '',
      startTime: '',
      endTime: '',
      location: '',
      description: '',
      color: COLORS[0],
    });
    const now = new Date();
    const later = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours later
    setSelectedStartTime(now);
    setSelectedEndTime(later);
    setShowEventModal(true);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location || '',
      description: event.description || '',
      color: event.color,
    });
    // Parse start time from string if it exists
    if (event.startTime) {
      const timeParts = event.startTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (timeParts) {
        let hours = parseInt(timeParts[1]);
        const minutes = parseInt(timeParts[2]);
        const period = timeParts[3];
        
        if (period) {
          if (period.toUpperCase() === 'PM' && hours !== 12) {
            hours += 12;
          } else if (period.toUpperCase() === 'AM' && hours === 12) {
            hours = 0;
          }
        }
        
        const time = new Date();
        time.setHours(hours, minutes, 0, 0);
        setSelectedStartTime(time);
      }
    }
    // Parse end time from string if it exists
    if (event.endTime) {
      const timeParts = event.endTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (timeParts) {
        let hours = parseInt(timeParts[1]);
        const minutes = parseInt(timeParts[2]);
        const period = timeParts[3];
        
        if (period) {
          if (period.toUpperCase() === 'PM' && hours !== 12) {
            hours += 12;
          } else if (period.toUpperCase() === 'AM' && hours === 12) {
            hours = 0;
          }
        }
        
        const time = new Date();
        time.setHours(hours, minutes, 0, 0);
        setSelectedEndTime(time);
      }
    }
    setShowEventModal(true);
  };

  const handleDeleteEvent = (eventId: string) => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const newEvents = events.filter(e => e.id !== eventId);
            saveEvents(newEvents);
          },
        },
      ]
    );
  };

  const handleSaveEvent = () => {
    if (!eventForm.title || !eventForm.startTime || !eventForm.endTime) {
      Alert.alert('Required Fields', 'Please enter title, start time, and end time');
      return;
    }

    if (!selectedDate) return;

    const newEvent: Event = {
      id: editingEvent?.id || Date.now().toString(),
      title: eventForm.title,
      date: formatDate(selectedDate),
      startTime: eventForm.startTime,
      endTime: eventForm.endTime,
      location: eventForm.location,
      description: eventForm.description,
      color: eventForm.color,
    };

    let newEvents;
    if (editingEvent) {
      newEvents = events.map(e => e.id === editingEvent.id ? newEvent : e);
    } else {
      newEvents = [...events, newEvent];
    }

    saveEvents(newEvents);
    setShowEventModal(false);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return date.getDate() === selectedDate.getDate() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getFullYear() === selectedDate.getFullYear();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          headerShown: true,
          title: 'Calendar',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ChevronLeft size={24} color="#007AFF" />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Month Navigation */}
        <View style={styles.monthHeader}>
          <TouchableOpacity onPress={handlePreviousMonth} style={styles.navButton}>
            <ChevronLeft size={24} color="#007AFF" />
          </TouchableOpacity>
          
          <Text style={styles.monthTitle}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </Text>
          
          <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
            <ChevronRight size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarContainer}>
          {/* Week Days Header */}
          <View style={styles.weekDaysRow}>
            {weekDays.map((day, index) => (
              <View key={index} style={styles.weekDayCell}>
                <Text style={styles.weekDayText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar Days */}
          <View style={styles.daysGrid}>
            {getDaysInMonth(currentDate).map((date, index) => {
              if (!date) {
                return <View key={index} style={styles.dayCell} />;
              }

              const dayEvents = getEventsForDate(date);
              const hasEvents = dayEvents.length > 0;

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayCell,
                    isToday(date) && styles.todayCell,
                    isSelected(date) && styles.selectedCell,
                  ]}
                  onPress={() => handleDatePress(date)}
                >
                  <Text style={[
                    styles.dayText,
                    isToday(date) && styles.todayText,
                    isSelected(date) && styles.selectedText,
                  ]}>
                    {date.getDate()}
                  </Text>
                  {hasEvents && (
                    <View style={styles.eventIndicators}>
                      {dayEvents.slice(0, 3).map((event, i) => (
                        <View
                          key={i}
                          style={[styles.eventDot, { backgroundColor: event.color }]}
                        />
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Selected Date Events */}
        {selectedDate && (
          <View style={styles.selectedDateContainer}>
            <View style={styles.selectedDateHeader}>
              <Text style={styles.selectedDateTitle}>
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={handleAddEvent}
              >
                <Plus size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.eventsList}>
              {getEventsForDate(selectedDate).length === 0 ? (
                <Text style={styles.noEventsText}>No events for this day</Text>
              ) : (
                getEventsForDate(selectedDate).map(event => (
                  <View key={event.id} style={styles.eventCard}>
                    <View style={[styles.eventColorBar, { backgroundColor: event.color }]} />
                    <View style={styles.eventContent}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <View style={styles.eventDetails}>
                        <View style={styles.eventDetailRow}>
                          <Clock size={14} color="#8E8E93" />
                          <Text style={styles.eventDetailText}>{event.startTime} - {event.endTime}</Text>
                        </View>
                        {event.location && (
                          <View style={styles.eventDetailRow}>
                            <MapPin size={14} color="#8E8E93" />
                            <Text style={styles.eventDetailText}>{event.location}</Text>
                          </View>
                        )}
                      </View>
                      {event.description && (
                        <Text style={styles.eventDescription}>{event.description}</Text>
                      )}
                    </View>
                    <View style={styles.eventActions}>
                      <TouchableOpacity 
                        style={styles.eventActionButton}
                        onPress={() => handleEditEvent(event)}
                      >
                        <Edit2 size={18} color="#007AFF" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.eventActionButton}
                        onPress={() => handleDeleteEvent(event.id)}
                      >
                        <Trash2 size={18} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Add/Edit Event Modal */}
      <Modal
        visible={showEventModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowEventModal(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingEvent ? 'Edit Event' : 'Add Event'}
              </Text>
              <TouchableOpacity onPress={() => setShowEventModal(false)}>
                <X size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.inputLabel}>Title *</Text>
              <TextInput
                style={styles.input}
                value={eventForm.title}
                onChangeText={(text) => setEventForm({...eventForm, title: text})}
                placeholder="Math Study Session"
                placeholderTextColor="#C7C7CC"
              />

              <Text style={styles.inputLabel}>Time *</Text>
              <View style={styles.timeRangeContainer}>
                <TouchableOpacity
                  style={[styles.timePickerButton, styles.timeRangeButton]}
                  onPress={() => setShowStartTimePicker(true)}
                >
                  <Text style={eventForm.startTime ? styles.timePickerText : styles.placeholderText}>
                    {eventForm.startTime || '2:00 PM'}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.timeRangeSeparator}>to</Text>
                <TouchableOpacity
                  style={[styles.timePickerButton, styles.timeRangeButton]}
                  onPress={() => setShowEndTimePicker(true)}
                >
                  <Text style={eventForm.endTime ? styles.timePickerText : styles.placeholderText}>
                    {eventForm.endTime || '4:00 PM'}
                  </Text>
                </TouchableOpacity>
              </View>

              {showStartTimePicker && Platform.OS !== 'web' && (
                <View style={styles.dateTimePickerContainer}>
                  <Text style={styles.timePickerLabel}>Start Time</Text>
                  <DateTimePicker
                    value={selectedStartTime}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    textColor="#000000"
                    accentColor="#007AFF"
                    themeVariant="light"
                    onChange={(event, date) => {
                      if (Platform.OS === 'android') {
                        setShowStartTimePicker(false);
                      }
                      if (date) {
                        setSelectedStartTime(date);
                        const hours = date.getHours();
                        const minutes = date.getMinutes();
                        const period = hours >= 12 ? 'PM' : 'AM';
                        const displayHours = hours % 12 || 12;
                        const timeString = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
                        setEventForm({...eventForm, startTime: timeString});
                      }
                    }}
                  />
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity
                      style={styles.timePickerDoneButtonIOS}
                      onPress={() => setShowStartTimePicker(false)}
                    >
                      <Text style={styles.timePickerDoneTextIOS}>Done</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {showEndTimePicker && Platform.OS !== 'web' && (
                <View style={styles.dateTimePickerContainer}>
                  <Text style={styles.timePickerLabel}>End Time</Text>
                  <DateTimePicker
                    value={selectedEndTime}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    textColor="#000000"
                    accentColor="#007AFF"
                    themeVariant="light"
                    onChange={(event, date) => {
                      if (Platform.OS === 'android') {
                        setShowEndTimePicker(false);
                      }
                      if (date) {
                        setSelectedEndTime(date);
                        const hours = date.getHours();
                        const minutes = date.getMinutes();
                        const period = hours >= 12 ? 'PM' : 'AM';
                        const displayHours = hours % 12 || 12;
                        const timeString = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
                        setEventForm({...eventForm, endTime: timeString});
                      }
                    }}
                  />
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity
                      style={styles.timePickerDoneButtonIOS}
                      onPress={() => setShowEndTimePicker(false)}
                    >
                      <Text style={styles.timePickerDoneTextIOS}>Done</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {showStartTimePicker && Platform.OS === 'web' && (
                <Modal
                  visible={showStartTimePicker}
                  transparent={true}
                  animationType="fade"
                  onRequestClose={() => setShowStartTimePicker(false)}
                >
                  <TouchableOpacity 
                    style={styles.timePickerOverlay}
                    activeOpacity={1}
                    onPress={() => setShowStartTimePicker(false)}
                  >
                    <View style={styles.timePickerModal}>
                      <View style={styles.timePickerHeader}>
                        <Text style={styles.timePickerTitle}>Select Start Time</Text>
                        <TouchableOpacity onPress={() => setShowStartTimePicker(false)}>
                          <X size={20} color="#000" />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.timePickerContent}>
                        <ScrollView 
                          style={styles.timePickerColumn} 
                          showsVerticalScrollIndicator={false}
                          contentContainerStyle={{ alignItems: 'center' }}
                        >
                          {[...Array(12)].map((_, i) => {
                            const hour = i + 1;
                            const isSelected = (selectedStartTime.getHours() % 12 || 12) === hour;
                            return (
                              <TouchableOpacity
                                key={`hour-${hour}`}
                                style={[styles.timePickerOption, isSelected && styles.selectedTimeOption]}
                                onPress={() => {
                                  const newTime = new Date(selectedStartTime);
                                  const isPM = selectedStartTime.getHours() >= 12;
                                  newTime.setHours(isPM && hour !== 12 ? hour + 12 : hour === 12 && !isPM ? 0 : hour);
                                  setSelectedStartTime(newTime);
                                }}
                              >
                                <Text style={[
                                  styles.timePickerOptionText,
                                  isSelected && styles.selectedTimeText
                                ]}>
                                  {hour.toString().padStart(2, '0')}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                        <Text style={styles.timePickerSeparator}>:</Text>
                        <ScrollView 
                          style={styles.timePickerColumn} 
                          showsVerticalScrollIndicator={false}
                          contentContainerStyle={{ alignItems: 'center' }}
                        >
                          {[...Array(60)].map((_, i) => {
                            if (i % 5 !== 0) return null;
                            const isSelected = selectedStartTime.getMinutes() === i;
                            return (
                              <TouchableOpacity
                                key={`minute-${i}`}
                                style={[styles.timePickerOption, isSelected && styles.selectedTimeOption]}
                                onPress={() => {
                                  const newTime = new Date(selectedStartTime);
                                  newTime.setMinutes(i);
                                  setSelectedStartTime(newTime);
                                }}
                              >
                                <Text style={[
                                  styles.timePickerOptionText,
                                  isSelected && styles.selectedTimeText
                                ]}>
                                  {i.toString().padStart(2, '0')}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                        <View style={styles.timePickerColumn}>
                          <TouchableOpacity
                            style={[styles.timePickerOption, selectedStartTime.getHours() < 12 && styles.selectedTimeOption]}
                            onPress={() => {
                              const newTime = new Date(selectedStartTime);
                              const hours = newTime.getHours();
                              if (hours >= 12) {
                                newTime.setHours(hours - 12);
                              }
                              setSelectedStartTime(newTime);
                            }}
                          >
                            <Text style={[
                              styles.timePickerOptionText,
                              selectedStartTime.getHours() < 12 && styles.selectedTimeText
                            ]}>AM</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.timePickerOption, selectedStartTime.getHours() >= 12 && styles.selectedTimeOption]}
                            onPress={() => {
                              const newTime = new Date(selectedStartTime);
                              const hours = newTime.getHours();
                              if (hours < 12) {
                                newTime.setHours(hours + 12);
                              }
                              setSelectedStartTime(newTime);
                            }}
                          >
                            <Text style={[
                              styles.timePickerOptionText,
                              selectedStartTime.getHours() >= 12 && styles.selectedTimeText
                            ]}>PM</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.timePickerDoneButton}
                        onPress={() => {
                          const hours = selectedStartTime.getHours();
                          const minutes = selectedStartTime.getMinutes();
                          const period = hours >= 12 ? 'PM' : 'AM';
                          const displayHours = hours % 12 || 12;
                          const timeString = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
                          setEventForm({...eventForm, startTime: timeString});
                          setShowStartTimePicker(false);
                        }}
                      >
                        <Text style={styles.timePickerDoneText}>Done</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </Modal>
              )}

              {showEndTimePicker && Platform.OS === 'web' && (
                <Modal
                  visible={showEndTimePicker}
                  transparent={true}
                  animationType="fade"
                  onRequestClose={() => setShowEndTimePicker(false)}
                >
                  <TouchableOpacity 
                    style={styles.timePickerOverlay}
                    activeOpacity={1}
                    onPress={() => setShowEndTimePicker(false)}
                  >
                    <View style={styles.timePickerModal}>
                      <View style={styles.timePickerHeader}>
                        <Text style={styles.timePickerTitle}>Select End Time</Text>
                        <TouchableOpacity onPress={() => setShowEndTimePicker(false)}>
                          <X size={20} color="#000" />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.timePickerContent}>
                        <ScrollView 
                          style={styles.timePickerColumn} 
                          showsVerticalScrollIndicator={false}
                          contentContainerStyle={{ alignItems: 'center' }}
                        >
                          {[...Array(12)].map((_, i) => {
                            const hour = i + 1;
                            const isSelected = (selectedEndTime.getHours() % 12 || 12) === hour;
                            return (
                              <TouchableOpacity
                                key={`hour-${hour}`}
                                style={[styles.timePickerOption, isSelected && styles.selectedTimeOption]}
                                onPress={() => {
                                  const newTime = new Date(selectedEndTime);
                                  const isPM = selectedEndTime.getHours() >= 12;
                                  newTime.setHours(isPM && hour !== 12 ? hour + 12 : hour === 12 && !isPM ? 0 : hour);
                                  setSelectedEndTime(newTime);
                                }}
                              >
                                <Text style={[
                                  styles.timePickerOptionText,
                                  isSelected && styles.selectedTimeText
                                ]}>
                                  {hour.toString().padStart(2, '0')}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                        <Text style={styles.timePickerSeparator}>:</Text>
                        <ScrollView 
                          style={styles.timePickerColumn} 
                          showsVerticalScrollIndicator={false}
                          contentContainerStyle={{ alignItems: 'center' }}
                        >
                          {[...Array(60)].map((_, i) => {
                            if (i % 5 !== 0) return null;
                            const isSelected = selectedEndTime.getMinutes() === i;
                            return (
                              <TouchableOpacity
                                key={`minute-${i}`}
                                style={[styles.timePickerOption, isSelected && styles.selectedTimeOption]}
                                onPress={() => {
                                  const newTime = new Date(selectedEndTime);
                                  newTime.setMinutes(i);
                                  setSelectedEndTime(newTime);
                                }}
                              >
                                <Text style={[
                                  styles.timePickerOptionText,
                                  isSelected && styles.selectedTimeText
                                ]}>
                                  {i.toString().padStart(2, '0')}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                        <View style={styles.timePickerColumn}>
                          <TouchableOpacity
                            style={[styles.timePickerOption, selectedEndTime.getHours() < 12 && styles.selectedTimeOption]}
                            onPress={() => {
                              const newTime = new Date(selectedEndTime);
                              const hours = newTime.getHours();
                              if (hours >= 12) {
                                newTime.setHours(hours - 12);
                              }
                              setSelectedEndTime(newTime);
                            }}
                          >
                            <Text style={[
                              styles.timePickerOptionText,
                              selectedEndTime.getHours() < 12 && styles.selectedTimeText
                            ]}>AM</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.timePickerOption, selectedEndTime.getHours() >= 12 && styles.selectedTimeOption]}
                            onPress={() => {
                              const newTime = new Date(selectedEndTime);
                              const hours = newTime.getHours();
                              if (hours < 12) {
                                newTime.setHours(hours + 12);
                              }
                              setSelectedEndTime(newTime);
                            }}
                          >
                            <Text style={[
                              styles.timePickerOptionText,
                              selectedEndTime.getHours() >= 12 && styles.selectedTimeText
                            ]}>PM</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.timePickerDoneButton}
                        onPress={() => {
                          const hours = selectedEndTime.getHours();
                          const minutes = selectedEndTime.getMinutes();
                          const period = hours >= 12 ? 'PM' : 'AM';
                          const displayHours = hours % 12 || 12;
                          const timeString = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
                          setEventForm({...eventForm, endTime: timeString});
                          setShowEndTimePicker(false);
                        }}
                      >
                        <Text style={styles.timePickerDoneText}>Done</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </Modal>
              )}

              <Text style={styles.inputLabel}>Location</Text>
              <TextInput
                style={styles.input}
                value={eventForm.location}
                onChangeText={(text) => setEventForm({...eventForm, location: text})}
                placeholder="Library Room 203"
                placeholderTextColor="#C7C7CC"
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={eventForm.description}
                onChangeText={(text) => setEventForm({...eventForm, description: text})}
                placeholder="Review chapters 5-7 for upcoming exam. Focus on calculus problems and practice exercises."
                placeholderTextColor="#C7C7CC"
                multiline
                numberOfLines={3}
              />

              <Text style={styles.inputLabel}>Color</Text>
              <View style={styles.colorPicker}>
                {COLORS.map(color => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      eventForm.color === color && styles.selectedColor,
                    ]}
                    onPress={() => setEventForm({...eventForm, color})}
                  />
                ))}
              </View>
              
              {/* Extra padding for keyboard */}
              <View style={{ height: 20 }} />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowEventModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveEvent}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  navButton: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  weekDaysRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  todayCell: {
    backgroundColor: '#E5F3FF',
    borderRadius: 8,
  },
  selectedCell: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  dayText: {
    fontSize: 16,
    color: '#000',
  },
  todayText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  selectedText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  eventIndicators: {
    flexDirection: 'row',
    marginTop: 2,
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 1,
  },
  selectedDateContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 20,
  },
  selectedDateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  addButton: {
    backgroundColor: '#007AFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventsList: {
    gap: 12,
  },
  noEventsText: {
    textAlign: 'center',
    color: '#8E8E93',
    fontSize: 14,
    paddingVertical: 20,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
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
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  eventDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 4,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventDetailText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  eventDescription: {
    fontSize: 14,
    color: '#3C3C43',
    marginTop: 4,
  },
  eventActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 8,
  },
  eventActionButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  modalBody: {
    padding: 20,
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3C3C43',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  colorPicker: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#000',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F2F2F7',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  timePickerButton: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  timePickerText: {
    fontSize: 16,
    color: '#000000',
    textAlign: 'center',
    fontWeight: '500',
  },
  placeholderText: {
    color: '#C7C7CC',
  },
  timePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timePickerModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '85%',
    maxWidth: 340,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 15,
  },
  timePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  timePickerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  timePickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  timePickerColumn: {
    flex: 1,
    maxHeight: 200,
  },
  timePickerSeparator: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginHorizontal: 10,
  },
  timePickerOption: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  timePickerOptionText: {
    fontSize: 20,
    color: '#000000',
    fontWeight: '600',
  },
  selectedTimeText: {
    color: '#007AFF',
    fontWeight: '800',
    fontSize: 22,
  },
  timePickerDoneButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 20,
    alignItems: 'center',
  },
  timePickerDoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  selectedTimeOption: {
    backgroundColor: '#E5F3FF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  dateTimePickerContainer: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  timePickerDoneButtonIOS: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 12,
    alignItems: 'center',
  },
  timePickerDoneTextIOS: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  timeRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  timeRangeButton: {
    flex: 1,
    marginBottom: 0,
  },
  timeRangeSeparator: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3C3C43',
  },
  timePickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
});
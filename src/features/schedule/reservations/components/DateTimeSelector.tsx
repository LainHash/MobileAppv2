import React, { useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from "react-native";

interface DateTimeSelectorProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  selectedTime: string | null; // e.g. "18:30"
  onSelectTime: (time: string) => void;
  openTime?: string; // e.g. "08:00:00"
  closeTime?: string; // e.g. "22:00:00"
}

export function DateTimeSelector({
  selectedDate,
  onSelectDate,
  selectedTime,
  onSelectTime,
  openTime = "08:00",
  closeTime = "22:00",
}: DateTimeSelectorProps) {
  // Generate next 14 days
  const dateOptions = useMemo(() => {
    const dates: Date[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, []);

  // Parse open & close hours (defaults 8 to 22)
  const [startHour, startMin] = useMemo(() => {
    const parts = openTime.split(":").map(Number);
    return [parts[0] || 8, parts[1] || 0];
  }, [openTime]);

  const [endHour, endMin] = useMemo(() => {
    const parts = closeTime.split(":").map(Number);
    return [parts[0] || 22, parts[1] || 0];
  }, [closeTime]);

  // Generate 30-min time slots
  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    let curH = startHour;
    let curM = startMin;

    while (curH < endHour || (curH === endHour && curM <= endMin)) {
      const formatted = `${String(curH).padStart(2, "0")}:${String(curM).padStart(2, "0")}`;
      slots.push(formatted);
      curM += 30;
      if (curM >= 60) {
        curH += 1;
        curM = 0;
      }
    }
    return slots;
  }, [startHour, startMin, endHour, endMin]);

  // Check if slot is in the past for today
  const isSlotDisabled = (slot: string) => {
    const now = new Date();
    const isToday =
      selectedDate.getFullYear() === now.getFullYear() &&
      selectedDate.getMonth() === now.getMonth() &&
      selectedDate.getDate() === now.getDate();

    if (!isToday) return false;

    const [slotH, slotM] = slot.split(":").map(Number);
    const slotTime = new Date();
    slotTime.setHours(slotH, slotM, 0, 0);

    // Give 30 min buffer for booking
    return slotTime.getTime() <= now.getTime() + 15 * 60 * 1000;
  };

  const getDayName = (date: Date) => {
    const day = date.getDay();
    if (day === 0) return "CN";
    return `T${day + 1}`;
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  return (
    <View style={styles.container}>
      {/* 1. Thanh chọn ngày */}
      <Text style={styles.sectionLabel}>Chọn ngày đến</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateList}
      >
        {dateOptions.map((date, idx) => {
          const isSelected = isSameDay(date, selectedDate);
          const isToday = idx === 0;
          const isTomorrow = idx === 1;

          let badge = "";
          if (isToday) badge = "Hôm nay";
          else if (isTomorrow) badge = "Ngày mai";

          return (
            <TouchableOpacity
              key={date.toISOString()}
              style={[styles.dateChip, isSelected && styles.dateChipSelected]}
              onPress={() => onSelectDate(date)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.dayOfWeekText,
                  isSelected && styles.dateTextSelected,
                ]}
              >
                {getDayName(date)}
              </Text>
              <Text
                style={[
                  styles.dayOfMonthText,
                  isSelected && styles.dateTextSelected,
                ]}
              >
                {date.getDate()}
              </Text>
              <Text
                style={[
                  styles.monthText,
                  isSelected && styles.dateTextSelected,
                ]}
              >
                Thg {date.getMonth() + 1}
              </Text>
              {Boolean(badge) && (
                <Text
                  style={[
                    styles.badgeText,
                    isSelected && styles.badgeTextSelected,
                  ]}
                >
                  {badge}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 2. Lưới chọn khung giờ */}
      <Text style={[styles.sectionLabel, { marginTop: 14 }]}>
        Chọn khung giờ ({openTime.slice(0, 5)} - {closeTime.slice(0, 5)})
      </Text>
      <View style={styles.timeGrid}>
        {timeSlots.map((slot) => {
          const isSelected = selectedTime === slot;
          const disabled = isSlotDisabled(slot);

          return (
            <TouchableOpacity
              key={slot}
              style={[
                styles.timeSlot,
                isSelected && styles.timeSlotSelected,
                disabled && styles.timeSlotDisabled,
              ]}
              onPress={() => onSelectTime(slot)}
              disabled={disabled}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.timeSlotText,
                  isSelected && styles.timeSlotTextSelected,
                  disabled && styles.timeSlotTextDisabled,
                ]}
              >
                {slot}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
  },
  dateList: {
    gap: 8,
    paddingVertical: 4,
  },
  dateChip: {
    width: 68,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  dateChipSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  dayOfWeekText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 2,
  },
  dayOfMonthText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  monthText: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
  },
  badgeText: {
    fontSize: 9,
    color: "#0284C7",
    fontWeight: "600",
    marginTop: 4,
  },
  badgeTextSelected: {
    color: "#E0F2FE",
  },
  dateTextSelected: {
    color: "#FFFFFF",
  },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  timeSlot: {
    width: "23%",
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  timeSlotSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  timeSlotDisabled: {
    backgroundColor: "#F1F5F9",
    borderColor: "#E2E8F0",
    opacity: 0.5,
  },
  timeSlotText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
  },
  timeSlotTextSelected: {
    color: "#FFFFFF",
  },
  timeSlotTextDisabled: {
    color: "#94A3B8",
  },
});

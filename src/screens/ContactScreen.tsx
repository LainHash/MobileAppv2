import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { ContactForm } from "@/features/contact";

export default function ContactScreen() {
  const handleCallHotline = () => {
    Linking.openURL("tel:19008888");
  };

  const handleSendEmail = () => {
    Linking.openURL("mailto:support@restaurant.com");
  };

  const handleOpenMap = () => {
    const url = Platform.select({
      ios: "maps:0,0?q=Restaurant",
      android: "geo:0,0?q=Restaurant",
      default: "https://maps.google.com",
    });
    Linking.openURL(url);
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          {/* Header Banner */}
          <View style={styles.headerBanner}>
            <Text style={styles.headerTag}>TRUNG TÂM HỖ TRỢ</Text>
            <Text style={styles.headerTitle}>Chúng tôi luôn sẵn sàng lắng nghe bạn</Text>
            <Text style={styles.headerDescription}>
              Mọi đóng góp, câu hỏi hoặc yêu cầu đặt tiệc của quý khách đều là động lực để chúng tôi hoàn thiện mỗi ngày.
            </Text>
          </View>

          {/* Quick Channels Grid */}
          <View style={styles.quickChannelsContainer}>
            <TouchableOpacity
              style={styles.channelCard}
              onPress={handleCallHotline}
              activeOpacity={0.7}
            >
              <View style={[styles.channelIconBox, { backgroundColor: "#FEF3C7" }]}>
                <Text style={styles.channelIcon}>📞</Text>
              </View>
              <Text style={styles.channelTitle}>Hotline đặt bàn</Text>
              <Text style={styles.channelValue}>1900 8888</Text>
              <Text style={styles.channelAction}>Nhấn để gọi ➔</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.channelCard}
              onPress={handleSendEmail}
              activeOpacity={0.7}
            >
              <View style={[styles.channelIconBox, { backgroundColor: "#DBEAFE" }]}>
                <Text style={styles.channelIcon}>✉️</Text>
              </View>
              <Text style={styles.channelTitle}>Hòm thư hỗ trợ</Text>
              <Text style={styles.channelValue}>support@res.vn</Text>
              <Text style={styles.channelAction}>Gửi email ➔</Text>
            </TouchableOpacity>
          </View>

          {/* Office Hours & Address Bar */}
          <View style={styles.infoBar}>
            <View style={styles.infoBarItem}>
              <Text style={styles.infoBarIcon}>⏰</Text>
              <View>
                <Text style={styles.infoBarLabel}>Thời gian hoạt động</Text>
                <Text style={styles.infoBarValue}>08:00 - 22:00 (Hàng ngày)</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.infoBarItem, styles.addressItem]}
              onPress={handleOpenMap}
              activeOpacity={0.7}
            >
              <Text style={styles.infoBarIcon}>📍</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoBarLabel}>Hệ thống chi nhánh</Text>
                <Text style={styles.infoBarValue}>Xem địa chỉ trên bản đồ</Text>
              </View>
              <Text style={styles.arrowIcon}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Contact Form */}
          <ContactForm />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 40,
  },
  contentWrapper: {
    width: "100%",
    maxWidth: 540,
    alignSelf: "center",
  },
  headerBanner: {
    backgroundColor: "#1E1B4B",
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: "#1E1B4B",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  headerTag: {
    fontSize: 11,
    fontWeight: "700",
    color: "#818CF8",
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 28,
    marginBottom: 8,
  },
  headerDescription: {
    fontSize: 13,
    color: "#C7D2FE",
    lineHeight: 20,
  },
  quickChannelsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  channelCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  channelIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  channelIcon: {
    fontSize: 18,
  },
  channelTitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748B",
    marginBottom: 4,
  },
  channelValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
  },
  channelAction: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4F46E5",
  },
  infoBar: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 12,
  },
  infoBarItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  addressItem: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  infoBarIcon: {
    fontSize: 20,
  },
  infoBarLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
  },
  infoBarValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1E293B",
  },
  arrowIcon: {
    fontSize: 20,
    color: "#94A3B8",
    fontWeight: "700",
  },
});

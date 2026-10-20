import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  ViewStyle,
} from "react-native";
import { Image } from "expo-image";
import * as Clipboard from "expo-clipboard";
import { PaymentQrResponse, OrderPaymentStatusResponse } from "../types/order";
import { usePaymentStatusPolling } from "../hooks/usePaymentStatusPolling";
import { formatCurrency } from "@/common/helpers";

export interface PaymentQrCardProps {
  orderId?: string | null;
  payment: PaymentQrResponse;
  isInitiallyPaid?: boolean;
  onPaymentSuccess?: (status: OrderPaymentStatusResponse) => void;
  style?: ViewStyle;
}

export function PaymentQrCard({
  orderId,
  payment,
  isInitiallyPaid = false,
  onPaymentSuccess,
  style,
}: PaymentQrCardProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const {
    isPaid: pollingIsPaid,
    isPolling,
    checkNow,
  } = usePaymentStatusPolling({
    orderId,
    enabled: Boolean(orderId) && !isInitiallyPaid,
    onPaymentSuccess,
  });

  const isPaid = isInitiallyPaid || pollingIsPaid;

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await Clipboard.setStringAsync(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <View style={[styles.card, style]}>
      {/* Status Banner */}
      {isPaid ? (
        <View style={[styles.statusBanner, styles.paidBanner]}>
          <Text style={styles.bannerIcon}>✅</Text>
          <View style={styles.bannerTextWrap}>
            <Text style={styles.paidTitle}>Đã nhận thanh toán thành công</Text>
            <Text style={styles.paidSub}>
              Hệ thống đã tự động ghi nhận giao dịch của bạn!
            </Text>
          </View>
        </View>
      ) : (
        <View style={[styles.statusBanner, styles.waitingBanner]}>
          <ActivityIndicator size="small" color="#2563EB" />
          <View style={styles.bannerTextWrap}>
            <Text style={styles.waitingTitle}>Đang chờ chuyển khoản</Text>
            <Text style={styles.waitingSub}>
              Hệ thống sẽ tự động xác nhận ngay khi nhận được tiền
            </Text>
          </View>
        </View>
      )}

      {/* QR Code section */}
      {!isPaid && payment.qrCodeUrl ? (
        <View style={styles.qrContainer}>
          <Image
            source={{ uri: payment.qrCodeUrl }}
            style={styles.qrImage}
            contentFit="contain"
            transition={200}
          />
          <Text style={styles.qrTip}>
            Mở ứng dụng Ngân hàng hoặc Ví điện tử để quét mã QR
          </Text>
        </View>
      ) : null}

      {/* Bank Account Details */}
      <View style={styles.detailsContainer}>
        {/* Bank */}
        <View style={styles.row}>
          <Text style={styles.label}>Ngân hàng:</Text>
          <Text style={styles.valueBold}>{payment.bankCode}</Text>
        </View>

        {/* Account Number */}
        <View style={styles.row}>
          <Text style={styles.label}>Số tài khoản:</Text>
          <View style={styles.valueWithCopy}>
            <Text style={styles.valueHighlight}>{payment.accountNumber}</Text>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={() =>
                copyToClipboard(payment.accountNumber, "accountNumber")
              }
              activeOpacity={0.7}
            >
              <Text style={styles.copyButtonText}>
                {copiedKey === "accountNumber" ? "✓ Đã chép" : "Sao chép"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Name */}
        <View style={styles.row}>
          <Text style={styles.label}>Chủ tài khoản:</Text>
          <Text style={styles.valueBold}>
            {payment.accountName?.toUpperCase()}
          </Text>
        </View>

        {/* Amount */}
        <View style={styles.row}>
          <Text style={styles.label}>Số tiền:</Text>
          <View style={styles.valueWithCopy}>
            <Text style={styles.amountValue}>
              {formatCurrency(payment.amount)}
            </Text>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={() =>
                copyToClipboard(String(payment.amount), "amount")
              }
              activeOpacity={0.7}
            >
              <Text style={styles.copyButtonText}>
                {copiedKey === "amount" ? "✓ Đã chép" : "Sao chép"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Transfer Content */}
        <View style={styles.row}>
          <Text style={styles.label}>Nội dung CK:</Text>
          <View style={styles.valueWithCopy}>
            <Text style={styles.contentValue}>{payment.transferContent}</Text>
            <TouchableOpacity
              style={[styles.copyButton, styles.copyButtonActive]}
              onPress={() =>
                copyToClipboard(payment.transferContent, "transferContent")
              }
              activeOpacity={0.7}
            >
              <Text style={styles.copyButtonActiveText}>
                {copiedKey === "transferContent" ? "✓ Đã chép" : "Sao chép"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Manual Check button if not paid */}
      {!isPaid && (
        <TouchableOpacity
          style={styles.checkButton}
          onPress={() => checkNow()}
          disabled={isPolling}
          activeOpacity={0.8}
        >
          {isPolling ? (
            <View style={styles.checkingRow}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.checkButtonText}>Đang tự động kiểm tra...</Text>
            </View>
          ) : (
            <Text style={styles.checkButtonText}>
              🔄 Kiểm tra trạng thái thanh toán
            </Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  waitingBanner: {
    backgroundColor: "#EFF6FF",
    borderColor: "#BFDBFE",
    borderWidth: 1,
  },
  paidBanner: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
    borderWidth: 1,
  },
  bannerIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  bannerTextWrap: {
    flex: 1,
    marginLeft: 8,
  },
  waitingTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E40AF",
  },
  waitingSub: {
    fontSize: 12,
    color: "#3B82F6",
    marginTop: 2,
  },
  paidTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#065F46",
  },
  paidSub: {
    fontSize: 12,
    color: "#059669",
    marginTop: 2,
  },
  qrContainer: {
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  qrImage: {
    width: 230,
    height: 230,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  qrTip: {
    marginTop: 10,
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    paddingHorizontal: 16,
  },
  detailsContainer: {
    gap: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  label: {
    fontSize: 13,
    color: "#64748B",
    width: 100,
  },
  valueBold: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
    flex: 1,
    textAlign: "right",
  },
  valueWithCopy: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },
  valueHighlight: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
    letterSpacing: 0.5,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#007AFF",
  },
  contentValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#EA580C",
    backgroundColor: "#FFF7ED",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  copyButton: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  copyButtonText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  copyButtonActive: {
    backgroundColor: "#EA580C",
  },
  copyButtonActiveText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  checkButton: {
    marginTop: 16,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },
  checkingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#007AFF",
  },
});

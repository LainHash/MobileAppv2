import React from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { RestaurantTable, TableStatus } from "@/features/territory/tables";

interface TableSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  tables: RestaurantTable[];
  selectedTableIds: string[];
  onToggleTable: (tableId: string) => void;
  isLoading?: boolean;
}

export function TableSelectorModal({
  visible,
  onClose,
  tables,
  selectedTableIds,
  onToggleTable,
  isLoading,
}: TableSelectorModalProps) {
  const availableTables = tables.filter(
    (t) => t.status === TableStatus.Available,
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Chọn bàn theo ý muốn</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.headerSub}>
            Các bàn khả dụng tại chi nhánh. Bạn có thể chọn 1 hoặc nhiều bàn.
          </Text>

          {isLoading ? (
            <ActivityIndicator size="large" style={{ marginVertical: 32 }} />
          ) : availableTables.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Hiện không có bàn trống khả dụng. Nhà hàng sẽ tự động sắp xếp bàn phù hợp cho bạn khi đến.
              </Text>
            </View>
          ) : (
            <FlatList
              data={availableTables}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={styles.columnWrapper}
              contentContainerStyle={styles.tableList}
              renderItem={({ item }) => {
                const isSelected = selectedTableIds.includes(item.id);
                return (
                  <TouchableOpacity
                    style={[
                      styles.tableCard,
                      isSelected && styles.tableCardSelected,
                    ]}
                    onPress={() => onToggleTable(item.id)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.tableNumber,
                        isSelected && styles.tableNumberSelected,
                      ]}
                    >
                      Bàn {item.tableNumber}
                    </Text>
                    <Text
                      style={[
                        styles.tableCapacity,
                        isSelected && styles.tableCapacitySelected,
                      ]}
                    >
                      👥 Sức chứa: {item.capacity} người
                    </Text>
                    {Boolean(item.areaName) && (
                      <Text
                        style={[
                          styles.tableArea,
                          isSelected && styles.tableAreaSelected,
                        ]}
                      >
                        📍 {item.areaName}
                      </Text>
                    )}
                    <View
                      style={[
                        styles.checkCircle,
                        isSelected && styles.checkCircleSelected,
                      ]}
                    >
                      {isSelected && <Text style={styles.checkIcon}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}

          <TouchableOpacity style={styles.confirmButton} onPress={onClose}>
            <Text style={styles.confirmButtonText}>
              Xác nhận ({selectedTableIds.length} bàn đã chọn)
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  closeButton: {
    padding: 6,
  },
  closeText: {
    fontSize: 18,
    color: "#64748B",
  },
  headerSub: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
    marginBottom: 12,
  },
  tableList: {
    paddingBottom: 16,
  },
  columnWrapper: {
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 8,
  },
  tableCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    position: "relative",
  },
  tableCardSelected: {
    backgroundColor: "#EFF6FF",
    borderColor: "#007AFF",
  },
  tableNumber: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1E293B",
  },
  tableNumberSelected: {
    color: "#007AFF",
  },
  tableCapacity: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },
  tableCapacitySelected: {
    color: "#1D4ED8",
  },
  tableArea: {
    fontSize: 11,
    color: "#0284C7",
    marginTop: 2,
    fontWeight: "500",
  },
  tableAreaSelected: {
    color: "#0369A1",
  },
  checkCircle: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    justifyContent: "center",
    alignItems: "center",
  },
  checkCircleSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  checkIcon: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },
  confirmButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});

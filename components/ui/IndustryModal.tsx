import { getPaginationInfo } from "@/api/reminders/useGetReminders";
import {
  flattenIndustries,
  searchIndustries,
  useIndustries,
} from "@/api/settings/useGetIndustries";
import { initializeIndustriesMap } from "@/api/settings/useGetUserDetails";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ✅ Updated type to accept industry objects with id
export const IndustryBottomSheet = ({
  visible,
  selectedValue,
  onSelect,
  onClose,
  title,
}: {
  visible: boolean;
  selectedValue: string;
  onSelect: (value: { id: number; name: string }) => void; // ✅ Changed to accept object
  onClose: () => void;
  title: string;
}) => {
  const slideAnim = useState(new Animated.Value(500))[0];
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredIndustries, setFilteredIndustries] = useState<any[]>([]); // ✅ Changed to any[] for objects

  // Fetch industries data with pagination
  const {
    data,
    isLoading,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useIndustries({
    per_page: 20,
  });

  // Flatten all loaded industries from pages
  const allIndustries = flattenIndustries(data);
  const paginationInfo = getPaginationInfo(data);

  // Handle search and filtering
  useEffect(() => {
    if (allIndustries?.length > 0) {
      // ✅ Initialize the industries map when data loads
      initializeIndustriesMap(allIndustries);

      if (searchQuery.trim()) {
        // Search in industries
        const searched = searchIndustries(allIndustries, searchQuery);
        setFilteredIndustries(searched); // ✅ Keep as objects
      } else {
        // Show all sorted industries
        setFilteredIndustries(allIndustries); // ✅ Keep as objects
      }
    }
  }, [allIndustries, searchQuery]);

  // Slide animation
  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 500,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // ✅ Updated to pass industry object
  const handleSelect = (industry: any) => {
    onSelect({
      id: industry.id,
      name: industry.name,
    });
    setSearchQuery(""); // Clear search on selection
    onClose();
  };

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  // Handle end of list reached
  const handleEndReached = () => {
    if (hasNextPage && !isFetchingNextPage && !searchQuery) {
      console.log("📄 Loading next page of industries...");
      fetchNextPage();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.bottomSheetOverlay}>
        <TouchableOpacity
          style={styles.bottomSheetBackdrop}
          onPress={onClose}
          activeOpacity={1}
        />
        <Animated.View
          style={[
            styles.bottomSheetContainer,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Handle Bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.bottomSheetHeader}>
            <Text style={styles.bottomSheetTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons
                name="search"
                size={18}
                color="#9CA3AF"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search industries..."
                placeholderTextColor="#D1D5DB"
                value={searchQuery}
                onChangeText={setSearchQuery}
                editable={!isLoading}
              />
              {searchQuery?.length > 0 && (
                <TouchableOpacity
                  onPress={handleClearSearch}
                  style={styles.clearButton}
                >
                  <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Divider */}
          <View style={styles.bottomSheetDivider} />

          {/* Loading State - Initial Load */}
          {isLoading && allIndustries?.length === 0 && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#9A1B2B" />
              <Text style={styles.loadingText}>Loading industries...</Text>
            </View>
          )}

          {/* Error State */}
          {error && allIndustries?.length === 0 && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={24} color="#EF4444" />
              <Text style={styles.errorText}>Failed to load industries</Text>
            </View>
          )}

          {/* Empty State */}
          {!isLoading &&
            !error &&
            filteredIndustries?.length === 0 &&
            allIndustries?.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="search" size={32} color="#D1D5DB" />
                <Text style={styles.emptyText}>No industries available</Text>
              </View>
            )}

          {/* No Search Results */}
          {!isLoading &&
            !error &&
            filteredIndustries?.length === 0 &&
            allIndustries?.length > 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="search" size={32} color="#D1D5DB" />
                <Text style={styles.emptyText}>No industries found</Text>
              </View>
            )}

          {/* Options List with Infinite Scroll */}
          {!isLoading && !error && filteredIndustries?.length > 0 && (
            <FlatList
              data={filteredIndustries}
              keyExtractor={(item) => `${item.id}`} // ✅ Use id as key
              scrollEnabled={filteredIndustries?.length > 6}
              onEndReached={handleEndReached}
              onEndReachedThreshold={0.3}
              ListFooterComponent={
                isFetchingNextPage ? (
                  <View style={styles.paginationLoader}>
                    <ActivityIndicator size="small" color="#9A1B2B" />
                    <Text style={styles.loadingMoreText}>Loading more...</Text>
                  </View>
                ) : null
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.bottomSheetOption,
                    selectedValue === item.name &&
                    styles.bottomSheetOptionSelected,
                  ]}
                  onPress={() => handleSelect(item)} // ✅ Pass whole object
                >
                  <Text
                    style={[
                      styles.bottomSheetOptionText,
                      selectedValue === item.name &&
                      styles.bottomSheetOptionTextSelected,
                    ]}
                  >
                    {item.name}
                  </Text>
                  {selectedValue === item.name && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#9A1B2B"
                    />
                  )}
                </TouchableOpacity>
              )}
            />
          )}

          {/* Result Count & Pagination Info */}
          {!isLoading && !error && filteredIndustries?.length > 0 && (
            <View style={styles.resultCountContainer}>
              <View style={styles.resultInfoRow}>
                <Text style={styles.resultCountText}>
                  {filteredIndustries?.length} result
                  {filteredIndustries?.length !== 1 ? "s" : ""}
                </Text>
                {!searchQuery && (
                  <Text style={styles.paginationText}>
                    of {paginationInfo.total} total
                  </Text>
                )}
              </View>
              {hasNextPage && !searchQuery && (
                <Text style={styles.scrollHintText}>↓ Scroll to load more</Text>
              )}
            </View>
          )}

          {/* Safe Area Padding */}
          <View style={styles.bottomSheetPadding} />
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // ============ BOTTOM SHEET STYLES ============
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  bottomSheetBackdrop: {
    flex: 1,
  },
  bottomSheetContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 12,
  },
  bottomSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },

  // ============ SEARCH BAR STYLES ============
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#F9FAFB",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#1F2937",
    fontWeight: "500",
    paddingVertical: 10,
  },
  clearButton: {
    padding: 4,
  },

  // ============ DIVIDER ============
  bottomSheetDivider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 20,
  },

  // ============ LIST STYLES ============
  bottomSheetList: {
    maxHeight: 800,
  },
  bottomSheetOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  bottomSheetOptionSelected: {
    backgroundColor: "rgba(154, 27, 43, 0.05)",
  },
  bottomSheetOptionText: {
    fontSize: 15,
    color: "#6B7280",
    fontWeight: "600",
    flex: 1,
  },
  bottomSheetOptionTextSelected: {
    color: "#9A1B2B",
    fontWeight: "700",
  },

  // ============ STATE STYLES ============
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
  },

  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 12,
  },
  errorText: {
    fontSize: 14,
    color: "#EF4444",
    fontWeight: "600",
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    fontWeight: "600",
  },

  // ============ PAGINATION STYLES ============
  paginationLoader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
  },

  resultCountContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  resultInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  resultCountText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
  },
  paginationText: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  scrollHintText: {
    fontSize: 12,
    color: "#9CA3AF",
    fontStyle: "italic",
    fontWeight: "500",
  },

  // ============ PADDING ============
  bottomSheetPadding: {
    height: 20,
  },
});

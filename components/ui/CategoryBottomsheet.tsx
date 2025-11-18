import {
    flattenCategories,
    getPaginationInfo,
    getSortedCategories,
    searchCategories,
    useCategories,
} from "@/api/addReminder/useGetCategories";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    FlatList,
    Modal,
    NativeScrollEvent,
    NativeSyntheticEvent,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export const CategoryBottomSheet = ({
  visible,
  selectedValue,
  onSelect,
  onClose,
  title,
}: {
  visible: boolean;
  selectedValue: string;
  onSelect: (value: string) => void;
  onClose: () => void;
  title: string;
}) => {
  const slideAnim = useState(new Animated.Value(500))[0];
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCategories, setFilteredCategories] = useState<string[]>([]);
  const flatListRef = useRef<FlatList>(null);

  // Use infinite query hook - just like useReminders!
  const {
    data,
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useCategories(searchQuery);

  // Flatten all loaded categories from all pages
  const allLoadedCategories = flattenCategories(data);
  const paginationInfo = getPaginationInfo(data);

  // Handle search and filtering
  useEffect(() => {
    if (allLoadedCategories?.length > 0) {
      if (searchQuery.trim()) {
        // Search in categories
        const searched = searchCategories(allLoadedCategories, searchQuery);
        const names = getSortedCategories(searched);
        setFilteredCategories(names);
      } else {
        // Show all sorted categories
        const names = getSortedCategories(allLoadedCategories);
        setFilteredCategories(names);
      }
    }
  }, [allLoadedCategories, searchQuery]);

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
  }, [visible, slideAnim]);

  // Handle scroll for pagination
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;

    // Check if user scrolled near the bottom
    const isNearBottom =
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom;

    // Load more if near bottom and more pages available
    if (
      isNearBottom &&
      hasNextPage &&
      !isFetchingNextPage &&
      !searchQuery.trim() // Don't paginate while searching
    ) {
      fetchNextPage();
    }
  };

  const handleSelect = (value: string) => {
    onSelect(value);
    setSearchQuery(""); // Clear search on selection
    onClose();
  };

  const handleClearSearch = () => {
    setSearchQuery("");
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
                placeholder="Search categories..."
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

          {/* Loading State - Initial Load Only */}
          {isLoading && allLoadedCategories?.length === 0 && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#9A1B2B" />
              <Text style={styles.loadingText}>Loading categories...</Text>
            </View>
          )}

          {/* Error State - Only on initial load */}
          {error && allLoadedCategories?.length === 0 && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={24} color="#EF4444" />
              <Text style={styles.errorText}>Failed to load categories</Text>
            </View>
          )}

          {/* Empty State */}
          {!isLoading &&
            !error &&
            filteredCategories?.length === 0 &&
            allLoadedCategories?.length === 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="search" size={32} color="#D1D5DB" />
                <Text style={styles.emptyText}>No categories available</Text>
              </View>
            )}

          {/* No Search Results */}
          {!isLoading &&
            !error &&
            filteredCategories?.length === 0 &&
            allLoadedCategories?.length > 0 && (
              <View style={styles.emptyContainer}>
                <Ionicons name="search" size={32} color="#D1D5DB" />
                <Text style={styles.emptyText}>No categories found</Text>
              </View>
            )}

          {/* Options List - Shows even while loading next page */}
          {filteredCategories?.length > 0 && (
            <FlatList
              ref={flatListRef}
              data={filteredCategories}
              keyExtractor={(item, index) => `${item}-${index}`}
              scrollEnabled={filteredCategories?.length > 6}
              style={styles.bottomSheetList}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.bottomSheetOption,
                    selectedValue === item && styles.bottomSheetOptionSelected,
                  ]}
                  onPress={() => handleSelect(item)}
                >
                  <Text
                    style={[
                      styles.bottomSheetOptionText,
                      selectedValue === item &&
                        styles.bottomSheetOptionTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                  {selectedValue === item && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#9A1B2B"
                    />
                  )}
                </TouchableOpacity>
              )}
              ListFooterComponent={
                isFetchingNextPage && !searchQuery.trim() ? (
                  <View style={styles.loadMoreContainer}>
                    <ActivityIndicator size="small" color="#9A1B2B" />
                    <Text style={styles.loadMoreText}>Loading more...</Text>
                  </View>
                ) : null
              }
            />
          )}

          {/* Result Count & Pagination Info */}
          {!isLoading && !error && filteredCategories?.length > 0 && (
            <View style={styles.resultCountContainer}>
              <View style={styles.resultInfoRow}>
                <Text style={styles.resultCountText}>
                  {filteredCategories?.length} result
                  {filteredCategories?.length !== 1 ? "s" : ""}
                </Text>
                {!searchQuery && (
                  <Text style={styles.paginationText}>
                    of {paginationInfo.total} total
                  </Text>
                )}
              </View>
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
    maxHeight: 400,
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

  // ============ LOAD MORE STYLES ============
  loadMoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  loadMoreText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },

  // ============ PAGINATION STYLES ============
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

  // ============ PADDING ============
  bottomSheetPadding: {
    height: 20,
  },
});

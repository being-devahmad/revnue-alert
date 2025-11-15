import { Ionicons } from "@expo/vector-icons"
import { useEffect } from "react"
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native"

export const DropdownField = ({
    label,
    value,
    options,
    showDropdown,
    onToggle,
    onSelect,
    required,
    placeholder
}: {
    label: string
    value: string
    options: string[]
    showDropdown: boolean
    onToggle: () => void
    onSelect: (value: string) => void
    required?: boolean
    placeholder?: string
}) => {


    useEffect(() => {
        if (value === "" && showDropdown) {
            onToggle(); // or explicitly call to close
        }
    }, [value]);


    return (
        <View style={[styles.fieldContainer, showDropdown && styles.fieldContainerActive]}>
            <Text style={styles.label}>{label}
                {required && <Text style={styles.required}> *</Text>}
            </Text>
            <View style={styles.dropdownButtonWrapper}>
                <TouchableOpacity style={styles.dropdownButton} onPress={onToggle}>
                    <Text style={[
                        styles.dropdownButtonText,
                        !value && styles.dropdownPlaceholder
                    ]}>
                        {value || placeholder || "Select..."}
                    </Text>
                    <Ionicons name={showDropdown ? "chevron-up" : "chevron-down"} size={18} color="#6B7280" />
                </TouchableOpacity>
                {/* ADDED: Clear button when value is selected and field is not required */}
                {value && (
                    <TouchableOpacity
                        style={styles.clearButton}
                        onPress={(e) => {
                            e.stopPropagation();
                            onSelect(""); 
                        }}
                    >
                        <Ionicons name="close-circle" size={20} color="#EF4444" />
                    </TouchableOpacity>
                )}
            </View>
            {showDropdown && (
                <View style={styles.dropdownContainer}>
                    <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                        {options.map((option, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[styles.dropdownItem, option === value && styles.dropdownItemSelected]}
                                onPress={() => onSelect(option)}
                            >
                                <Text style={[styles.dropdownItemText, option === value && styles.dropdownItemTextSelected]}>
                                    {option}
                                </Text>
                                {option === value && <Ionicons name="checkmark" size={18} color="#9A1B2B" />}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    fieldContainer: {
        position: "relative",
        zIndex: 1,
    },
    fieldContainerActive: {
        zIndex: 9999,
    },
    label: {
        fontSize: 13,
        color: "#374151",
        marginBottom: 6,
        fontWeight: "500",
    },
    required: {
        color: '#EF4444',
    },
    // ADDED: Wrapper for dropdown button and clear button
    dropdownButtonWrapper: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    dropdownButton: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#F9FAFB",
        borderRadius: 8,
        paddingVertical: 11,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    dropdownButtonText: {
        fontSize: 14,
        color: "#111827",
    },
    // ADDED: Placeholder style
    dropdownPlaceholder: {
        color: "#9CA3AF",
    },
    // ADDED: Clear button style
    clearButton: {
        padding: 4,
    },
    dropdownContainer: {
        position: "absolute",
        top: "100%",
        left: 0,
        right: 0,
        marginTop: 4,
        backgroundColor: "#FFFFFF",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 10,
        zIndex: 10000,
        overflow: "hidden",
    },
    dropdownScroll: {
        maxHeight: 180,
    },
    dropdownItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    dropdownItemSelected: {
        backgroundColor: "#F9FAFB",
    },
    dropdownItemText: {
        fontSize: 14,
        color: "#111827",
    },
    dropdownItemTextSelected: {
        fontWeight: "600",
        color: "#9A1B2B",
    },

    dropdownMenu: {
        position: "absolute",
        top: 60, // Adjusted to position below the dropdown button (label + button height)
        left: 0,
        right: 0,
        backgroundColor: "white",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 5,
        zIndex: 6000, // Extremely high zIndex to ensure it's above all other elements
        maxHeight: 180, // Constrain height
    },
})
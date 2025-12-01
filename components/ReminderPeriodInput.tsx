// ============ HELPER FUNCTIONS ============

/**
 * ISO 8601 Duration Format Mappings
 * P = Period, D = Days, W = Weeks, M = Months, Y = Years
 */
// ============ COMPONENT ============

import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

const DURATION_FORMATS = {
    days: (num: number) => `P${num}D`,
    weeks: (num: number) => `P${num}W`,
    months: (num: number) => `P${num}M`,
    years: (num: number) => `P${num}Y`,
}

/**
 * Generate dropdown options based on input number
 * @param num - The number entered by user
 * @returns Array of {label, value} for dropdown
 */
const generateDurationOptions = (num: number) => {
    if (!num || num <= 0) return [];

    return [
        { label: `${num} Days`, value: DURATION_FORMATS.days(num) },
        { label: `${num} Weeks`, value: DURATION_FORMATS.weeks(num) },
        { label: `${num} Months`, value: DURATION_FORMATS.months(num) },
        { label: `${num} Years`, value: DURATION_FORMATS.years(num) },
    ];
};

/**
 * Convert duration format to readable text
 * @param duration - ISO 8601 duration string (e.g., "P30D", "P1M")
 * @returns Human-readable text (e.g., "30 Days", "1 Month")
 */
const formatDurationForDisplay = (duration: string): string => {
    if (!duration) return "";

    // Parse ISO 8601 duration format
    const regex = /^P(\d+)?([DWMY])$/;
    const match = duration.match(regex);

    if (!match) return duration; // Return as-is if format doesn't match

    const [, number, unit] = match;
    const num = parseInt(number || "1", 10);

    const unitMap: Record<string, string> = {
        D: "Days",
        W: "Weeks",
        M: "Months",
        Y: "Years",
    };

    return `${num} ${unitMap[unit]}`;
};

/**
 * Validate if value is valid ISO 8601 duration
 * @param value - Value to validate
 * @returns true if valid
 */
const isValidDuration = (value: string): boolean => {
    const regex = /^P(\d+)([DWMY])$/;
    return regex.test(value);
};

interface ReminderPeriodInputProps {
    value: string; // ISO 8601 format (e.g., "P30D")
    onChange: (value: string) => void;
    label?: string;
    required?: boolean;
    placeholder?: string;
}

export const ReminderPeriodInput: React.FC<ReminderPeriodInputProps> = ({
    value,
    onChange,
    label = "Reminder Period",
    required = false,
    placeholder = "Enter number (e.g., 30)",
}) => {
    const [inputValue, setInputValue] = useState<string>("");
    const [showDropdown, setShowDropdown] = useState(false);
    const [durationOptions, setDurationOptions] = useState<
        { label: string; value: string }[]
    >([]);

    // Handle input change
    const handleInputChange = (text: string) => {
        // Only allow numbers
        const numericOnly = text.replace(/[^0-9]/g, "");
        setInputValue(numericOnly);

        // Generate dropdown options
        if (numericOnly) {
            const num = parseInt(numericOnly, 10);
            const options = generateDurationOptions(num);
            setDurationOptions(options);
            setShowDropdown(true);
            console.log("📋 Generated options for", numericOnly, ":", options);
        } else {
            setShowDropdown(false);
            setDurationOptions([]);
        }
    };

    // Handle option selection
    const handleSelectDuration = (selectedValue: string, selectedLabel: string) => {
        console.log("✅ Selected:", selectedLabel, "->", selectedValue);
        onChange(selectedValue); // Send ISO format to parent
        setInputValue(""); // Clear input
        setShowDropdown(false);
        setDurationOptions([]);
    };

    // Get display text
    const displayText = value ? formatDurationForDisplay(value) : "Select reminder period";

    return (
        <View style={styles.container}>
            <Text style={styles.label}>
                {label} {required && <Text style={styles.required}>*</Text>}
            </Text>

            {/* Single Input Field */}
            <View style={styles.inputWrapper}>
                <TextInput
                    style={styles.input}
                    placeholder={value ? formatDurationForDisplay(value) : placeholder}
                    placeholderTextColor="#000"
                    value={inputValue}
                    onChangeText={handleInputChange}
                    keyboardType="numeric"
                    maxLength={3}
                />
                {inputValue && (
                    <TouchableOpacity
                        onPress={() => {
                            setInputValue("");
                            setShowDropdown(false);
                            setDurationOptions([]);
                        }}
                        style={styles.clearButton}
                    >
                        <Ionicons name="close" size={16} color="#9CA3AF" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Dropdown Options */}
            {showDropdown && durationOptions.length > 0 && (
                <View style={styles.dropdown}>
                    <ScrollView scrollEnabled={false} style={styles.dropdownScroll}>
                        {durationOptions.map((option, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.dropdownItem}
                                onPress={() => handleSelectDuration(option.value, option.label)}
                            >
                                <Text style={styles.dropdownItemText}>{option.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    );

};

const styles = StyleSheet.create({
    container: {
        position: "relative",
        marginBottom: 16,
    },
    label: {
        fontSize: 13,
        color: "#374151",
        marginBottom: 8,
        fontWeight: "500",
    },
    required: {
        color: "#EF4444",
    },
    selectedValue: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#F9FAFB",
        borderRadius: 8,
        paddingVertical: 11,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        marginBottom: 8,
    },
    selectedValueText: {
        fontSize: 14,
        color: "#111827",
        fontWeight: "500",
        flex: 1,
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        position: "relative",
    },
    input: {
        flex: 1,
        backgroundColor: "#F9FAFB",
        borderRadius: 8,
        paddingVertical: 11,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        fontSize: 14,
        color: "#111827",
    },
    clearButton: {
        position: "absolute",
        right: 12,
        padding: 4,
    },
    dropdown: {
        position: "absolute",
        top: "100%",
        left: 0,
        right: 0,
        marginTop: 4,
        backgroundColor: "white",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
        zIndex: 1000,
        overflow: "hidden",
    },
    dropdownScroll: {
        maxHeight: 180,
    },
    dropdownItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
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
        flex: 1,
    },
    dropdownItemTextSelected: {
        fontWeight: "600",
        color: "#9A1B2B",
    },
    debugInfo: {
        marginTop: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: "#FEF3C7",
        borderRadius: 6,
        borderWidth: 1,
        borderColor: "#FCD34D",
    },
    debugText: {
        fontSize: 11,
        color: "#92400E",
    },
    debugValue: {
        fontWeight: "700",
        color: "#9A1B2B",
    },
});
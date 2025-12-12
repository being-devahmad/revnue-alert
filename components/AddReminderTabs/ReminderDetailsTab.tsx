import { Ionicons } from "@expo/vector-icons";
import type React from "react";
import { useRef, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from "react-native";
import { ReminderPeriodInput } from "../ReminderPeriodInput";
import { RichTextEditor, RichTextEditorRef } from "../RichTextEditor";
import { DropdownField } from "../ui/DropdownField";

interface ReminderDetailsProps {
    reminderForm: {
        period: string;
        quantity: string;
        notes: string;
        resendICal: boolean;
    };
    contactInputs: string[];
    onReminderChange: (field: string, value: string | boolean | string[]) => void;
    onContactChange: (index: number, value: string) => void;
    onAddContact: () => void;
    onRemoveContact: (index: number) => void;
    onSave: () => void;
    onCancel: () => void;
    isLoading: boolean;
}

export const ReminderDetails: React.FC<ReminderDetailsProps> = ({
    reminderForm,
    contactInputs,
    onReminderChange,
    onContactChange,
    onAddContact,
    onRemoveContact,
    onSave,
    onCancel,
    isLoading,
}) => {

    console.log('reminder-form==>', reminderForm)

    const [showDropdowns, setShowDropdowns] = useState({
        quantity: false,
        templates: false,
    });
    const richEditorRef = useRef<RichTextEditorRef>(null);

    const [selectedTemplate, setSelectedTemplate] = useState<string>("");

    const remindersToSendOptions = [
        "0 - Send no reminders",
        "1 - Send single reminder",
        "2 - Send reminders and final reminder",
        "3 - Send initial, secondary and final reminder",
    ];

    // Template options for the dropdown
    const templateOptions = [
        "Internal Email Reminder",
        "Service Request to Supplier",
        "Non Renewal/ Termination Notice to Suppler",
        "Certificate of Insurance Request to Supplier",
    ];

    const closeAllDropdowns = () => {
        setShowDropdowns({
            quantity: false,
            templates: false,
        });
    };

    const toggleDropdown = (dropdown: keyof typeof showDropdowns) => {
        setShowDropdowns((prev) => ({ ...prev, [dropdown]: !prev[dropdown] }));
    };

    const handleTemplateSelect = (template: string) => {
        // You can add logic here to populate the notes field with the selected template
        // For now, it just closes the dropdown
        setSelectedTemplate(template);
        toggleDropdown("templates");
        // Example: onReminderChange("notes", getTemplateContent(template))
    };

    return (
        <>
            <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag" >
                <TouchableWithoutFeedback onPress={() => { }}>
                    <View>
                        {/* Reminder Details */}
                        <View
                            style={[
                                styles.card,
                                (showDropdowns.quantity || showDropdowns.templates) &&
                                styles.cardActive,
                            ]}
                        >
                            <View style={styles.cardHeader}>
                                <Ionicons name="information-circle" size={20} color="#9A1B2B" />
                                <Text style={styles.cardTitle}>Reminder Details</Text>
                            </View>

                            <View style={styles.section}>
                                {/* New Dynamic Reminder Period Input */}
                                <ReminderPeriodInput
                                    value={reminderForm.period}
                                    onChange={(value) => onReminderChange("period", value)}
                                    label="Reminder Period"
                                    required={true}
                                    placeholder="Enter number (e.g., 30, 5, 90...)"
                                />
                                <DropdownField
                                    label="Reminders to Send"
                                    value={reminderForm.quantity}
                                    options={remindersToSendOptions}
                                    showDropdown={showDropdowns.quantity}
                                    onToggle={() => {
                                        if (!showDropdowns.quantity) {
                                            closeAllDropdowns();
                                        }
                                        toggleDropdown("quantity");
                                    }}
                                    onSelect={(value) => {
                                        onReminderChange("quantity", value);
                                        toggleDropdown("quantity");
                                    }}
                                    required={true}
                                />

                                {/* Contacts Section */}
                                <View style={styles.contactsSection}>
                                    <Text style={styles.label}>
                                        Contacts <Text style={styles.required}>*</Text>
                                    </Text>
                                    {contactInputs.map((contact, index) => (
                                        <View key={index} style={styles.contactRow}>
                                            <TextInput
                                                style={[styles.input, styles.contactInput]}
                                                value={contact}
                                                onChangeText={(text) => onContactChange(index, text)}
                                                placeholder="Enter email address"
                                                placeholderTextColor="#9CA3AF"
                                                keyboardType="email-address"
                                            />
                                            {contactInputs.length > 1 && (
                                                <TouchableOpacity
                                                    style={styles.removeContactBtn}
                                                    onPress={() => onRemoveContact(index)}
                                                >
                                                    <Ionicons name="close-circle" size={22} color="#EF4444" />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    ))}
                                    <TouchableOpacity
                                        style={styles.addContactBtn}
                                        onPress={onAddContact}
                                    >
                                        <Ionicons name="person-add" size={16} color="white" />
                                        <Text style={styles.addContactText}>Add Contact</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Notes with Rich Text Editor */}
                                <View style={styles.inputGroup}>
                                    {/* Header */}
                                    <View style={styles.notesHeaderWrapper}>
                                        <View style={{ flexDirection: 'column' }}>
                                            <Text style={styles.label}>
                                                Notes
                                            </Text>

                                            <Text style={{ fontSize: 10 }}>(sent with reminder)</Text>
                                        </View>

                                        {/* Template Dropdown */}
                                        {/* <View style={styles.templateDropdownWrapper}>
                                    <TouchableOpacity
                                        style={styles.templateButton}
                                        onPress={() => {
                                            if (!showDropdowns.templates) closeAllDropdowns();
                                            toggleDropdown("templates");
                                        }}
                                    >
                                        <Ionicons
                                            name="document-text-outline"
                                            size={14}
                                            color="#9A1B2B"
                                        />
                                        <Text
                                            numberOfLines={1}
                                            ellipsizeMode="tail"
                                            style={styles.templateButtonText}
                                        >
                                            {selectedTemplate || "Reminder Email Templates"}
                                        </Text>
                                        <Ionicons
                                            name={
                                                showDropdowns.templates ? "chevron-up" : "chevron-down"
                                            }
                                            size={14}
                                            color="#9A1B2B"
                                        />
                                    </TouchableOpacity>

                                    {showDropdowns.templates && (
                                        <View style={styles.templateDropdownMenu}>
                                            <ScrollView style={styles.dropdownScroll}>
                                                {templateOptions.map((template, index) => (
                                                    <TouchableOpacity
                                                        key={index}
                                                        style={styles.dropdownItem}
                                                        onPress={() => handleTemplateSelect(template)}
                                                    >
                                                        <Text style={styles.dropdownItemText}>
                                                            {template}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </ScrollView>
                                        </View>
                                    )}
                                </View> */}
                                    </View>

                                    <View style={{ minHeight: 180 }}>
                                        <RichTextEditor
                                            ref={richEditorRef}
                                            value={reminderForm.notes}
                                            onChangeText={(text) => onReminderChange("notes", text)}
                                            placeholder="Enter formatted notes..."
                                            style={{ flex: 1 }}
                                        />
                                    </View>

                                </View>

                                {/* Resend iCal Switch */}
                                <View style={styles.switchRow}>
                                    <Text style={styles.switchLabel}>
                                        Send iCal (sent with reminder)
                                    </Text>
                                    <Switch
                                        value={reminderForm.resendICal}
                                        onValueChange={(value) => onReminderChange("resendICal", value)}
                                        trackColor={{ false: "#E5E7EB", true: "#9A1B2B" }}
                                        thumbColor={reminderForm.resendICal ? "#ffffff" : "#f4f3f4"}
                                        ios_backgroundColor="#E5E7EB"
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Attachments */}
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Ionicons name="attach" size={20} color="#9A1B2B" />
                                <Text style={styles.cardTitle}>
                                    Add Attachments to Notifications{" "}
                                    <Text style={{ fontSize: 10, color: "#6B7280" }}>
                                        (Max upload size: 16MB)
                                    </Text>
                                </Text>
                            </View>
                            <View style={styles.section}>
                                <TouchableOpacity style={styles.attachmentButton} disabled>
                                    <Ionicons name="cloud-upload-outline" size={24} color="#6B7280" />
                                    <Text style={styles.attachmentButtonText}>Choose Files</Text>
                                    <Text style={styles.attachmentNote}>
                                        Available from portal only
                                    </Text>
                                </TouchableOpacity>
                                <Text style={styles.attachmentWarning}>
                                    Note: Large attachments may be subject to size restrictions by
                                    your mail server or service provider. Please ensure your are not
                                    exceeding any such restrictions or you may not receive the email
                                    notifications.
                                </Text>
                            </View>
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.actionContainer}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
                                <Ionicons name="close" size={18} color="#6B7280" />
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveBtn} onPress={onSave}>
                                <Ionicons name="checkmark" size={18} color="white" />
                                <Text style={styles.saveText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </ScrollView>
        </>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: "white",
        margin: 16,
        marginBottom: 0,
        borderRadius: 12,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    cardActive: {
        zIndex: 100,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
        width: "70%",
    },
    section: {
        gap: 16,
    },
    inputGroup: {
        flex: 1,
        position: "relative",
        zIndex: 2,
    },
    notesHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    label: {
        fontSize: 13,
        color: "#374151",
        marginBottom: 6,
        fontWeight: "500",
    },
    input: {
        backgroundColor: "#F9FAFB",
        borderRadius: 8,
        paddingVertical: 11,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        fontSize: 14,
        color: "#111827",
    },
    required: {
        color: "#EF4444",
        fontSize: 14,
        marginLeft: 2,
    },
    dropdownButton: {
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
    dropdownScroll: {
        maxHeight: 250,
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
    reminderNotesHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        flex: 1,
    },
    templateDropdownContainer: {
        position: "relative",
        zIndex: 10,
    },
    templateButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "#F9FAFB",
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        maxWidth: 200, // prevent overflow
    },
    templateButtonText: {
        fontSize: 12,
        color: "#9A1B2B",
        fontWeight: "600",
        marginHorizontal: 4,
        flexShrink: 1, // text truncates instead of pushing layout
    },
    templateDropdownMenu: {
        position: "absolute",
        top: "100%",
        right: 0,
        marginTop: 4,
        backgroundColor: "#fff",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
        maxHeight: 180,
        width: 220, // fixed width for dropdown
        zIndex: 1000,
    },
    contactsSection: {
        gap: 10,
    },
    contactRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    contactInput: {
        flex: 1,
    },
    removeContactBtn: {
        padding: 4,
    },
    addContactBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#9A1B2B",
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        gap: 6,
    },
    addContactText: {
        color: "white",
        fontSize: 13,
        fontWeight: "600",
    },
    switchRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 8,
    },
    switchLabel: {
        fontSize: 13,
        color: "#374151",
        fontWeight: "500",
        flex: 1,
    },
    checkboxRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginTop: 4,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 2,
        borderColor: "#9A1B2B",
        borderRadius: 4,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "white",
    },
    checkboxLabel: {
        fontSize: 13,
        color: "#374151",
        fontWeight: "500",
    },
    attachmentButton: {
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F9FAFB",
        borderRadius: 8,
        padding: 20,
        borderWidth: 2,
        borderStyle: "dashed",
        borderColor: "#E5E7EB",
        gap: 8,
    },
    attachmentButtonText: {
        fontSize: 14,
        color: "#6B7280",
        fontWeight: "500",
    },
    attachmentNote: {
        fontSize: 12,
        color: "#9CA3AF",
        fontStyle: "italic",
    },
    attachmentWarning: {
        fontSize: 11,
        color: "#6B7280",
        lineHeight: 16,
        marginTop: 8,
    },
    actionContainer: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 12,
        marginTop: 24,
        marginBottom: 40,
        marginHorizontal: 16,
    },
    cancelBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F3F4F6",
        paddingHorizontal: 16,
        paddingVertical: 11,
        borderRadius: 8,
        gap: 8,
    },
    cancelText: {
        color: "#6B7280",
        fontWeight: "600",
        fontSize: 14,
    },
    saveBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#9A1B2B",
        paddingHorizontal: 18,
        paddingVertical: 11,
        borderRadius: 8,
        gap: 8,
    },
    saveText: {
        color: "white",
        fontWeight: "600",
        fontSize: 14,
    },

    notesHeaderWrapper: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
        flexWrap: "nowrap", // ensures header elements stay in one line
    },

    templateDropdownWrapper: {
        position: "relative", // for absolute dropdown
        zIndex: 100,
    },
});

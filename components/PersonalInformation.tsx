import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

const PersonalInformation = () => {
    return (
        <View>
            <View style={styles.sectionHeader}>
                <View style={styles.iconCircle}>
                    <Ionicons name="person-outline" size={20} color="#FFFFFF" />
                </View>
                <Text style={styles.sectionTitle}>Personal Information</Text>
            </View>

            <View style={styles.card}>
                {/* Company Name */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Company Name</Text>
                    <TextInput
                        style={styles.input}
                        value={companyName}
                        onChangeText={setCompanyName}
                        placeholder="Enter company name"
                        placeholderTextColor="#D1D5DB"
                    />
                </View>

                {/* Department */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Branch Name / Department</Text>
                    <TextInput
                        style={styles.input}
                        value={department}
                        onChangeText={setDepartment}
                        placeholder="Enter department"
                        placeholderTextColor="#D1D5DB"
                    />
                </View>

                {/* Industry Dropdown */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Industry</Text>
                    <TouchableOpacity
                        style={styles.selectInput}
                        onPress={() => setShowIndustryModal(true)}
                    >
                        <Text style={styles.selectText}>
                            {industry || "Select Industry"}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#9A1B2B" />
                    </TouchableOpacity>
                </View>

                <View style={styles.divider} />

                {/* First Name */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>
                        First Name <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                        style={styles.input}
                        value={firstName}
                        onChangeText={setFirstName}
                        placeholder="Enter first name"
                        placeholderTextColor="#D1D5DB"
                    />
                </View>

                {/* Last Name */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>
                        Last Name <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                        style={styles.input}
                        value={lastName}
                        onChangeText={setLastName}
                        placeholder="Enter last name"
                        placeholderTextColor="#D1D5DB"
                    />
                </View>

                {/* Email */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>
                        Email Address <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Enter email address"
                        placeholderTextColor="#D1D5DB"
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                {/* Phone */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Phone Number</Text>
                    <TextInput
                        style={styles.input}
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="Enter phone number"
                        placeholderTextColor="#D1D5DB"
                        keyboardType="phone-pad"
                    />
                </View>

                <View style={styles.divider} />

                {/* Address */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Street Address</Text>
                    <TextInput
                        style={styles.input}
                        value={address}
                        onChangeText={setAddress}
                        placeholder="Enter street address"
                        placeholderTextColor="#D1D5DB"
                    />
                </View>

                {/* City */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>City</Text>
                    <TextInput
                        style={styles.input}
                        value={city}
                        onChangeText={setCity}
                        placeholder="Enter city"
                        placeholderTextColor="#D1D5DB"
                    />
                </View>

                {/* State */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>State</Text>
                    <TextInput
                        style={styles.input}
                        value={state}
                        onChangeText={setState}
                        placeholder="Enter state"
                        placeholderTextColor="#D1D5DB"
                    />
                </View>

                {/* Zip Code */}
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Zip Code</Text>
                    <TextInput
                        style={styles.input}
                        value={zipCode}
                        onChangeText={setZipCode}
                        placeholder="Enter zip code"
                        placeholderTextColor="#D1D5DB"
                        keyboardType="numeric"
                    />
                </View>

                {/* Update Button */}
                <TouchableOpacity
                    style={[
                        styles.updateButton,
                        isUpdatingProfile && styles.updateButtonDisabled,
                    ]}
                    onPress={handleSavePersonalInfo}
                    disabled={isUpdatingProfile}
                >
                    {isUpdatingProfile ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                            <Text style={styles.updateButtonText}>
                                Update Personal Info
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
        paddingHorizontal: 4,
    },
      iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#9A1B2B",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    shadowColor: "#9A1B2B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2937",
    flex: 1,
    letterSpacing: 0.3,
  },
  paginationBadge: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
    backgroundColor: "#9A1B2B",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(154, 27, 43, 0.05)",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  required: {
    color: "#EF4444",
    fontWeight: "800",
  },
  labelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#1F2937",
    backgroundColor: "#F9FAFB",
    fontWeight: "500",
  },
  selectInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#F9FAFB",
  },
  selectText: {
    fontSize: 15,
    color: "#1F2937",
    fontWeight: "600",
    flex: 1,
  },
  debugText: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 4,
    fontStyle: "italic",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 16,
  },
  statusContainer: {
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#F9FAFB",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 14,
    color: "#1F2937",
    flex: 1,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1.5,
    borderColor: "#FECACA",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "700",
  },
    updateButton: {
    flexDirection: "row",
    backgroundColor: "#9A1B2B",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
    marginTop: 12,
    shadowColor: "#9A1B2B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  updateButtonDisabled: {
    opacity: 0.6,
  },
  updateButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

})

export default PersonalInformation
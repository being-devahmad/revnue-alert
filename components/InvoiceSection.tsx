// components/settings/InvoicesSection.tsx

import {
    getFormattedAmount,
    getFormattedInvoiceData,
    getPaginationInfo,
    useDownloadInvoice,
    useInvoices,
} from "@/api/settings/useInvoices";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

type InvoicesSectionProps = {
  currentPage?: number;
  onPageChange?: (page: number) => void;
};

export const InvoicesSection: React.FC<InvoicesSectionProps> = ({
  currentPage = 1,
  onPageChange = () => {},
}) => {
  const {
    data: invoicesData,
    isLoading: isLoadingInvoices,
    error: invoicesError,
  } = useInvoices(currentPage);

  const { mutate: downloadInvoiceMutate } = useDownloadInvoice();

  const [formattedInvoices, setFormattedInvoices] = useState<any[]>([]);
  const [paginationInfo, setPaginationInfo] = useState<any>(null);
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (invoicesData?.data?.invoices) {
      setFormattedInvoices(getFormattedInvoiceData(invoicesData.data.invoices));
      setPaginationInfo(getPaginationInfo(invoicesData.data.pagination));
    }
  }, [invoicesData]);

  const handleDownload = (invoiceId: string, downloadUrl?: string) => {
    if (!downloadUrl) {
      Alert.alert("Error", "Download link not available");
      return;
    }

    setDownloadingIds((prev) => new Set(prev).add(invoiceId));

    downloadInvoiceMutate(
      { invoiceId, downloadUrl },
      {
        onSettled: () => {
          setDownloadingIds((prev) => {
            const next = new Set(prev);
            next.delete(invoiceId);
            return next;
          });
        },
      }
    );
  };

  const isDownloading = (id: string) => downloadingIds.has(id);

  return (
    <View style={styles.section}>
      
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <Ionicons name="document-text-outline" size={20} color="#fff" />
          </View>
          <Text style={styles.headerTitle}>Invoices</Text>
        </View>

        {paginationInfo && (
          <View style={styles.headerCount}>
            <Text style={styles.headerCountText}>{paginationInfo.totalInvoices}</Text>
          </View>
        )}
      </View>

      {/* Card */}
      <View style={styles.card}>

        {/* Loading */}
        {isLoadingInvoices && (
          <View style={styles.stateContainer}>
            <ActivityIndicator size="large" color="#9A1B2B" />
            <Text style={styles.stateText}>Loading invoices...</Text>
          </View>
        )}

        {/* Error */}
        {invoicesError && !isLoadingInvoices && (
          <View style={styles.stateContainer}>
            <Ionicons name="alert-circle" size={40} color="#EF4444" />
            <Text style={styles.stateText}>
              {invoicesError.message || "Failed to load invoices"}
            </Text>
          </View>
        )}

        {/* Empty */}
        {!isLoadingInvoices &&
          formattedInvoices.length === 0 &&
          !invoicesError && (
            <View style={styles.stateContainer}>
              <Ionicons name="document-outline" size={60} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No invoices yet</Text>
              <Text style={styles.emptySubtitle}>
                Your invoices will appear here once available
              </Text>
            </View>
          )}

        {/* List */}
        {!isLoadingInvoices &&
          formattedInvoices.length > 0 &&
          formattedInvoices.map((invoice) => (
            <View key={invoice.id} style={styles.invoiceCard}>
              
              <View style={styles.invoiceLeft}>
                <Text style={styles.invoiceDate}>{invoice.date}</Text>
                <Text style={styles.invoiceLabel}>{invoice.subscription}</Text>

                <Text style={styles.invoicePeriod}>
                  {invoice.periodStart} — {invoice.periodEnd}
                </Text>
              </View>

              <View style={styles.invoiceRight}>
                <Text style={styles.invoiceAmount}>
                  {getFormattedAmount(invoice.amount)}
                </Text>

                <TouchableOpacity
                  style={[
                    styles.downloadButton,
                    isDownloading(invoice.id) && { opacity: 0.6 },
                  ]}
                  onPress={() => handleDownload(invoice.id, invoice.downloadUrl)}
                  disabled={isDownloading(invoice.id)}
                >
                  {isDownloading(invoice.id) ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Ionicons name="download-outline" size={18} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))}

        {/* Pagination */}
        {paginationInfo?.totalPages > 1 && (
          <View style={styles.paginationWrapper}>
            <TouchableOpacity
              style={[
                styles.pageButton,
                !paginationInfo.hasPrevPage && styles.pageDisabled,
              ]}
              onPress={() => onPageChange(currentPage - 1)}
              disabled={!paginationInfo.hasPrevPage}
            >
              <Ionicons name="chevron-back" size={18} color="#9A1B2B" />
              <Text style={styles.pageText}>Prev</Text>
            </TouchableOpacity>

            <Text style={styles.pageInfo}>
              {paginationInfo.currentPage}/{paginationInfo.totalPages}
            </Text>

            <TouchableOpacity
              style={[
                styles.pageButton,
                !paginationInfo.hasNextPage && styles.pageDisabled,
              ]}
              onPress={() => onPageChange(currentPage + 1)}
              disabled={!paginationInfo.hasNextPage}
            >
              <Text style={styles.pageText}>Next</Text>
              <Ionicons name="chevron-forward" size={18} color="#9A1B2B" />
            </TouchableOpacity>
          </View>
        )}

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: { marginBottom: 32 },

  /* HEADER */
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#9A1B2B",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#1F2937" },
  headerCount: {
    backgroundColor: "#9A1B2B",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  headerCountText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  /* CARD */
  card: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 4,
    elevation: 3,
    shadowOpacity: 0.1,
  },

  /* STATES */
  stateContainer: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  stateText: { marginTop: 12, fontSize: 16, color: "#6B7280" },

  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  emptySubtitle: {
    marginTop: 6,
    color: "#9CA3AF",
    fontSize: 14,
  },

  /* INVOICE CARD */
  invoiceCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },

  invoiceLeft: { flex: 1 },
  invoiceDate: { fontSize: 16, fontWeight: "700", color: "#1F2937" },
  invoiceLabel: {
    marginTop: 4,
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "600",
  },
  invoicePeriod: {
    marginTop: 6,
    fontSize: 12,
    color: "#9CA3AF",
  },

  invoiceRight: {
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 10,
  },
  invoiceAmount: {
    fontSize: 18,
    color: "#9A1B2B",
    fontWeight: "800",
  },

  downloadButton: {
    backgroundColor: "#9A1B2B",
    padding: 10,
    borderRadius: 10,
  },

  /* PAGINATION */
  paginationWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    alignItems: "center",
  },
  pageButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
  },
  pageDisabled: { opacity: 0.4 },
  pageText: { fontSize: 14, fontWeight: "600", color: "#9A1B2B" },
  pageInfo: { fontSize: 14, fontWeight: "700", color: "#6B7280" },
});

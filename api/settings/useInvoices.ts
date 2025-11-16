import axiosInstance from '@/utils/axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

// ============ TYPE DEFINITIONS ============
export interface Invoice {
    id: string;
    date: string;
    period_start: string;
    period_end: string;
    amount: string;
    subscriptions: string;
    download_url: string;
}

export interface PaginationData {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    next_page_url: string | null;
    prev_page_url: string | null;
}

export interface InvoicesResponse {
    status: boolean;
    message: string;
    data: {
        pagination: PaginationData;
        invoices: Invoice[];
    };
}

export interface InvoicesError {
    message: string;
    code?: string;
}

// ============ FETCH INVOICES ============
const fetchInvoices = async (page: number = 1): Promise<InvoicesResponse> => {
    try {
        console.log(`📄 Fetching invoices (page ${page})...`);

        const response = await axiosInstance.get<InvoicesResponse>(
            `/invoices?page=${page}`
        );

        console.log('✅ Invoices fetched successfully:', {
            total: response.data.data.pagination.total,
            invoiceCount: response.data.data.invoices.length,
        });

        if (!response.data.status) {
            throw new Error(
                response.data.message || 'Failed to fetch invoices'
            );
        }

        return response.data;
    } catch (error: any) {
        console.error('❌ Error fetching invoices:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
        });

        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }

        if (error.response?.status === 401) {
            throw new Error('Unauthorized. Please log in again.');
        }

        if (error.response?.status === 404) {
            throw new Error('No invoices found.');
        }

        throw error;
    }
};

// ============ DOWNLOAD INVOICE (LEGACY API) ============
const downloadInvoice = async (invoiceId: string, downloadUrl: string): Promise<void> => {
    try {
        console.log(`📥 Downloading invoice: ${invoiceId}...`);

        if (!downloadUrl) {
            throw new Error('Download URL not provided');
        }

        // Get auth token
        const token = await AsyncStorage.getItem('authToken');

        // Create directory for downloads
        const downloadDir = `${FileSystem.documentDirectory}invoices`;

        console.log(`📁 Using directory: ${downloadDir}`);

        // Check if directory exists, create if not
        try {
            const dirInfo = await FileSystem.getInfoAsync(downloadDir);
            if (!dirInfo.exists) {
                console.log('📂 Creating directory...');
                await FileSystem.makeDirectoryAsync(downloadDir, { intermediates: true });
            }
        } catch (dirError) {
            console.log('📂 Directory check info:', dirError);
        }

        // Create unique file path with timestamp
        const timestamp = Date.now();
        const filePath = `${downloadDir}/invoice_${invoiceId}_${timestamp}.pdf`;

        console.log(`📝 File will be saved to: ${filePath}`);

        // Download the file using legacy downloadAsync
        console.log(`🌐 Downloading from: ${downloadUrl}`);

        const downloadResult = await FileSystem.downloadAsync(
            downloadUrl,
            filePath,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/pdf',
                },
            }
        );

        console.log(`✅ Download completed with status: ${downloadResult.status}`);

        if (downloadResult.status !== 200) {
            throw new Error(`Download failed with status ${downloadResult.status}`);
        }

        console.log(`✅ File saved to: ${filePath}`);

        // Share the file
        if (await Sharing.isAvailableAsync()) {
            console.log('📤 Opening share dialog...');
            await Sharing.shareAsync(filePath, {
                mimeType: 'application/pdf',
                dialogTitle: `Invoice ${invoiceId}`,
                UTI: 'com.adobe.pdf',
            });
            console.log('✅ File shared successfully');
        } else {
            console.log('⚠️ Sharing not available on this device, but file saved');
        }

        console.log('✅ Invoice downloaded and processed successfully');
    } catch (error: any) {
        console.error('❌ Error downloading invoice:', {
            message: error.message,
            invoiceId,
            code: error.code,
        });

        throw new Error(
            error.message || 'Failed to download invoice. Please try again.'
        );
    }
};

// ============ USE INVOICES HOOK ============
export const useInvoices = (page: number = 1) => {
    return useQuery({
        queryKey: ['invoices', page],
        queryFn: () => fetchInvoices(page),
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 2,
        enabled: true,
    });
};

// ============ USE DOWNLOAD INVOICE HOOK ============
export const useDownloadInvoice = () => {
    return useMutation({
        mutationFn: ({ invoiceId, downloadUrl }: { invoiceId: string; downloadUrl: string }) =>
            downloadInvoice(invoiceId, downloadUrl),
        onSuccess: (_, { invoiceId }) => {
            console.log('✅ Invoice download mutation success:', invoiceId);
        },
        onError: (error: any) => {
            console.error('❌ Invoice download mutation error:', error.message);
        },
    });
};

// ============ HELPER: GET FORMATTED INVOICE DATA ============
export const getFormattedInvoiceData = (invoices: Invoice[]) => {
    return invoices.map((invoice) => ({
        id: invoice.id,
        date: formatDate(invoice.date),
        periodStart: formatDate(invoice.period_start),
        periodEnd: formatDate(invoice.period_end),
        amount: invoice.amount,
        subscription: invoice.subscriptions,
        downloadUrl: invoice.download_url,
        originalData: invoice,
    }));
};

// ============ HELPER: FORMAT DATE ============
export const formatDate = (dateString: string): string => {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        return dateString;
    }
};

// ============ HELPER: GET FORMATTED AMOUNT ============
export const getFormattedAmount = (amount: string): string => {
    try {
        // Amount format: "0.00 USD"
        const parts = amount.split(' ');
        const value = parseFloat(parts[0]);
        const currency = parts[1] || 'USD';

        return `$${value.toFixed(2)} ${currency}`;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
        return amount;
    }
};

// ============ HELPER: CHECK IF INVOICE IS EMPTY ============
export const isInvoiceEmpty = (invoices: Invoice[]): boolean => {
    return !invoices || invoices.length === 0;
};

// ============ HELPER: GET PAGINATION INFO ============
export const getPaginationInfo = (pagination: PaginationData) => {
    return {
        hasNextPage: !!pagination.next_page_url,
        hasPrevPage: !!pagination.prev_page_url,
        currentPage: pagination.current_page,
        totalPages: pagination.last_page,
        totalInvoices: pagination.total,
        perPage: pagination.per_page,
    };
};
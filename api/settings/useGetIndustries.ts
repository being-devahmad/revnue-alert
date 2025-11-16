import axiosInstance from '@/utils/axios';
import { useInfiniteQuery } from '@tanstack/react-query';

// ============ TYPE DEFINITIONS ============
export interface IndustryCategory {
  id: number;
  name: string;
  pivot: {
    industry_id: number;
    category_id: number;
    created_at: string;
    updated_at: string;
  };
}

export interface Industry {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  categories: IndustryCategory[];
}

export interface PaginationData {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  next_page_url: string | null;
  prev_page_url: string | null;
}

export interface IndustriesFilters {
  search?: string;
  per_page?: number;
}

export interface IndustriesResponse {
  status: boolean;
  message: string;
  data: {
    pagination: PaginationData;
    filters: Record<string, any>;
    industries: Industry[];
  };
}

// ============ FETCH INDUSTRIES FUNCTION ============
const fetchIndustries = async (
  pageParam: number = 1,
  filters: IndustriesFilters = {}
): Promise<IndustriesResponse> => {
  try {
    console.log('📥 Fetching industries:', { page: pageParam, filters });

    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append('page', String(pageParam));
    
    if (filters.search) {
      queryParams.append('search', filters.search);
    }
    
    const perPage = filters.per_page || 20; // Default to 20 per page
    queryParams.append('per_page', String(perPage));

    const response = await axiosInstance.get<IndustriesResponse>(
      `/industries?${queryParams.toString()}`
    );

    console.log('✅ Industries fetched:', {
      page: response.data.data.pagination.current_page,
      total: response.data.data.pagination.total,
      count: response.data.data.industries?.length,
      hasNextPage: !!response.data.data.pagination.next_page_url,
    });

    return response.data;
  } catch (error: any) {
    console.error('❌ Error fetching industries:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw error;
  }
};

// ============ USE INDUSTRIES INFINITE QUERY HOOK ============
export const useIndustries = (filters: IndustriesFilters = {}) => {
  return useInfiniteQuery({
    queryKey: ['industries', filters],
    queryFn: ({ pageParam = 1 }) => fetchIndustries(pageParam, filters),
    getNextPageParam: (lastPage) => {
      // If there's a next page URL, return the next page number
      if (lastPage.data.pagination.next_page_url) {
        return lastPage.data.pagination.current_page + 1;
      }
      // Return undefined to signal no more pages
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour garbage collection time
  });
};

// ============ HELPER: FLATTEN ALL INDUSTRIES ============
export const flattenIndustries = (data: any): Industry[] => {
  if (!data?.pages) return [];
  return data.pages.reduce(
    (acc: Industry[], page: IndustriesResponse) => [
      ...acc,
      ...page.data.industries,
    ],
    []
  );
};

// ============ HELPER: GET INDUSTRY NAMES FROM FLATTENED DATA ============
export const getIndustryNames = (flatIndustries: Industry[]): string[] => {
  return flatIndustries.map((industry) => industry.name);
};

// ============ HELPER: GET INDUSTRY BY NAME ============
export const getIndustryByName = (
  flatIndustries: Industry[],
  name: string
): Industry | undefined => {
  return flatIndustries.find((industry) => industry.name === name);
};

// ============ HELPER: SEARCH INDUSTRIES ============
export const searchIndustries = (
  industries: Industry[],
  searchTerm: string
): Industry[] => {
  if (!searchTerm.trim()) return industries;
  
  const lowercaseSearch = searchTerm.toLowerCase();
  return industries.filter((industry) =>
    industry.name.toLowerCase().includes(lowercaseSearch)
  );
};

// ============ HELPER: GET SORTED INDUSTRIES ============
export const getSortedIndustries = (industries: Industry[]): string[] => {
  return industries
    .map((industry) => industry.name)
    .sort((a, b) => a.localeCompare(b));
};

// ============ HELPER: GET PAGINATION INFO ============
export const getPaginationInfo = (data: any) => {
  if (!data?.pages || data.pages?.length === 0) {
    return {
      total: 0,
      currentPage: 0,
      lastPage: 0,
      perPage: 0,
      hasNextPage: false,
    };
  }

  const lastPage = data.pages[data?.pages?.length - 1];
  const pagination = lastPage.data.pagination;

  return {
    total: pagination.total,
    currentPage: pagination.current_page,
    lastPage: pagination.last_page,
    perPage: pagination.per_page,
    hasNextPage: !!pagination.next_page_url,
  };
};

// ============ HELPER: GET CATEGORIES BY INDUSTRY ============
export const getCategoriesByIndustry = (
  flatIndustries: Industry[],
  industryName: string
): IndustryCategory[] => {
  const industry = flatIndustries.find((ind) => ind.name === industryName);
  return industry?.categories || [];
};

// ============ HELPER: GET CATEGORY NAMES BY INDUSTRY ============
export const getCategoryNamesByIndustry = (
  flatIndustries: Industry[],
  industryName: string
): string[] => {
  const categories = getCategoriesByIndustry(flatIndustries, industryName);
  return categories.map((cat) => cat.name);
};
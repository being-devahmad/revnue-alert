import axiosInstance from '@/utils/axios';
import { useInfiniteQuery } from '@tanstack/react-query';

export interface Category {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  group: string | null;
  industries: any[];
}

export interface CategoryPagination {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
  next_page_url: string | null;
  prev_page_url: string | null;
}

export interface CategoriesResponse {
  status: boolean;
  message: string;
  data: {
    pagination: CategoryPagination;
    filters: {
      search: string | null;
      industry_id: number | null;
    };
    categories: Category[];
  };
}

// ============ FETCH CATEGORIES FUNCTION ============
const fetchCategories = async (pageParam: number = 1, search: string = ''): Promise<CategoriesResponse> => {
  try {
    console.log('📤 Fetching categories...', { page: pageParam, search });

    let url = `/categories?page=${pageParam}`;
    if (search.trim()) {
      url += `&search=${encodeURIComponent(search)}`;
    }

    const response = await axiosInstance.get<CategoriesResponse>(url);

    // Validate response structure
    if (!response.data) {
      throw new Error("No response data from API");
    }

    if (!response.data.status) {
      throw new Error(response.data.message || "API returned status: false");
    }

    if (!response.data.data) {
      throw new Error("No categories data in response");
    }

    console.log('✅ Categories fetched successfully!');
    console.log('📊 Total categories:', response.data.data.pagination.total);

    return response.data;
  } catch (error: any) {
    console.error('❌ Error fetching categories:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });
    throw error;
  }
};

// ============ USE CATEGORIES HOOK (INFINITE QUERY) ============
export const useCategories = (search: string = '') => {
  return useInfiniteQuery({
    queryKey: ["categories", search], // Search changes reset pagination
    queryFn: ({ pageParam = 1 }) => fetchCategories(pageParam, search),
    getNextPageParam: (lastPage) => {
      // If there's a next page, return the next page number
      if (lastPage.data.pagination.next_page_url) {
        return lastPage.data.pagination.current_page + 1;
      }
      // Return undefined to signal no more pages
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes garbage collection time
  });
};

// ============ HELPER: FLATTEN ALL CATEGORIES ============
export const flattenCategories = (data: any): Category[] => {
  if (!data?.pages) return [];
  return data.pages.reduce(
    (acc: Category[], page: CategoriesResponse) => [
      ...acc,
      ...page.data.categories,
    ],
    []
  );
};

// ============ HELPER: GET SORTED CATEGORIES ============
export const getSortedCategories = (categories: Category[]): string[] => {
  return categories
    .map((cat) => cat.name)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
};

// ============ HELPER: SEARCH CATEGORIES ============
export const searchCategories = (categories: Category[], query: string): Category[] => {
  const lowerQuery = query.toLowerCase().trim();
  return categories.filter((cat) =>
    cat.name.toLowerCase().includes(lowerQuery)
  );
};

// ============ HELPER: GET PAGINATION INFO ============
export const getPaginationInfo = (data: any) => {
  if (!data?.pages || data.pages.length === 0) {
    return {
      total: 0,
      currentPage: 0,
      lastPage: 0,
      hasNextPage: false,
    };
  }

  const lastPage = data.pages[data.pages.length - 1];
  const pagination = lastPage.data.pagination;

  return {
    total: pagination.total,
    currentPage: pagination.current_page,
    lastPage: pagination.last_page,
    hasNextPage: !!pagination.next_page_url,
  };
};
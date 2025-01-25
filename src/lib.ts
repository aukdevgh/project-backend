import axios from 'axios';
import dotenv from 'dotenv';

// Загружаем переменные окружения
dotenv.config();

// Utility function to fetch data from dummyjson
export const fetchData = async (url: string) => {
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error(`Error fetching data from ${url}:`, error);
        throw new Error('Failed to fetch data');
    }
};

// Function to filter categories
export const filterCategories = (
    categories: string[],
    prefix: string,
): string[] => {
    return categories.filter((category) => category.startsWith(prefix));
};

export const filterAllCategories = (categories: string[]): string[] => {
    return categories.filter(
        (category) =>
            category.startsWith('mens') || category.startsWith('womens'),
    );
};

// Function to fetch products by category
export const fetchProductsByCategories = async (
    categories: string[],
): Promise<any[]> => {
    const products: any[] = [];

    for (const category of categories) {
        const data = await fetchData(
            `${process.env.DUMMYJSON_BASE_URL}/products/category/${category}`,
        );
        products.push(...data.products);
    }

    return products;
};

// Function to filter, sort, and paginate products
export const processProducts = (
    products: any[],
    filters: {
        priceRange?: [number, number];
        sortBy?: string;
        filterByBrand?: string;
        searchBy?: string;
        order?: 'asc' | 'desc';
        limit?: number;
        select?: string[];
        offset?: number;
    },
): { products: any[]; total: number; hasMore: boolean } => {
    let filteredProducts = products;

    //breand filter
    if (filters.filterByBrand) {
        filteredProducts = filteredProducts.filter(
            (product) => product.brand === filters.filterByBrand,
        );
    }

    if (filters.searchBy) {
        filteredProducts = filteredProducts.filter((product) =>
            product.title.includes(filters.searchBy),
        );
    }

    // Filter by price range
    if (filters.priceRange) {
        const [minPrice, maxPrice] = filters.priceRange;
        filteredProducts = filteredProducts.filter(
            (product) => product.price >= minPrice && product.price <= maxPrice,
        );
    }

    // Sort products
    if (filters.sortBy) {
        filteredProducts.sort((a, b) => {
            if (
                filters.sortBy === 'new' ||
                filters.sortBy === 'rating' ||
                filters.sortBy === 'sale'
            ) {
                const sortKey = {
                    new: 'id',
                    rating: 'rating',
                    sale: 'discountPercentage',
                };

                return filters.order === 'desc'
                    ? b[sortKey[filters.sortBy]] - a[sortKey[filters.sortBy]]
                    : a[sortKey[filters.sortBy]] - b[sortKey[filters.sortBy]];
            } else if (filters.sortBy === 'popular') {
                const popularityA = a.rating * a.stock;
                const popularityB = b.rating * b.stock;
                return popularityB - popularityA;
            } else if (filters.sortBy === 'price') {
                const getDsicountPrice = (
                    price: number,
                    discountPercentage: number,
                ) => {
                    if (
                        price < 0 ||
                        discountPercentage < 0 ||
                        discountPercentage > 100
                    ) {
                        throw new Error('Invalid price or discount percentage');
                    }

                    const discount = (price * discountPercentage) / 100;
                    return price - discount;
                };

                return filters.order === 'desc'
                    ? getDsicountPrice(b.price, b.discountPercentage) -
                          getDsicountPrice(a.price, a.discountPercentage)
                    : getDsicountPrice(a.price, a.discountPercentage) -
                          getDsicountPrice(b.price, b.discountPercentage);
            }
            return 0;
        });
    }

    // Select specific fields
    if (filters.select) {
        filteredProducts = filteredProducts.map((product) => {
            const selected: any = {};
            filters.select!.forEach((field) => {
                if (field in product) selected[field] = product[field];
            });
            return selected;
        });
    }

    // Total count before pagination
    const total = filteredProducts.length;

    // Paginate results
    const offset = filters.offset ?? 0;
    const limit = filters.limit || total;
    const paginatedProducts = filteredProducts.slice(offset, offset + limit);

    // Determine if there are more results
    const hasMore = offset + limit < total;

    return { products: paginatedProducts, total, hasMore };
};

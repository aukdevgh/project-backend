import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import {
    fetchData,
    fetchProductsByCategories,
    filterAllCategories,
    filterCategories,
    processProducts,
} from './lib';

import { reviews } from '../data/reviews';

// Загружаем переменные окружения
dotenv.config();

export const app = express();
const PORT = process.env.PORT || 3000;
export const DUMMYJSON_BASE_URL = process.env.DUMMYJSON_BASE_URL;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/products', async (req, res) => {
    try {
        const {
            category,
            filterByBrand,
            sortBy,
            order,
            minPrice,
            maxPrice,
            limit,
            offset,
            select,
        } = req.query;

        // Fetch all categories
        const categoriesData = await fetchData(
            `${DUMMYJSON_BASE_URL}/products/category-list`,
        );

        // Filter categories by prefix
        const categories = category
            ? filterCategories(categoriesData, category as string)
            : filterAllCategories(categoriesData);

        // Fetch products for filtered categories
        const products = await fetchProductsByCategories(categories);

        // Process filters
        const processedProducts = processProducts(products, {
            priceRange:
                minPrice && maxPrice
                    ? [Number(minPrice), Number(maxPrice)]
                    : undefined,
            filterByBrand: filterByBrand as string,
            sortBy: sortBy as string,
            order: (order as 'asc' | 'desc') || 'asc',
            limit: limit ? Number(limit) : undefined,
            offset: offset ? Number(offset) : undefined,
            select: select ? (select as string).split(',') : undefined,
        });

        res.json(processedProducts);
    } catch (error) {
        const err = error as Error;
        res.status(500).json({ error: err.message });
    }
});

//search
app.get('/api/products/search', async (req, res) => {
    try {
        const { q, select } = req.query;

        // Fetch all categories
        const categoriesData = await fetchData(
            `${DUMMYJSON_BASE_URL}/products/category-list`,
        );

        // Filter categories by prefix
        const categories = filterAllCategories(categoriesData);

        // Fetch products for filtered categories
        const products = await fetchProductsByCategories(categories);

        // Process filters
        const processedProducts = processProducts(products, {
            searchBy: q as string,
            select: select ? (select as string).split(',') : undefined,
        });

        res.json(processedProducts);
    } catch (error) {
        const err = error as Error;
        res.status(500).json({ error: err.message });
    }
});

//brand list
app.get('/api/products/brands', async (req, res) => {
    try {
        // Fetch all categories
        const categoriesData = await fetchData(
            `${DUMMYJSON_BASE_URL}/products/category-list`,
        );

        // Filter categories by prefix
        const categories = filterAllCategories(categoriesData);

        // Fetch products for filtered categories
        const products = await fetchProductsByCategories(categories);

        // Process filters
        const brands = products
            .map((product) => product.brand)
            .filter((brand) => brand);
        const uniqBrands = new Set(brands);

        res.json([...uniqBrands]);
    } catch (error) {
        const err = error as Error;
        res.status(500).json({ error: err.message });
    }
});

//price limits
app.get('/api/price-limits', async (req, res) => {
    try {
        // Fetch all categories
        const categoriesData = await fetchData(
            `${DUMMYJSON_BASE_URL}/products/category-list`,
        );

        // Filter categories by prefix
        const categories = filterAllCategories(categoriesData);

        // Fetch products for filtered categories
        const products = await fetchProductsByCategories(categories);

        //sort by price
        products.sort((a, b) => a.price - b.price);

        const minPrice = Math.floor(products[0].price);
        const maxPrice = Math.ceil(products[products.length - 1].price);

        res.json({ min: minPrice, max: maxPrice });
    } catch (error) {
        const err = error as Error;
        res.status(500).json({ error: err.message });
    }
});

//comments list
app.get('/api/products/reviews', async (req, res) => {
    const { productId } = req.query;
    try {
        if (productId) {
            // Получаем данные о продукте по ID
            const productResponse = await axios.get(
                `${DUMMYJSON_BASE_URL}/products/${productId}`,
            );
            const reviews = productResponse.data.reviews;

            // Total count before pagination
            const total = reviews.length;

            // Paginate results
            const offset = req.query.offset ? Number(req.query.offset) : 0;
            const limit = req.query.limit ? Number(req.query.limit) : total;
            const paginatedRatingReviews = reviews.slice(
                offset,
                offset + limit,
            );

            // Determine if there are more results
            const hasMore = offset + limit < total;

            // Возвращаем полный объект продукта
            return res.json({
                reviews: paginatedRatingReviews,
                total,
                hasMore,
            });
        }

        const highRatingReviews = reviews;

        // Total count before pagination
        const total = highRatingReviews.length;

        // Paginate results
        const offset = req.query.offset ? Number(req.query.offset) : 0;
        const limit = req.query.limit ? Number(req.query.limit) : total;
        const paginatedRatingReviews = highRatingReviews.slice(
            offset,
            offset + limit,
        );

        // Determine if there are more results
        const hasMore = offset + limit < total;

        res.json({
            reviews: paginatedRatingReviews,
            total,
            hasMore,
        });
    } catch (error) {
        const err = error as Error;
        res.status(500).json({ error: err.message });
    }
});

//category list
app.get('/api/products/category-list', async (req, res) => {
    try {
        const { category } = req.query;

        // Fetch all categories
        const categoriesData = await fetchData(
            `${DUMMYJSON_BASE_URL}/products/category-list`,
        );

        // Filter categories by prefix
        const categories = category
            ? filterCategories(categoriesData, category as string)
            : filterAllCategories(categoriesData);

        res.json(categories);
    } catch (error) {
        const err = error as Error;
        res.status(500).json({ error: err.message });
    }
});

// Маршрут для получения продукта по ID
app.get('/api/products/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Получаем данные о продукте по ID
        const productResponse = await axios.get(
            `${DUMMYJSON_BASE_URL}/products/${id}?select=title,description,category,price,discountPercentage,rating,images,brand,stock,sku,weight,dimensions,warrantyInformation,shippingInformation,availabilityStatus,returnPolicy,minimumOrderQuantity,meta`,
        );
        const product = productResponse.data;

        // Возвращаем полный объект продукта
        res.status(200).json(product);
    } catch (error) {
        const err = error as Error;
        res.status(500).json({
            message: 'Ошибка при получении продукта по ID',
            error: err.message,
        });
    }
});

app.get('/api/carts/user/:id', async (req, res) => {
    const { id } = req.params;

    try {
        // Получаем данные по ID
        const response = await axios.get(
            `${DUMMYJSON_BASE_URL}/carts/user/${id}`,
        );

        // Возвращаем объект
        res.status(200).json(response.data);
    } catch (error) {
        const err = error as Error;
        res.status(500).json({
            message: 'Ошибка при получении cart по ID',
            error: err.message,
        });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const response = await axios.post(
            `${DUMMYJSON_BASE_URL}/auth/login`,
            req.body,
        );

        res.status(200).json(response.data);
    } catch (error) {
        const err = error as Error;
        res.status(500).json({
            success: false,
            message: 'Ошибка при login',
            error: err.message,
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;

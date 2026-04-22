import Product from '../models/product.model.js';
import Category from '../models/category.model.js';
import Brand from '../models/brand.model.js';
import ProductImage from '../models/productImage.model.js';
import Type from '../models/type.model.js'
import mongoose from 'mongoose';
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as XLSX from 'xlsx';
const ObjectId = mongoose.Types.ObjectId;

dotenv.config();

// Hàm hỗ trợ tạo mô tả bằng AI
const exampleDescription = `Vợt cầu lông Yonex Astrox 99 Pro là một trong những cây vợt cao cấp nhất của Yonex, được thiết kế dành riêng cho người chơi theo phong cách tấn công mạnh mẽ và uy lực. Với hàng loạt công nghệ tiên tiến, cây vợt này mang đến hiệu suất vượt trội cho các vận động viên chuyên nghiệp và người chơi có kỹ thuật cao.
                
    📊 Thông số kỹ thuật
    - Trọng lượng: 4U (80-84g).
    - Độ cứng: Siêu cứng – hỗ trợ tối đa lực đập mạnh và kiểm soát tốt.
    - Chu vi cán vợt: G5.
    - Chiều dài tổng thể: 675 mm.
    - Điểm cân bằng: Khoảng 303 mm – nặng đầu, phù hợp lối chơi tấn công.
    - Sức căng dây: 3U (21–29 lbs), 4U (20–28 lbs).

    🎯 Đặc điểm nổi bật
    - Công nghệ POWER-ASSIST BUMPER: Được tích hợp ở đỉnh vợt, tăng trọng lượng đầu vợt thêm 55% so với gen thông thường, giúp tăng lực đập cầu và khả năng tấn công mạnh mẽ hơn. 
    - Vật liệu VOLUME CUT RESIN: Một loại nhựa đột phá được áp dụng toàn bộ trên khung và trục vợt, giúp phân bổ trọng lượng đồng đều, tăng độ bền và cải thiện độ chính xác trong từng cú đánh. 
    - Mặt vợt ISOMETRIC Plus: Thiết kế mặt vợt hình vuông mở rộng điểm ngọt (sweetspot), hỗ trợ những cú đánh chính xác ngay cả khi tiếp xúc lệch tâm. 
    - Trục vợt Extra Slim Shaft: Trục vợt siêu mỏng giúp giảm lực cản không khí khi vung vợt, tăng tốc độ và lực đánh. 
    - Chụp mũ vợt Energy Boost CAP PLUS: Tối đa hóa hiệu suất trục, tăng độ ổn định và hỗ trợ lực đánh. 
    - Hệ thống Rotational Generator System: Phân bổ trọng lượng tối ưu ở đầu vợt, khớp nối chữ T và phần tay cầm, giúp vợt cân bằng và linh hoạt trong từng pha cầu. 

    👤 Đối tượng phù hợp 
    Yonex Astrox 99 Pro lý tưởng cho người chơi có lực tay khỏe, kỹ thuật tốt và yêu thích lối đánh tấn công mạnh mẽ. Đặc biệt phù hợp với các vận động viên chuyên nghiệp hoặc người chơi trình độ cao đang tìm kiếm một cây vợt hỗ trợ tối đa cho những cú smash uy lực và kiểm soát cầu chính xác.`;

const generateAIDescription = async (prod_name) => {
    const instruction = `You are an AI specializing in writing product descriptions for badminton-related products. 
    Your task is to generate engaging, informative, and well-structured descriptions that enhance their understanding of the product.
    The description should include the product's features, benefits, and any unique selling points.
    Write a description without a title. Just a detailed description.
    This is an example of product description Yonex Astrox 99 Pro: ${exampleDescription}
    Response in Vietnamese and markdown format.
    `;
    const prompt = `Write a product description for ${prod_name}.`;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1500,
        },
        systemInstruction: instruction,
    });
    return result.response.text();
}

// Lấy sản phẩm theo id 
export const fetchProductById = async (req, res) => {
    const productId = req.params.id;
    try {
        const product = await Product.findOne({ _id: productId, is_active: true })
            .populate('category_id')
            .populate('brand_id')
            .populate('type_id')
            .populate({
                path: 'images',
                select: 'image is_primary_image -prod_id',
            })

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }
        return res.status(200).json({ success: true, data: product });
    } catch (e) {
        console.error("Error in fetching product:", e.message);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
}

// Lấy thông tin tất cả sản phẩm
export const fetchAllProducts = async (req, res) => {
    const minPrice = parseInt(req.query.minPrice) || 0;
    const maxPrice = parseInt(req.query.maxPrice) || Number.MAX_VALUE;
    const priceFilter = (minPrice > 0 || maxPrice < Number.MAX_VALUE) ? { price: { $gte: minPrice, $lte: maxPrice } } : {};
    const activeFilter = { is_active: true };
    const category = req.query.category || '';
    const categoryFilter = category ? { 'category_id': category } : {};
    const brand = req.query.brand || '';
    const brandFilter = brand ? { brand_id: brand } : {};
    const type = req.query.type || '';
    const typeFilter = type ? { type_id: type } : {};
    const search = req.query.search || '';
    let keywordFilter = {};
    if (search) {
        const categories = await Category.find({ category_name: { $regex: search, $options: 'i' } });
        const categoryIds = categories.map(c => c._id);
        keywordFilter = {
            $or: [
                { prod_name: { $regex: search, $options: 'i' } },
                { category_id: { $in: categoryIds } }
            ]
        };
    }

    const query = { ...priceFilter, ...categoryFilter, ...brandFilter, ...typeFilter, ...keywordFilter, ...activeFilter };
    const totalDocument = await Product.countDocuments(query);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || totalDocument;
    const skip = (page - 1) * limit;

    const sort = req.query.sort || 'newest';
    let sortOption = {};
    switch (sort) {
        case 'newest': sortOption = { create_at: -1 }; break;
        case 'best_selling': sortOption = { quantity_sold: -1 }; break;
        case 'price_asc': sortOption = { price: 1 }; break;
        case 'price_desc': sortOption = { price: -1 }; break;
        default: sortOption = { create_at: -1 };
    }

    try {
        const products = await Product.find(query)
            .populate('category_id')
            .populate('brand_id')
            .populate('type_id')
            .populate({
                path: 'images',
                select: 'image is_primary_image -prod_id',
                match: { is_primary_image: true }
            })
            .sort(sortOption)
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            success: true,
            page: page,
            totalPages: Math.ceil(totalDocument / limit),
            totalItems: totalDocument,
            limit: limit,
            data: products
        });
    } catch (e) {
        console.error("Error in fetching products:", e.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
}

// Tạo sản phẩm mới
export const createProduct = async (req, res) => {
    const { prod_name, description, price, stock, discount, category_id, brand_id, type_id } = req.body;

    if (!prod_name || !price || !description || !stock || !category_id || !brand_id || !type_id) {
        return res.status(400).json({ success: false, message: "Please fill full required information" });
    }

    const quantity_sold = 0;
    const productMaxId = await Product.findOne({}).sort({ prod_id: -1 });

    let finalDescription = description;
    if (description === "Using AI") {
        try {
            finalDescription = await generateAIDescription(prod_name);
        } catch (e) {
            console.error("AI Generation Error:", e.message);
            return res.status(503).json({
                success: false,
                message: "Không thể tạo mô tả bằng AI. API Gemini đã vượt giới hạn quota miễn phí. Vui lòng thử lại sau hoặc chọn 'Tự nhập' mô tả.",
                error: "AI_QUOTA_EXCEEDED"
            });
        }
    }

    try {
        const newProduct = new Product({
            prod_id: productMaxId ? productMaxId.prod_id + 1 : 1,
            prod_name,
            price,
            description: finalDescription,
            quantity_sold,
            stock,
            discount: discount || 0,
            category_id,
            brand_id,
            type_id
        });

        await newProduct.save();
        return res.status(200).json({ success: true, data: newProduct });
    } catch (e) {
        console.error("Error in creating product:", e.message);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
}

// Cập nhật thông tin sản phẩm
export const updateProduct = async (req, res) => {
    const productId = req.params.id;
    let { prod_name, description, price, stock, discount, quantity_sold, category_id, brand_id, type_id } = req.body;

    if (!prod_name || !price || !description || !stock || !discount || quantity_sold === undefined || !category_id || !brand_id || !type_id) {
        return res.status(400).json({ success: false, message: "Please fill full required information" });
    }

    if (description === "Using AI") {
        try {
            description = await generateAIDescription(prod_name);
        } catch (error) {
            console.error("AI Generation Error: ", error);
            return res.status(503).json({
                success: false,
                message: "Không thể tạo mô tả bằng AI. API Gemini đã vượt giới hạn quota miễn phí. Vui lòng thử lại sau hoặc chọn 'Tự nhập' mô tả.",
                error: "AI_QUOTA_EXCEEDED"
            });
        }
    }

    try {
        const product = await Product.findByIdAndUpdate(
            productId,
            { 
                prod_name, 
                price, 
                description, 
                quantity_sold, 
                stock, 
                discount: discount || 0, 
                category_id, 
                brand_id, 
                type_id, 
                update_at: Date.now() 
            },
            { new: true }
        )
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        return res.status(200).json({ success: true, data: product });
    } catch (e) {
        console.error("Error in updating product:", e.message);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
}

export const deactiveProduct = async (req, res) => {
    const productId = req.params.id;
    try {
        const product = await Product.findByIdAndUpdate(productId, { is_active: false }, { new: true });
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }
        await ProductImage.deleteMany({ prod_id: new mongoose.Types.ObjectId(productId) });
        return res.status(200).json({ success: true, message: "Product deactivated successfully" });
    } catch (e) {
        console.error("Error in deactivating product:", e.message);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
}

// Chức năng Import Sản phẩm từ Excel
export const importProducts = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "Vui lòng tải lên file excel." });
        }

        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });

        if (data.length <= 1) {
            return res.status(400).json({ success: false, message: "File excel không có dữ liệu." });
        }

        const rows = data.slice(1);
        const [categories, brands, types] = await Promise.all([
            Category.find({}),
            Brand.find({}),
            Type.find({})
        ]);

        const categoryMap = {}; categories.forEach(c => categoryMap[c.category_name.toLowerCase()] = c._id);
        const brandMap = {}; brands.forEach(b => brandMap[b.brand_name.toLowerCase()] = b._id);
        const typeMap = {}; types.forEach(t => typeMap[t.type_name.toLowerCase()] = t._id);

        let productMaxIdDoc = await Product.findOne({}).sort({ prod_id: -1 });
        let currentProdId = productMaxIdDoc ? productMaxIdDoc.prod_id : 0;

        let productImageMaxIdDoc = await ProductImage.findOne({}).sort({ prod_image_id: -1 });
        let currentProdImgId = productImageMaxIdDoc ? productImageMaxIdDoc.prod_image_id : 0;

        const importedProducts = [];
        const errors = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;

            const [prod_name, price, stock, quantity_sold, description, category_name, brand_name, type_name, discount, image_url] = row;

            if (!prod_name || price === undefined) {
                errors.push(`Dòng ${i + 2}: Thiếu tên sản phẩm hoặc giá.`);
                continue;
            }

            const category_id = categoryMap[String(category_name || '').toLowerCase()];
            const brand_id = brandMap[String(brand_name || '').toLowerCase()];
            const type_id = typeMap[String(type_name || '').toLowerCase()];

            if (!category_id || !brand_id || !type_id) {
                errors.push(`Dòng ${i + 2}: Danh mục, thương hiệu hoặc loại không tồn tại.`);
                continue;
            }

            let finalDescription = description || '';
            if (finalDescription === "Using AI") {
                try {
                    finalDescription = await generateAIDescription(prod_name);
                } catch (aiErr) {
                    console.error(`AI Generation failed for row ${i + 2}:`, aiErr.message);
                    finalDescription = `Mô tả tự động cho ${prod_name} (Lỗi AI: ${aiErr.message})`;
                }
            }

            currentProdId++;
            const newProduct = new Product({
                prod_id: currentProdId,
                prod_name,
                price: Number(price),
                stock: Number(stock || 0),
                quantity_sold: Number(quantity_sold || 0),
                description: finalDescription,
                category_id,
                brand_id,
                type_id,
                discount: Number(discount || 0)
            });

            const savedProduct = await newProduct.save();
            if (image_url) {
                currentProdImgId++;
                const newImage = new ProductImage({
                    prod_image_id: currentProdImgId,
                    prod_id: savedProduct._id,
                    image: image_url,
                    is_primary_image: true
                });
                await newImage.save();
            }
            importedProducts.push(savedProduct);
        }

        return res.status(200).json({
            success: true,
            message: `Import thành công ${importedProducts.length} sản phẩm.`,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (e) {
        console.error("Error in importing products:", e.message);
        return res.status(500).json({ success: false, message: "Lỗi hệ thống khi import." });
    }
}
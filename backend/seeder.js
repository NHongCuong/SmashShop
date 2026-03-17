import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./models/product.model.js";
import Brand from "./models/brand.model.js";
import Category from "./models/category.model.js";
import ProductImage from "./models/productImage.model.js";
import Type from "./models/type.model.js";
import Order from "./models/order.model.js"
import OrderDetail from "./models/order_detail.js";
import User from "./models/user.model.js"; // Import User model
import connectDB from "./config/database.js";
// import productData from "./data/product.js";
import brandData from "./data/brand.js";
import categoryData from "./data/category.js";
import typeData from "./data/type.js";
dotenv.config();
connectDB();

const seedData = async () => {
    try {
        // Xóa dữ liệu cũ
        await ProductImage.deleteMany();
        await Product.deleteMany();
        await Brand.deleteMany();
        await Category.deleteMany();
        await Type.deleteMany();
        await Order.deleteMany();
        await OrderDetail.deleteMany();

        // Tạo dữ liệu mới
        const createBrand = await Brand.insertMany([
            { brand_id: 1, brand_name: "Yonex" },
            { brand_id: 2, brand_name: "Lining" },
            { brand_id: 3, brand_name: "Victor" }
        ]);

        const createCategory = await Category.insertMany([
            { category_id: 1, category_name: "Vợt cầu lông" },
            { category_id: 2, category_name: "Quấn cán vợt" },
            { category_id: 3, category_name: "Giày cầu lông" },
            { category_id: 4, category_name: "Túi cầu lông" },
            { category_id: 5, category_name: "Lưới cầu lông" }
        ]);

        const createType = await Type.insertMany([
            { type_id: 1, type_name: "Premium" },
            { type_id: 2, type_name: "Standard" },
            { type_id: 3, type_name: "Beginner" }
        ]);

        const createProduct = await Product.insertMany([
            { prod_id: 1, prod_name: "Yonex Astrox 99 Pro", price: 4500000, stock: 10, quantity_sold: 10,
                description: `Vợt cầu lông Yonex Astrox 99 Pro là một trong những cây vợt cao cấp nhất của Yonex, được thiết kế dành riêng cho người chơi theo phong cách tấn công mạnh mẽ và uy lực. Với hàng loạt công nghệ tiên tiến, cây vợt này mang đến hiệu suất vượt trội cho các vận động viên chuyên nghiệp và người chơi có kỹ thuật cao.
                
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
                Yonex Astrox 99 Pro lý tưởng cho người chơi có lực tay khỏe, kỹ thuật tốt và yêu thích lối đánh tấn công mạnh mẽ. Đặc biệt phù hợp với các vận động viên chuyên nghiệp hoặc người chơi trình độ cao đang tìm kiếm một cây vợt hỗ trợ tối đa cho những cú smash uy lực và kiểm soát cầu chính xác.`,
                category_id: createCategory[0]._id, brand_id: createBrand[0]._id, type_id: createType[0]._id, discount: 10, update_at: Date.now() },
            { prod_id: 2, prod_name: "Lining N90 IV", price: 3900000, stock: 15, quantity_sold: 20, 
                description: 
                `Vợt cầu lông Li-Ning N90 IV (hay Lining Break-Free 90IV TD) là một cây vợt cao cấp, được thiết kế dành cho người chơi có lối đánh tấn công mạnh mẽ. Đây là phiên bản nâng cấp với nhiều cải tiến về công nghệ, giúp tăng tốc độ vung vợt và tối ưu hóa lực đánh.
                
                📊 Thông số kỹ thuật
                - Trọng lượng: 3U (~86g).
                - Điểm cân bằng: 290mm (hơi nặng đầu).
                - Độ cứng: Trung bình.
                - Chiều dài vợt: 675mm.
                - Chu vi cán vợt: S2 (tương đương G5 của Yonex).
                - Sức căng dây tối đa: 30 LBS (~13.5kg).
                - Màu sắc: Xám phối đỏ.
                - Sản xuất tại: Trung Quốc.`, 
                category_id: createCategory[0]._id, brand_id: createBrand[1]._id, type_id: createType[0]._id, discount: 5, update_at: Date.now() },
            { prod_id: 3, prod_name: "Victor Thruster K 9900", price: 4200000, stock: 8, quantity_sold: 5, 
                description: 
                `Vợt cầu lông Victor Thruster K 9900 là một dòng vợt chuyên công, được thiết kế dành cho người chơi có lối đánh mạnh mẽ, đặc biệt là những cú smash uy lực và đập cầu áp đảo.
                
                📊 Thông số kỹ thuật
                - Trọng lượng: 3U (~86g) / 4U (~83g).
                - Chu vi cán vợt: G5.
                - Sức căng tối đa: 3U ≤ 32 lbs (~14.5kg), 4U ≤ 30 lbs (~13.5kg).
                - Điểm cân bằng: Nặng đầu, hỗ trợ tối đa cho lối chơi tấn công.
                - Độ cứng: Cứng, giúp tăng lực đập cầu.
                - Khung vợt: Graphite + Nano Resin + Fiber Reinforced System (FRS).
                - Thân vợt: Graphite + Nano Resin + 6.8 SHAFT.`, 
                category_id: createCategory[0]._id, brand_id: createBrand[2]._id, type_id: createType[0]._id, discount: 8, update_at: Date.now() },
            { prod_id: 4, prod_name: "Quấn cán Yonex AC102", price: 50000, stock: 100, quantity_sold: 30, 
                description: 
                `Quấn cán Yonex AC102 là một trong những loại quấn cán vợt cầu lông phổ biến nhất, được nhiều người chơi tin dùng nhờ khả năng bám dính tốt, thấm hút mồ hôi hiệu quả, và độ bền cao.
                
                Chất liệu
                - Cao su tổng hợp – Giúp tăng độ bám và độ đàn hồi.
                - Lớp bảo vệ nylon – Giữ độ ẩm, giúp quấn cán luôn mềm mại và không bị khô cứng`, category_id: createCategory[1]._id, brand_id: createBrand[0]._id, type_id: createType[1]._id, discount: 0, update_at: Date.now() },
            { prod_id: 5, prod_name: "Giày cầu lông Yonex Power Cushion 65Z4", price: 2500000, stock: 20, quantity_sold: 7, 
                description: 
                `Giày cầu lông Yonex Power Cushion 65Z4 là mẫu giày trung cấp được ưa chuộng nhờ khả năng bảo vệ chân vượt trội, phù hợp cho cả người chơi phong trào và bán chuyên.

                👟 Tính năng nổi bật
                - Công nghệ Power Cushion+ giúp hấp thụ sốc và hoàn trả năng lượng hiệu quả, giảm áp lực lên gót chân khi di chuyển nhanh.
                - Mặt trên giày sử dụng lưới thoáng khí kết hợp chất liệu da tổng hợp giúp ôm chân, bền chắc.
                - Đế ngoài chống trượt cao cấp phù hợp mọi bề mặt sân.
                - Thiết kế hiện đại, dễ phối đồ thi đấu.

                👤 Phù hợp cho người chơi yêu cầu sự êm ái, ổn định khi di chuyển và hỗ trợ tốt trong các trận đấu có cường độ cao.`
                , category_id: createCategory[2]._id, brand_id: createBrand[0]._id, type_id: createType[0]._id, discount: 15, update_at: Date.now() },
            { prod_id: 6, prod_name: "Yonex Expert Tournament Bag BAG022331W", price: 3000000, stock: 15, quantity_sold: 17,
                description: `Túi cầu lông Yonex Expert Tournament Bag BAG022331W là mẫu túi cao cấp, thiết kế chuyên biệt cho các giải đấu và người chơi chuyên nghiệp.

                👜 Đặc điểm nổi bật
                - Chất liệu cao cấp chống thấm nước và chống mài mòn.
                - Có thể đựng từ 6–9 cây vợt cùng quần áo, giày và phụ kiện.
                - Có ngăn đựng giày riêng biệt, chống bám mùi sang ngăn khác.
                - Dây đeo êm ái, có thể mang như balo hoặc túi xách.
                - Logo Yonex thêu nổi bật, phong cách thể thao chuyên nghiệp.
                
                🎯 Phù hợp cho vận động viên, huấn luyện viên hoặc người chơi thường xuyên đi thi đấu.`
                , category_id: createCategory[3]._id, brand_id: createBrand[0]._id, type_id: createType[0]._id, discount: 10, update_at: Date.now()},
            { prod_id: 7, prod_name: "Yonex Power Cushion Sonicage Plus", price: 2800000, stock: 25, quantity_sold: 3, 
                description: "Giày cầu lông nhẹ, êm ái với công nghệ Power Cushion tăng cường khả năng hấp thụ lực và bảo vệ chân."
                , category_id: createCategory[2]._id, brand_id: createBrand[0]._id, type_id: createType[0]._id, discount: 10, update_at: Date.now() },
            { prod_id: 8, prod_name: "Yonex Women’s Power Cushion Sonicage 3", price: 2700000, stock: 30, quantity_sold: 12, description: "Giày cầu lông dành cho nữ với thiết kế thời trang, nhẹ nhàng, hỗ trợ tối ưu cho người chơi.", category_id: createCategory[2]._id, brand_id: createBrand[0]._id, type_id: createType[0]._id, discount: 12, update_at: Date.now() },
            { prod_id: 9, prod_name: "Yonex Expert Racquet Bag BA02526EX", price: 3200000, stock: 10, quantity_sold: 11, description: "Túi vợt cầu lông cao cấp với nhiều ngăn tiện dụng, phù hợp cho vận động viên chuyên nghiệp.", category_id: createCategory[3]._id, brand_id: createBrand[0]._id, type_id: createType[1]._id, discount: 15, update_at: Date.now() },
            { prod_id: 10, prod_name: "Victor Bravesword 12 SE", price: 4500000, stock: 8, quantity_sold: 9, 
                description: `Victor Bravesword 12 SE là phiên bản giới hạn đặc biệt của dòng vợt Bravesword nổi tiếng, nổi bật với tốc độ và khả năng điều khiển vượt trội.

                📌 Tính năng chính
                - Công nghệ Sword Frame: thiết kế khung dạng kiếm giúp giảm lực cản không khí, tăng tốc độ vung vợt đáng kể.
                - Trục vợt dẻo trung bình, dễ kiểm soát, hỗ trợ lối chơi công thủ toàn diện.
                - Cấu trúc khung bền chắc từ High Modulus Graphite giúp tăng độ ổn định trong từng pha đánh.
                - Màu sắc phiên bản đặc biệt với chi tiết ánh kim nổi bật.
                
                🎯 Phù hợp cho người chơi thiên về phản xạ nhanh, cần vợt linh hoạt để đối phó trong các tình huống tốc độ cao.`
                , category_id: createCategory[0]._id, brand_id: createBrand[2]._id, type_id: createType[2]._id, discount: 5, update_at: Date.now() },
            { prod_id: 11, prod_name: "Yonex Astrox 7DG", price: 2000000, stock: 12, quantity_sold: 13, description: "Vợt cầu lông Yonex Astrox 7DG với thiết kế hơi nặng đầu, thân trung bình, phù hợp cho lối chơi công thủ toàn diện. Công nghệ Durable Grade (DG) tăng độ bền và hiệu suất.", category_id: createCategory[0]._id, brand_id: createBrand[0]._id, type_id: createType[2]._id, discount: 8, update_at: Date.now() },
            { prod_id: 12, prod_name: "Yonex Power Cushion Eclipsion Z3 Men", price: 3200000, stock: 20, quantity_sold: 4, 
                description: `Yonex Power Cushion Eclipsion Z3 Men là mẫu giày cầu lông cao cấp dành cho nam, tối ưu hóa khả năng bảo vệ và hiệu suất thi đấu.

                👟 Tính năng nổi bật
                
                * Công nghệ Power Cushion + hỗ trợ giảm chấn và hoàn trả lực tối ưu.
                * Đế Radial Blade Sole tăng độ bám sân, giúp di chuyển linh hoạt và vững vàng hơn.
                * Mặt giày bằng Double Russel Mesh siêu nhẹ và thông thoáng.
                * Cấu trúc giày Inner Bootie không có lưỡi giày truyền thống, giúp ôm sát bàn chân như đi tất.
                * Thiết kế khỏe khoắn, thể thao, phù hợp các tay vợt chuyên nghiệp.
                
                🎯 Phù hợp cho người chơi có cường độ vận động cao, cần sự ổn định và bảo vệ tối đa cho cổ chân.`
            , category_id: createCategory[2]._id, brand_id: createBrand[0]._id, type_id: createType[0]._id, discount: 10, update_at: Date.now() },
            { prod_id: 13, prod_name: "Yonex 7526 Badminton Bag", price: 2700000, stock: 15, quantity_sold: 14, description: "Túi cầu lông Yonex 7526 tiện dụng với thiết kế thời trang, nhiều ngăn lưu trữ cho vợt và phụ kiện.", category_id: createCategory[3]._id, brand_id: createBrand[0]._id, type_id: createType[1]._id, discount: 12, update_at: Date.now() },
            { prod_id: 14, prod_name: "Yonex Astrox 66", price: 2900000, stock: 10, quantity_sold: 19, description: "Vợt cầu lông Yonex Astrox 66 với trọng lượng nhẹ và thiết kế nặng đầu, lý tưởng cho lối chơi tấn công.", category_id: createCategory[0]._id, brand_id: createBrand[0]._id, type_id: createType[2]._id, discount: 8, update_at: Date.now() }

        ]);

        const createProductImage = await ProductImage.insertMany([
            { prod_image_id: 1, prod_id: createProduct[0]._id, image: "https://res.cloudinary.com/dgc2ww7fc/image/upload/v1744736531/YonexAstrox99Pro_arn1io.webp", is_primary_image: true },
            { prod_image_id: 2, prod_id: createProduct[1]._id, image: "https://res.cloudinary.com/dgc2ww7fc/image/upload/v1744736530/LiningN90IV_ubahc0.webp", is_primary_image: true},
            { prod_image_id: 3, prod_id: createProduct[2]._id, image: "https://res.cloudinary.com/dgc2ww7fc/image/upload/v1744736530/VictorThrusterK9900_i67z8f.webp", is_primary_image: true },
            { prod_image_id: 4, prod_id: createProduct[3]._id, image: "https://res.cloudinary.com/dgc2ww7fc/image/upload/v1744736530/YonexAC102_igfnen.jpg", is_primary_image: true },
            { prod_image_id: 5, prod_id: createProduct[4]._id, image: "https://res.cloudinary.com/dgc2ww7fc/image/upload/v1744736531/YonexPowerCushion65Z4_pklkfc.jpg", is_primary_image: true },
            { prod_image_id: 6, prod_id: createProduct[5]._id, image: "https://res.cloudinary.com/dgc2ww7fc/image/upload/v1744736530/YonexExpertRacquetBagBA02526EX_webpdu.jpg", is_primary_image: true },
            { prod_image_id: 7, prod_id: createProduct[6]._id, image: "https://res.cloudinary.com/dgc2ww7fc/image/upload/v1744736531/YonexPowerCushionSonicagePlus_hofcrp.jpg", is_primary_image: true },
            { prod_image_id: 8, prod_id: createProduct[7]._id, image: "https://res.cloudinary.com/dgc2ww7fc/image/upload/v1744736532/YonexWomenPowerCushionSonicage3_bwyyqp.jpg", is_primary_image: true },
            { prod_image_id: 9, prod_id: createProduct[8]._id, image: "https://res.cloudinary.com/dgc2ww7fc/image/upload/v1744736531/YonexExpertTournamentBagBAG022331W_nfudki.jpg", is_primary_image: true },
            { prod_image_id: 10, prod_id: createProduct[9]._id, image: "https://res.cloudinary.com/dgc2ww7fc/image/upload/v1744736530/VictorBravesword12SE_moxhmw.jpg", is_primary_image: true },
            { prod_image_id: 11, prod_id: createProduct[10]._id, image: "https://res.cloudinary.com/dgc2ww7fc/image/upload/v1744736531/YonexAstrox7DG_sxaikj.jpg", is_primary_image: true },
            { prod_image_id: 12, prod_id: createProduct[11]._id, image: "https://res.cloudinary.com/dgc2ww7fc/image/upload/v1744736531/YonexPowerCushionEclipsionZ3Men_bosvcv.jpg", is_primary_image: true },
            { prod_image_id: 13, prod_id: createProduct[12]._id, image: "https://res.cloudinary.com/dgc2ww7fc/image/upload/v1744736530/Yonex7526BadmintonBag_djmonm.jpg", is_primary_image: true },
            { prod_image_id: 14, prod_id: createProduct[13]._id, image: "https://res.cloudinary.com/dgc2ww7fc/image/upload/v1744736530/YonexAstrox66_kltcre.jpg", is_primary_image: true }
        ]);

        // Create a sample user
        const createUser = {  // Use User.create instead of insertMany
            name: "nguylam",
            email: "doannguyenlambt1@gmail.com",
            _id: "681597fb688df1cd99c88c79",
        };

        // Create sample orders
        const createOrders = await Order.insertMany([
            {
                user_id: createUser._id,  // Use the _id of the created user
                paymentmethod: "Cash",
                items: [
                    { product: createProduct[0]._id, quantity: 2, price: createProduct[0].price },
                    { product: createProduct[3]._id, quantity: 1, price: createProduct[3].price }
                ],
                shipping: {
                    name: "Nguyễn Văn A",
                    address: "123 Đường ABC, Quận XYZ, TP.HCM",
                    phone: "0901234567",
                    email: "nguyenvana@example.com",
                    note: "Giao hàng giờ hành chính"
                },
                total: 9050000, // Calculate total price based on products
                status: "Succeeded"
            },
            {
                user_id: createUser._id,
                paymentmethod: "Cash",
                items: [
                    { product: createProduct[4]._id, quantity: 1, price: createProduct[4].price },
                    { product: createProduct[6]._id, quantity: 3, price: createProduct[6].price }
                ],
                shipping: {
                    name: "Trần Thị B",
                    address: "456 Đường DEF, Quận UVW, TP.HCM",
                    phone: "0912345678",
                    email: "tranthib@example.com",
                    note: "Không giao giờ nghỉ trưa"
                },
                total: 10900000, // Calculate total price based on products
                status: "Processing"
            }
        ]);

        // Create sample order details
        const createOrderDetails = await OrderDetail.insertMany([
            {
                order_detail_id: 1,
                order_id: createOrders[0]._id,
                prod_id: createProduct[0]._id,
                quantity: 2,
                price: createProduct[0].price * 2
            },
            {
                order_detail_id: 2,
                order_id: createOrders[0]._id,
                prod_id: createProduct[3]._id,
                quantity: 1,
                price: createProduct[3].price
            },
            {
                order_detail_id: 3,
                order_id: createOrders[1]._id,
                prod_id: createProduct[4]._id,
                quantity: 1,
                price: createProduct[4].price
            },
            {
                order_detail_id:4,
                order_id: createOrders[1]._id,
                prod_id: createProduct[6]._id,
                quantity: 3,
                price: createProduct[6].price * 3
            }
        ]);

        console.log("Data Imported!");
        process.exit();
    } catch (e) {
        console.error(`Error: ${e.message}`);
        process.exit(1);
    }
}

seedData();
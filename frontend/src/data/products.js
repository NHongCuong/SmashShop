const products = [
    // 🏸 VỢT CẦU LÔNG
    {
      id: 1,
      name: "Yonex Astrox 99 Pro",
      category: "Vợt cầu lông",
      brand: "Yonex",
      price: 4390000,
      image: "https://cdn.shopvnb.com/uploads/gallery/vot-cau-long-yonex-astrox-99-pro-do-chinh-hang_1735064653.jpg",
      description: "Vợt chuyên công, smash cực mạnh, kiểm soát tốt.",
      details:
        "Yonex Astrox 99 Pro là dòng vợt cao cấp dành cho người chơi tấn công mạnh mẽ. Công nghệ Rotational Generator System giúp cân bằng trọng lượng hoàn hảo, phù hợp cho những cú đập cầu uy lực.",
    },
    {
      id: 2,
      name: "Lining Aeronaut 9000",
      category: "Vợt cầu lông",
      brand: "Lining",
      price: 3790000,
      image: "https://product.hstatic.net/1000387607/product/badminton-racket-aypp124-1-b_31fb9d6486384868b9454907ad2dc2fe_master.jpg",
      description: "Cây vợt kiểm soát hàng đầu, thích hợp cho đấu đôi.",
      details:
        "Lining Aeronaut 9000 có hệ thống khí động học giúp giảm lực cản không khí, tăng tốc độ vung vợt. Thích hợp cho người chơi kiểm soát và phản công nhanh.",
    },
  
    // 👟 GIÀY CẦU LÔNG
    {
      id: 3,
      name: "Yonex Power Cushion 65Z3",
      category: "Giày cầu lông",
      brand: "Yonex",
      price: 2990000,
      image: "https://down-vn.img.susercontent.com/file/vn-11134201-7r98o-ls91kx36r1g3bc",
      description: "Giày cầu lông hỗ trợ giảm chấn, thoải mái tối đa.",
      details:
        "Yonex 65Z3 là dòng giày chuyên dụng với công nghệ Power Cushion giúp hấp thụ chấn động khi tiếp đất, tăng độ bật nhảy và giảm áp lực lên bàn chân.",
    },
    {
      id: 4,
      name: "Victor P9200II",
      category: "Giày cầu lông",
      brand: "Victor",
      price: 2590000,
      image: "https://cdn.hvshop.vn/wp-content/uploads/2023/10/giay-cau-long-victor-p9200ii-4.jpeg",
      description: "Đôi giày bền bỉ, chắc chắn, ổn định khi di chuyển.",
      details:
        "Victor P9200II được thiết kế với đế cao su chống trượt, hỗ trợ chuyển động linh hoạt trên sân. Lớp đệm êm giúp giảm áp lực lên chân khi chơi trong thời gian dài.",
    },
  
    // 👕 QUẦN ÁO CẦU LÔNG
    {
      id: 5,
      name: "Áo Yonex Tournament 1040",
      category: "Quần áo cầu lông",
      brand: "Yonex",
      price: 890000,
      image: "https://product.hstatic.net/1000099199/product/10435aex_mid_1_d2a5cae24149417286b109283999aa2b_large.jpg",
      description: "Áo thi đấu chính hãng, thoáng khí, nhẹ nhàng.",
      details:
        "Yonex Tournament 1040 sử dụng chất liệu vải cao cấp, thấm hút mồ hôi nhanh, giữ cơ thể luôn khô ráo khi chơi.",
    },
    {
      id: 6,
      name: "Quần Lining AAYT007",
      category: "Quần áo cầu lông",
      brand: "Lining",
      price: 590000,
      image: "https://file.hstatic.net/200000099191/file/aapu134-1_bc0214eb5e904d74bb5c7ea5ec1de4df.gif",
      description: "Quần cầu lông chuyên dụng, co giãn linh hoạt.",
      details:
        "Lining AAYT007 có thiết kế đơn giản nhưng đầy phong cách, chất liệu vải co giãn 4 chiều giúp vận động thoải mái nhất.",
    },
  
    // 🎒 TÚI & BALO CẦU LÔNG
    {
      id: 7,
      name: "Balo Victor BR3011",
      category: "Túi cầu lông",
      brand: "Victor",
      price: 1250000,
      image: "https://votcaulongshop.vn/wp-content/uploads/2024/08/balo-victor-china-open.jpg",
      description: "Balo cầu lông có ngăn chống sốc cho vợt.",
      details:
        "Victor BR3011 có thiết kế gọn nhẹ, nhiều ngăn chứa đồ, bảo vệ vợt khỏi va đập khi di chuyển.",
    },
    {
      id: 8,
      name: "Túi cầu lông Yonex Pro 9826",
      category: "Túi cầu lông",
      brand: "Yonex",
      price: 1890000,
      image: "https://phivansport.vn/uploads/Topic/2022/01/28/alibabon_1643359610548082.jpg",
      description: "Túi 6 ngăn đựng vợt chuyên dụng cho vận động viên.",
      details:
        "Yonex Pro 9826 có sức chứa lớn, có thể đựng đến 6 cây vợt cùng lúc, phù hợp cho các tay vợt chuyên nghiệp.",
    },
  
    // 🏸 PHỤ KIỆN CẦU LÔNG
    {
      id: 9,
      name: "Cước Yonex BG66 Ultimax",
      category: "Phụ kiện cầu lông",
      brand: "Yonex",
      price: 280000,
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQh1VY9gjRSqOivzpaLpJSxBmSPBa2h5iKG4w&s",
      description: "Cước vợt chuyên nghiệp, độ bền cao, kiểm soát tốt.",
      details:
        "Yonex BG66 Ultimax có đường kính siêu mỏng 0.65mm, mang lại độ nảy cao và cảm giác chạm cầu tốt nhất.",
    },
    {
      id: 10,
      name: "Quấn cán vợt Lining GP1000",
      category: "Quấn cán",
      brand: "Lining",
      price: 150000,
      image: "https://product.hstatic.net/1000362402/product/86ad06cbf98eb55240500946d051c9d6_337b0eb27d7d40299beb8747b0a81f9d_69e8fa4ee1ce4116941bfbc67ff930a6.jpg",
      description: "Quấn cán chống trơn, thấm hút mồ hôi tốt.",
      details:
        "Lining GP1000 giúp tăng độ bám khi cầm vợt, tạo cảm giác chắc chắn và thoải mái trong quá trình thi đấu.",
    },
  
    // 🏋 KHÁC (THIẾT BỊ HỖ TRỢ)
    {
      id: 11,
      name: "Máy bắn cầu VICTOR C-7030",
      category: "Khác",
      brand: "Victor",
      price: 12900000,
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRWo2bYuCpZKQLdoK3rmcFkksxX1dtKxkdrrQ&s",
      description: "Máy bắn cầu tự động, điều chỉnh tốc độ và hướng.",
      details:
        "Victor C-7030 là máy bắn cầu chuyên dụng cho việc luyện tập, giúp nâng cao phản xạ và tốc độ di chuyển trên sân.",
    },
    {
      id: 12,
      name: "Thảm tập cầu lông ProCourt",
      category: "Khác",
      brand: "ProCourt",
      price: 4500000,
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTKJkCN1tQUxvL2s9t_v3D0qtLPHRRRaXgmXA&s",
      description: "Thảm sân cầu lông chuyên dụng, chống trơn trượt.",
      details:
        "ProCourt sản xuất thảm sân cầu lông với chất liệu cao cấp, đảm bảo độ bám và độ bền cao khi sử dụng lâu dài.",
    },
    {
      id: 13,
      name: "Thảm tập cầu lông ProCourt",
      category: "Khác",
      brand: "ProCourt",
      price: 4500000,
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTKJkCN1tQUxvL2s9t_v3D0qtLPHRRRaXgmXA&s",
      description: "Thảm sân cầu lông chuyên dụng, chống trơn trượt.",
      details:
        "ProCourt sản xuất thảm sân cầu lông với chất liệu cao cấp, đảm bảo độ bám và độ bền cao khi sử dụng lâu dài.",
    },
    {
      id: 14,
      name: "Thảm tập cầu lông ProCourt",
      category: "Khác",
      brand: "ProCourt",
      price: 4500000,
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTKJkCN1tQUxvL2s9t_v3D0qtLPHRRRaXgmXA&s",
      description: "Thảm sân cầu lông chuyên dụng, chống trơn trượt.",
      details:
        "ProCourt sản xuất thảm sân cầu lông với chất liệu cao cấp, đảm bảo độ bám và độ bền cao khi sử dụng lâu dài.",
    },
  ];
  
  export default products;
  
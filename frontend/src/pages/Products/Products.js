  import ProductsList from "../../components/ProductsList/ProductsList";
  // import products from "../../data/products";
  import "./Products.css";
  import Header from "../../components/Header/Header";
  import Footer from "../../components/Footer/Footer.js";
  import { useState, useEffect, useMemo } from "react";
  import { useParams, useNavigate, useSearchParams  } from "react-router-dom";
  import { useSelector, useDispatch } from "react-redux";
  import { useGetAllProductsQuery, useGetProductsQuery } from "../../features/product/productApi.js";
  import { useGetCategoriesQuery } from "../../features/services/categoryApi.js";
  import { setSearchTerm } from "../../features/search/searchSlice.js";

  const Products = () => {
    const slugify = (text) =>
      text.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-')
        .replace(/^-+/, '').replace(/-+$/, '');
    //DANH MỤC SẢN PHẤM
    const { category } = useParams();
    const { data: categories } = useGetCategoriesQuery();

    const navigate = useNavigate();
    const dispatch = useDispatch();
    //TÌM KIẾM
    const [searchParams] = useSearchParams();
    // const globalSearchTerm = useSelector((state) => state.search.searchTerm);
    const searchTerm = useSelector(state => state.search.searchTerm);
    useEffect(() => {
      const urlSearch = searchParams.get("search")?.toLowerCase() || "";
      dispatch(setSearchTerm(urlSearch));
    }, [searchParams, dispatch]);

    //FILTER
    //GIÁ
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    //SORT
    const [sortOption, setSortOption] = useState('price_asc');
    //CATEGORY
    const [selectedCategory, setSelectedCategory] = useState('');
    //BRAND
    const [selectedBrands, setSelectedBrands] = useState([]);
    //TYPE
    const [selectedTypes, setSelectedTypes] = useState([]);
    //PHÂN TRANG
    const [currentPage, setCurrentPage] = useState(1);
    const [filteredProducts, setFilteredProducts] = useState([]);

    //FETCH PRODUCTS
    const { data, isLoading } = useGetAllProductsQuery({
      search: searchTerm,
      brand: selectedBrands, 
      type: selectedTypes,
      category: selectedCategory,
      minPrice: minPrice ? parseInt(minPrice) : '',
      maxPrice: maxPrice ? parseInt(maxPrice) : '', 
      page: currentPage,
      limit: 12,
      sort: sortOption,
    });
  

    const categorySlugMap = useMemo(() => {
      const map = {};
      categories?.forEach(cat => {
        map[slugify(cat.category_name)] = cat._id;
      });
      return map;
    }, [categories]);

    const products = data?.data || [];
    const totalPages = data?.totalPages || 1;

    useEffect(() => {
      setCurrentPage(1); // Reset về page 1 khi filter thay đổi
    }, [searchTerm, selectedBrands, minPrice, maxPrice, selectedTypes, category, sortOption]);
    useEffect(() => {
      if (data?.data) {
        setFilteredProducts(data.data);
      }
    }, [data]);
    useEffect(() => {
      if (category && categorySlugMap[category]) {
        setSelectedCategory(categorySlugMap[category]);
      } else {
        setSelectedCategory('');
      }
    }, [category, categorySlugMap]);
    //// SORT - HEADER
    const handleSortChange = (value) => setSortOption(value);
    const toggleBrandFilter = (brand) => {
      setSelectedBrands(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]);
    };
  
    const toggleTypeFilter = (type) => {
      setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
    };

    const allBrands = [...new Map(products.map(p => [p.brand_id._id, p.brand_id])).values()];
    const allTypes = [...new Map(products.map(p => [p.type_id._id, p.type_id])).values()];
    // const { data: brandsData } = useGetAllBrandsQuery();
    // const { data: typesData } = useGetAllTypesQuery();

    // const allBrands = brandsData || [];
    // const allTypes = typesData || [];

    // const { data: productss = [] } = useGetProductsQuery();
    // const allBrands = useMemo(() => {
    //     const unique = {};
    //     return productss.reduce((acc, curr) => {
    //       const brand = curr.brand_id;
    //       if (brand && !unique[brand._id]) {
    //         unique[brand._id] = true;
    //         acc.push(brand);
    //       }
    //       return acc;
    //     }, []);
    //   }, [productss]);
    
    //   const allTypes= useMemo(() => {
    //     const unique = {};
    //     return productss.reduce((acc, curr) => {
    //       const type = curr.type_id;
    //       if (type && !unique[type._id]) {
    //         unique[type._id] = true;
    //         acc.push(type);
    //       }
    //       return acc;
    //     }, []);
    //   }, [productss]);
    const sortOptions = [
      { label: 'Phổ biến', value: 'best_selling' },
      { label: 'Mới nhất', value: 'newest' },
      { label: 'Giá tăng dần', value: 'price_asc' },
      { label: 'Giá giảm dần', value: 'price_desc' },
    ];
    return (
      <>
      <Header/>
      {/* HEADER - FILTER */}

      <div className="products-header-container">
            <p className="products-header"> SẢN PHẨM</p>
            <div className="products-filter-top"> 
              <div className="category-filter">
              <div className="sort-options">
                <label>Sắp xếp theo:</label>

                {/* Render các nút cho best_selling và newest */}
                {sortOptions.slice(0, 2).map((option) => (
                  <button
                    key={option.value}
                    className={sortOption === option.value ? 'active' : ''}
                    onClick={() => handleSortChange(option.value)}
                  >
                    {option.label}
                  </button>
                ))}

                {/* Render dropdown cho giá */}
                <select value={sortOption} onChange={(e) => handleSortChange(e.target.value)}>
                  {sortOptions.slice(2).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              </div>
            </div>
      </div>
      <div className="product-page">


        <aside className="filter-section">
          {/* SIDEBAR - FILTER */}
          <div className="price-filter">
            <h3>Chọn mức giá</h3>
            <label>Từ:</label>
            <input type="number" placeholder="Nhập giá" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
            <label>Đến:</label>
            <input type="number" placeholder="Nhập giá" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
          </div>

          <div className="brand-type-filter">
            <h3>Thương hiệu</h3>
            {allBrands.map((brand) => (
              <label key={brand._id}>
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(brand._id)}
                  onChange={() => toggleBrandFilter(brand._id)}
                />
                {brand.brand_name}
              </label>
            ))}
            <h3>Loại</h3>
            {allTypes.map((type) => (
              <label key={type._id}>
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(type._id)}
                  onChange={() => toggleTypeFilter(type._id)}
                />
                {type.type_name}
              </label>
            ))}
          </div>
        </aside>
        <ProductsList 
          products={filteredProducts} 
          fullWidth={false} 
          isPaginated={true} 
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
        />
      </div>
      <Footer/>
      </>
    );
  };

  export default Products;

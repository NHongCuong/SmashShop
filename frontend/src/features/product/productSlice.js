import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from 'axios'

//Call API
export const fetchAllProducts = createAsyncThunk( //createAsyncThunk dùng để thực hiện các thao tác bất đồng bộ 
    'products/fetchProducts',
    async() => {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/v1/products`)
        return response.data.data
    }
)

// initialState = {
//     items: [],
//     status: 'idle',
//     error: null 
// }

const productSlice = createSlice({
    name: 'products',
    initialState: {
        items: [],
        status: 'idle',
        error: null 
    } ,
    reducer: {

    },
    extraReducers: (builder) => { //extraReducers để xử lí các trạng thái bất đồng bộ tạo bởi createAsyncThunk
        // pending, fulfill, rejected tương tự như các trạng thái khi call API: đang chờ, thành công, thất bại
        builder
        .addCase(fetchAllProducts.pending, (state) => {
            state.status = 'loading'
          })
          .addCase(fetchAllProducts.fulfilled, (state, action) => {
            state.status = 'succeeded'
            state.items = action.payload //action.payload là dữ liệu trả về khi call thành công API (response.data.data)
          })
          .addCase(fetchAllProducts.rejected, (state, action) => {
            state.status = 'failed'
            state.error = action.error.message // action.error.message chứa thông tin lỗi thao tác bất đồng bộ( call API)
          })
      },
})
export default productSlice.reducer;
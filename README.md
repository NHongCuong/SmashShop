<p  align="center">

<img  src="https://www.uit.edu.vn/sites/vi/files/banner_uit.png"  style="display: block; margin: 0 auto">

</p>

  

<h1  align="center"><b>[IE213.P21] - Smash Shop - Website bán dụng cụ cầu lông </b>  </h1>

  - Trường Đại học Công nghệ thông tin, Đại học Quốc gia TP.HCM 
  - Khoa: Khoa học và kĩ thuật thông tin
  - GVHD: Ths. Võ Tấn Khoa
  
  ## Danh sách thành viên
  | STT |        Họ tên         |   MSSV    |   Chức vụ   |
| :-: | :-------------------: | :-------: | :---------: |
| 1.  |    Đoàn Nguyễn Lâm    | 22520736  | Nhóm trưởng |
| 2.  | Cao Thiên An | 225220008 | Thành viên  |
| 3.  |     Bùi Thanh Phong     | 22521082  | Thành viên  |


## Overview

  

-  **Smash Shop** là website bán các dụng cụ liên quan đến môn thể thao cầu lông như vợt, giày cầu lông, túi cầu lông, quấn cán vợt.

- Công nghệ sử dụng: 
	+ Mern stack: MongoDB, Express, ReactJs, NodeJs
	+ Docker: Containerization platform
	+ Dokploy: hỗ trợ triển khai ứng dụng web

  
## Installation

 ### Cách 1:  Clone repository từ github 
#### Clone repository

```bash

git  clone https://github.com/NguyLam2704/IE213.git
cd IE213 

```

  

#### Cài đặt Backend

```bash
cd backend
npm install
```
#### Cài đặt Frontend

```bash
cd frontend
npm install
```
#### Cấu hình biến môi trường cho Backend
Trong thư mục backend, tạo file `.env` và cấu hình các biến môi trường như sau: 
```bash
# MongoDB
MONGO_URI=<YOUR MONGODB CONNECTION STRING>
PORT=5001

# Email
EMAIL=<YOUR EMAIL>
EMAIL_APP_PASSWORD=<YOUR GENERATE APP PASSWORD>

# JWT
JWT_SECRET=<YOUR JWT SECRET KEY>
JWT_REFRESH_SECRET=<YOUR JWT REFRESH SECRET KEY>

# Cloudinary
CLOUDINARY_CLOUD_NAME=<YOUR CLOUDINARY CLOUD NAME>
CLOUDINARY_API_KEY=<YOUR CLOUDINARY API KEY>
CLOUDINARY_API_SECRET=<YOUR CLOUDINARY API SECRET>

#VNPAY
VNP_TMNCODE=<YOUR VNP TMNCODE> 
VNP_HASH_SECRET=<YOUR VNP HASH SECRET> 
VNP_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html 
VNP_RETURN_URL=<YOUR VNP RETURN URL> 

#GEMINI API KEY
GEMINI_API_KEY=<YOUR GEMINI API KEY>

# Frontend
FRONTEND_URL=http://localhost:3000

# Server
URL_SERVER=http://localhost:5001
  
```

#### Cấu hình biến môi trường cho Frontend
Trong thư mục `frontend`, tạo file `.env` và cấu hình biến môi trường như sau:
```bash
REACT_APP_API_URL=<YOUR SERVER URL>
```

#### Khởi chạy ứng dụng
Từ thư mục IE213:
- Backend: 
```bash 
cd backend 
npm start 
```
  - Frontend: 

```bash
cd frontend 
npm start
```
### Cách 2: Pull image từ Docker Hub
#### Pull image từ của backend và frontend từ Docker Hub
```bash
docker pull doanlam2704/ie213-backend 
docker pull doanlam2704/ie213-frontend 
```
#### Cấu hình biến môi trường
- Backend:
```bash 
mkdir backend 
cd backend 
```
Trong thư mục `backend`, tạo file `.env` và cấu hình các biến môi trường tương tự như ở bước 1
- Frontend
```bash
mkdir frontend
cd frontend
```
Trong thư mục `frontend`, tạo file .env và cấu hình các biến môi trường tương tự như ở bước 1
#### Khởi chạy ứng ụng 
Từ thư mục cha của thư mục `frontend` và thư mục `backend`
```bash
docker run -p 5001:5001 --env-file backend/.env doanlam2704/backend
docker run -p 3000:80 --env-file frontend/.env doanlam2704/frontend 
```

 

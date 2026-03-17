# Stage 1: Build React
FROM node:22.14-alpine AS build

# Tạo user và group với home directory hợp lệ
RUN addgroup --system appgroup && \
    adduser --system --ingroup appgroup --home /home/appuser appuser

# Tạo home và thư mục làm việc, set quyền
RUN mkdir -p /home/appuser /app && \
    chown -R appuser:appgroup /home/appuser /app
# Nhận biến môi trường từ build args
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

WORKDIR /app

COPY package*.json ./
RUN npm ci  
COPY . ./
RUN npm run build

# Stage 2: Serve React bằng Nginx
FROM nginx:alpine AS production
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

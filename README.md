# 情侣私密空间

一个浪漫的情侣专属 Web 应用，支持照片/视频上传、恋爱时间线、相恋计时等功能。

## 技术栈

- **前端**: Vue 3 + Vite + TailwindCSS + Pinia
- **后端**: Node.js 22 + Express + SQLite
- **部署**: Docker + Docker Compose + Nginx
- **SSL**: Let's Encrypt (Certbot)

## 开发环境

### 前置要求

- Node.js 20+
- Git
- Docker Desktop (可选，用于本地测试)

### 本地开发

```bash
# 后端 (端口 3000)
cd backend
npm install
npm run dev

# 前端 (端口 5173，自动代理 /api → localhost:3000)
cd frontend
npm install
npm run dev
```

### 环境变量

复制 `.env.example` 为 `.env` 并配置：

```env
JWT_SECRET=<随机32位以上字符串>
ANNIVERSARY_DATE=YYYY-MM-DD
PORT=3000
NODE_ENV=development
MAX_FILE_SIZE_MB=100
```

## 生产部署

### 服务器规格

- **系统**: Ubuntu 22.04 LTS
- **配置**: 2核4G内存 / 50GB系统盘 / 3Mbps带宽
- **域名**: 已解析到服务器 IP

### 部署步骤

#### 1. 服务器初始化

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Docker
sudo apt install -y docker.io docker-compose git

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker
```

#### 2. 配置 Docker 镜像源

```bash
# 创建 Docker 配置
sudo tee /etc/docker/daemon.json > /dev/null <<'EOF'
{
  "registry-mirrors": ["https://docker.m.daocloud.io"]
}
EOF

# 重启 Docker
sudo systemctl restart docker
```

#### 3. 配置防火墙

```bash
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw --force enable
```

#### 4. 克隆项目

```bash
cd ~
git clone https://gitee.com/octopus1024/couple-space.git
cd couple-space
```

#### 5. 配置环境变量

```bash
cp .env.example .env
nano .env
```

修改以下配置：
- `JWT_SECRET`: 使用 `openssl rand -base64 32` 生成
- `ANNIVERSARY_DATE`: 你们的纪念日 (YYYY-MM-DD)
- `DOMAIN`: 你的域名
- `NODE_ENV`: production

#### 6. 启动服务

```bash
docker-compose up -d --build
```

#### 7. 配置 SSL 证书

```bash
# 安装 Certbot 并获取证书
docker-compose exec nginx sh -c "apk add certbot certbot-nginx && \
  certbot --nginx -d 你的域名 \
  --email 你的邮箱 \
  --agree-tos \
  --no-eff-email"
```

#### 8. 验证部署

访问 `https://你的域名`，应该能看到登录页面。

**重要：首次初始化**

首次部署后，访问 `https://你的域名/setup` 创建双方账号并设置纪念日。

- Setup 页面仅在初始化前可访问（`setup_done = 0`）
- 完成初始化后，访问 `/setup` 会自动跳转到登录页面
- 这确保了账号信息的隐私性和安全性

## 维护指南

### 日常维护

#### 查看服务状态

```bash
cd ~/couple-space
docker ps
docker logs couple-backend
docker logs couple-nginx
```

#### 重启服务

```bash
docker-compose restart
```

#### 停止服务

```bash
docker-compose down
```

### SSL 证书续期

证书有效期 3 个月，到期前需要手动续期：

```bash
cd ~/couple-space
docker-compose exec nginx sh -c "apk add certbot certbot-nginx && \
  certbot renew --nginx"
```

**建议**: 在证书到期前 1 周执行续期操作。

### 代码更新

#### 从 Git 拉取更新

```bash
cd ~/couple-space
git pull
```

#### 重新构建并启动

```bash
# 如果只更新了代码
docker-compose up -d --build

# 如果更新了依赖或 Dockerfile
docker-compose down
docker-compose up -d --build
```

### 数据备份

#### 备份数据库和上传文件

```bash
cd ~/couple-space
tar -czf backup-$(date +%Y%m%d).tar.gz data/
```

#### 恢复备份

```bash
cd ~/couple-space
tar -xzf backup-YYYYMMDD.tar.gz
docker-compose restart
```

**建议**: 定期备份（每周或每月），并将备份文件下载到本地保存。

### 监控和日志

#### 查看实时日志

```bash
# 后端日志
docker logs -f couple-backend

# Nginx 日志
docker logs -f couple-nginx
```

#### 磁盘空间监控

```bash
# 查看磁盘使用情况
df -h

# 查看上传文件大小
du -sh ~/couple-space/data/uploads/
```

### 常见问题

#### 1. 容器无法启动

```bash
# 查看详细错误
docker logs couple-backend
docker logs couple-nginx

# 检查端口占用
sudo netstat -tulpn | grep -E ':(80|443|3000)'
```

#### 2. 无法访问网站

- 检查防火墙规则: `sudo ufw status`
- 检查 DNS 解析: `nslookup 你的域名`
- 检查容器状态: `docker ps`

#### 3. 上传文件失败

- 检查磁盘空间: `df -h`
- 检查文件大小限制: `.env` 中的 `MAX_FILE_SIZE_MB`
- 查看后端日志: `docker logs couple-backend`

#### 4. SSL 证书问题

```bash
# 检查证书状态
docker-compose exec nginx certbot certificates

# 强制续期
docker-compose exec nginx sh -c "apk add certbot certbot-nginx && \
  certbot renew --force-renewal --nginx"
```

### 性能优化

#### 清理 Docker 资源

```bash
# 清理未使用的镜像
docker image prune -a

# 清理未使用的容器
docker container prune

# 清理未使用的卷
docker volume prune
```

#### 数据库优化

SQLite 数据库会随着使用增长，定期优化：

```bash
docker-compose exec backend sh -c "sqlite3 /app/data/db/couple.db 'VACUUM;'"
```

## 开发指南

### 项目结构

```
couple-space/
├── backend/          # Node.js 后端
│   ├── src/
│   │   ├── index.js       # 入口文件
│   │   ├── config.js      # 配置管理
│   │   ├── database/      # SQLite 数据库
│   │   ├── routes/        # API 路由
│   │   └── middleware/    # 中间件
│   └── Dockerfile
├── frontend/         # Vue 3 前端
│   ├── src/
│   │   ├── views/         # 页面组件
│   │   ├── components/    # 通用组件
│   │   ├── stores/        # Pinia 状态管理
│   │   └── router/        # 路由配置
│   └── Dockerfile
├── nginx/            # Nginx 配置
│   └── nginx.conf
├── docker-compose.yml
└── .env
```

### 添加新功能

1. 后端添加 API 路由到 `backend/src/routes/`
2. 前端添加页面到 `frontend/src/views/`
3. 更新数据库 schema 到 `backend/src/database/init.js`
4. 本地测试后提交到 Git
5. 服务器上 `git pull` 并重新构建

## 安全建议

1. **定期更新**: 每月检查并更新系统和 Docker 镜像
2. **强密码**: JWT_SECRET 使用强随机字符串
3. **备份**: 定期备份数据库和上传文件
4. **监控**: 定期检查日志，发现异常及时处理
5. **防火墙**: 只开放必要端口 (22, 80, 443)
6. **初始化保护**: Setup 页面完成初始化后自动禁用，防止账号信息泄露
7. **登录保护**: 连续 5 次登录失败后账号锁定 15 分钟，防止暴力破解

## 许可证

MIT License

## 联系方式

如有问题，请提交 Issue 或 Pull Request。

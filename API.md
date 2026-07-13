# Pan Worker API

基于 Cloudflare Workers 的 R2 文件管理 API，提供文件树浏览和下载链接生成。

## 技术栈

- **运行时**: [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- **存储**: [Cloudflare R2](https://developers.cloudflare.com/r2/)
- **语言**: TypeScript
- **测试**: Vitest + `@cloudflare/vitest-pool-workers`

## API 端点

所有端点均支持 CORS（`Access-Control-Allow-Origin: *`），仅接受 `GET` 请求。

---

### `GET /api/files`

列出 R2 桶中的文件树，包含文件名、大小、修改时间及下载链接。

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `prefix` | string | 否 | 按路径前缀过滤，如 `docs/` 仅列出该目录下的文件 |

#### 响应格式

```json
{
  "tree": [
    {
      "name": "docs",
      "type": "directory",
      "path": "docs/",
      "children": [
        {
          "name": "guide.txt",
          "type": "file",
          "path": "docs/guide.txt",
          "size": 1024,
          "lastModified": "2026-07-13T12:00:00.000Z",
          "url": "https://pan-file-api.yule.ink/docs/guide.txt"
        }
      ]
    },
    {
      "name": "README.md",
      "type": "file",
      "path": "README.md",
      "size": 512,
      "lastModified": "2026-07-13T12:00:00.000Z",
      "url": "https://pan-file-api.yule.ink/README.md"
    }
  ],
  "count": 2,
  "prefix": null
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `tree` | TreeNode[] | 文件树，目录在前、文件在后，同类按名称字母序排列 |
| `count` | number | 匹配的文件总数 |
| `prefix` | string\|null | 当前过滤前缀（无过滤时为 `null`） |

**TreeNode 字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | 文件/目录名 |
| `type` | `"file"` \| `"directory"` | 节点类型 |
| `path` | string | 完整路径（目录以 `/` 结尾） |
| `size` | number | 文件大小（字节），仅 `file` 类型 |
| `lastModified` | string | ISO 8601 格式的上传时间，仅 `file` 类型 |
| `url` | string | 下载链接，仅 `file` 类型 |
| `children` | TreeNode[] | 子节点列表，仅 `directory` 类型 |

#### 示例

```bash
# 列出所有文件
curl https://pan-worker-api.yule.ink/api/files

# 列出 docs/ 目录下的文件
curl "https://pan-worker-api.yule.ink/api/files?prefix=docs/"
```

---

### `GET /api/download`

获取指定文件的下载链接及元信息。

#### 查询参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `path` | string | **是** | 文件在 R2 桶中的完整路径 |

#### 响应格式

```json
{
  "url": "https://pan-file-api.yule.ink/docs/guide.txt",
  "name": "guide.txt",
  "path": "docs/guide.txt",
  "size": 1024,
  "lastModified": "2026-07-13T12:00:00.000Z",
  "httpMetadata": {
    "contentType": "text/plain"
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `url` | string | 文件直接下载链接 |
| `name` | string | 文件名 |
| `path` | string | 文件在桶中的完整路径 |
| `size` | number | 文件大小（字节） |
| `lastModified` | string | ISO 8601 格式的上传时间 |
| `httpMetadata` | object\|null | HTTP 元数据（Content-Type 等） |

#### 示例

```bash
# 获取文件下载链接
curl "https://pan-worker-api.yule.ink/api/download?path=docs/guide.txt"

# 文件不存在 → 404
curl "https://pan-worker-api.yule.ink/api/download?path=nonexistent.txt"

# 缺少 path 参数 → 400
curl "https://pan-worker-api.yule.ink/api/download"
```

---

### 错误响应

所有错误响应统一格式：

```json
{
  "error": "错误描述信息"
}
```

| HTTP 状态码 | 说明 |
|-------------|------|
| `204` | OPTIONS 预检成功 |
| `400` | 缺少必填参数 |
| `404` | 文件不存在或路由未找到 |
| `405` | 使用了 GET 以外的方法 |
| `500` | 服务器内部错误 |

---

## 项目结构

```
pan-worker-api/
├── src/
│   └── index.ts              # Worker 入口，API 路由与逻辑
├── test/
│   ├── index.spec.ts          # 单元测试 & 集成测试
│   ├── env.d.ts               # 测试环境类型声明
│   └── tsconfig.json          # 测试 TypeScript 配置
├── wrangler.jsonc             # Wrangler 配置（生产：远程 R2）
├── wrangler.test.jsonc        # Wrangler 配置（测试：本地 R2 模拟）
├── vitest.config.mts          # Vitest 配置
├── worker-configuration.d.ts  # 自动生成的绑定类型
├── tsconfig.json              # TypeScript 配置
└── package.json               # 依赖与脚本
```

## 开发

```bash
# 安装依赖
pnpm install

# 启动本地开发服务器（连接远程 R2 桶）
pnpm dev

# 生成 / 更新绑定类型
pnpm cf-typegen

# 运行测试
pnpm test

# 部署到 Cloudflare
pnpm deploy
```

## 部署

Worker 部署后运行在 Cloudflare 全球边缘网络。R2 桶使用自定义域名 `pan-file-api.yule.ink` 提供文件下载。

部署前确保 `wrangler.jsonc` 中的 R2 桶绑定和自定义域名配置正确：

```jsonc
"r2_buckets": [
    {
        "bucket_name": "yulespan",
        "binding": "yulespan",
        "remote": true
    }
]
```

> **注意**：修改 `wrangler.jsonc` 中的 bindings 后需要运行 `pnpm cf-typegen` 更新类型定义。

## 测试说明

- 单元测试使用 `@cloudflare/vitest-pool-workers` 提供的本地 R2 模拟
- 测试配置文件为 `wrangler.test.jsonc`（不含 `"remote": true`，使用本地模拟）
- 生产配置文件为 `wrangler.jsonc`（含 `"remote": true`，连接真实 R2）
- 两个配置文件分开以避免测试环境尝试连接远程 R2 导致超时

## 许可

Private

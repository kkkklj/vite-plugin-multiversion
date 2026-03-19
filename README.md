# vite-plugin-multiversion

通过打包进行多版本控制的 Vite 插件


## 安装

```bash
npm install vite-plugin-multiversion
```

## 使用

### 1. vite.config.ts 配置

```ts
import { defineConfig, loadEnv } from 'vite'
import { resolve } from 'path'
import { versionLink, cleanOldVersions } from 'vite-plugin-multiversion'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, resolve(process.cwd()))
  const NowVersion = Date.now()
  const outDir = mode === 'prod' ? 'dist-prod' : 'dist'

  const appUrlPath = () => {
    const base = env.VITE_APP_URL_PATH
    if (mode === 'dev') return base
    return base + NowVersion + '/'
  }

  return {
    base: appUrlPath(),
    build: {
      outDir: outDir + `/${NowVersion}`,
    },
    plugins: [
      // 其他插件
    ].concat(env.VITE_APP_ENV === 'dev' ? [] : [
      cleanOldVersions({
        outDir,
        now: NowVersion,
        days: 1,
      }),
      versionLink({
        versionDir: String(NowVersion),
        outDir,
      }),
    ]),
  }
})
```

### 2. 环境变量

`.env` 文件:
```
VITE_APP_URL_PATH=/
VITE_APP_ENV=prod
```

`.env.admin` 文件:
```
VITE_APP_URL_PATH=/admin-web/
VITE_APP_ENV=prod
```

## 插件说明

### versionLink

将版本目录下的 `index.html` 复制到 dist 根目录。

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| versionDir | string | - | 版本目录名（如时间戳） |
| outDir | string | 'dist-prod' | 输出目录 |

### cleanOldVersions

删除超过指定天数的旧版本目录。超过指定天数的删除版本中，会保留至少一个版本，防止出现指定删除x天，x+1天再打包把前面的版本全删掉了（保证打包完除了当前版本，至少还有最后的一个线上版本（超过x天））

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| outDir | string | 'dist-prod' | 输出目录 |
| days | number | 2 | 保留天数 |
| now | number | Date.now() | 版本目录名（如时间戳） |

> 删除超过指定天数的旧版本，最少保留1个旧版本

## 目录结构

打包后的目录结构:
```
dist-prod/
├── index.html          # 当前版本入口
├── 1709200000000/      # 版本1
│   ├── index.html
│   ├── assets/
│   └── ...
├── 1709300000000/      # 版本2
│   ├── index.html
│   ├── assets/
│   └── ...
└── 1709400000000/      # 当前版本
    ├── index.html
    ├── assets/
    └── ...
```

## Nginx 配置

```conf
# root写法
# VITE_APP_URL_PATH = '/'
server {
  listen 8084;
  server_name localhost;
  location / {
    root 项目路径/dist-prod;
    try_files $uri $uri/ /index.html;
    index index.html;
  }
}

# alias写法
# VITE_APP_URL_PATH = '/admin-web/'
server {
  listen 8077;
  server_name localhost;
  location /admin-web {
    alias 项目路径/dist-prod/;
    try_files $uri $uri/ /admin-web/index.html;
    index index.html;
  }
}
```

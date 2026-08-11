# 学习打卡与公开学习者墙

状态：暂缓实现，仅保留设计记录。

## 背景

课程当前把进度、错题、连续学习天数、阅读位置和实验笔记保存在浏览器的
`learning-ai-progress-v1` 中，不上传，也没有服务端账户。Giscus 只负责 GitHub
Discussions 评论和 GitHub 登录，不提供完整的学习者名单或课程进度汇总。

因此，首页不能在没有用户明确同意和服务端记录的情况下显示“正在学习”或“已完成”的
GitHub 头像。

## 后续目标

- 用户主动选择是否加入公开学习者墙，默认不公开。
- 首页分别显示“学习中”和“已完成”的 GitHub 头像、用户名和状态。
- 学习中状态具有过期时间，避免长期显示不再活跃的用户。
- 完成状态需要可解释的验证记录，并能撤销或删除公开展示。
- 完成者获得课程自己的 SVG 徽章和公开验证页面，可复制到 GitHub Profile README。

## 推荐方案

### 身份与授权

使用独立 GitHub App 的 OAuth 流程，而不是读取 Giscus iframe 的内部会话。
只申请读取公开 GitHub 身份所需的最小权限；不保存邮箱、访问令牌或仓库代码。

用户在站点上明确点击“加入学习者墙”后，服务端保存类似以下公开字段：

```text
github_login
github_user_id
avatar_url
status: learning | completed
last_check_in_at
completed_at
course_version
```

### 学习中状态

用户主动打卡后显示为 `learning`。建议设置 7 天有效期；再次打卡刷新时间，过期后
首页隐藏但不删除历史完成记录。用户可以立即退出学习者墙。

### 完成状态

当前浏览器中的完课证书是本地纪念品，不是第三方可验证凭证。若要公开显示完成状态，
需要在后续方案中决定以下一种标准：

1. 服务端重新记录并校验每章三题答案；或
2. 用户提交本地完成记录，由服务端生成明确标注“自报完成”的签名记录。

无论采用哪一种，都不能仅凭 GitHub 评论、访问页面或前端传来的 `completed` 字段
判定完成。

### 徽章

徽章应是本课程自己的 SVG 和验证 URL，而不是声称可以授予 GitHub 官方 Achievement。
用户可以把徽章 Markdown 手动放入 GitHub Profile README；GitHub 官方成就由 GitHub
根据其规定的活动自动授予，第三方课程不能直接发放。

## 推荐架构

```text
GitHub Pages / Eleventy
        │
        ├── GitHub App OAuth：获取用户同意与公开身份
        ├── Serverless API：打卡、退出、完成声明、徽章验证
        └── KV / D1 / Postgres：保存最小化的公开状态
```

浏览器不能直接携带 GitHub App 密钥调用 GitHub API。API 还需要限流、重复打卡幂等、
删除接口、滥用举报和缓存策略。

## 待决定事项

- Serverless 平台：Cloudflare Worker/D1、Vercel Functions，或其他托管服务。
- 完成状态：服务端重测，还是标注为“自报完成”。
- 学习中状态的有效期：暂定 7 天。
- 首页公开字段和头像是否允许用户单独隐藏。
- 是否允许匿名计数，而不展示具体头像。

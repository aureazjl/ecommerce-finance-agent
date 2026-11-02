# 电商财务分析平台 2.0

本项目是 `shop_manage` 的独立副本，原有仪表盘、利润表、产品利润贡献、导入、账号权限和后台中控全部保留；智能体模块直接读取本项目自己的 `finance.db`，不通过原项目连接。

## 智能体服务

```bat
run.cmd
```

默认监听 `http://127.0.0.1:18781`，原财务服务仍使用 `18780`。智能体核心代码位于 `engine.py`、`semantic.py` 和 `audit.py`。

## 2.0 目标

- 智能体作为系统核心入口，同时保留原有业务页面
- 自然语言问销售额、利润、成本、部门、主管、组长和产品
- 直接读取本地副本数据库，数据口径与原系统一致
- 受控查询、结果解释、图表结果协议和问数审计
- 后续接入 OpenAI 兼容模型或 Ollama，不改变数据层

详细技术选型见 [ARCHITECTURE.md](ARCHITECTURE.md)。

面向小团队的电商利润表分析平台：上传 CSV/XLSX 后，后端清洗并累计保存到 SQLite，前端提供仪表盘、利润表、产品趋势和移动端查看。

## 给服务器智能体的直接部署提示词

将下面整段复制给服务器上的部署智能体：

```text
请在服务器部署 GitHub 项目 https://github.com/aureazjl/shop_manage.git。

要求：
1. 检查 Python 3.10+、Node.js 18+ 和 npm；缺失时安装，不要覆盖已有业务环境。
2. Linux 放到 /opt/shop_manage，Windows 放到 D:\shop_manage。
3. 后端目录是项目根目录，前端目录是 frontend_shell。
4. 创建 Python 虚拟环境并安装 openpyxl。
5. 在 frontend_shell 执行 npm ci 和 npm run build。
6. 后端使用 PORT=18780 启动 server.py；生产前端使用 frontend_shell/dist。
7. 配置反向代理：/api/ 转发到 127.0.0.1:18780，其余请求指向 frontend_shell/dist，并将未知前端路由回退到 index.html。
8. 只允许通过反向代理访问，不要把 Python 服务直接暴露到公网；启用 HTTPS。
9. 检查 GET /api/health 应返回 {"ok":true}，首次访问应出现管理员初始化页面。
10. 不要上传 finance.db、.env、日志、node_modules、dist 或任何密码。
11. 报告访问地址、后端端口、进程管理方式、健康检查结果和首次登录方式。
12. 如发现仓库有未提交改动，先备份并停止，不要覆盖用户文件。
```

## Linux 部署

```bash
git clone https://github.com/aureazjl/shop_manage.git /opt/shop_manage
cd /opt/shop_manage
python3 -m venv .venv
. .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install openpyxl
cd frontend_shell
npm ci
npm run build
cd ..
PORT=18780 .venv/bin/python server.py
```

生产环境建议使用 systemd、Nginx/Caddy 和 HTTPS，不要使用 `npm run dev` 作为公网服务。

## Windows 部署

```powershell
git clone https://github.com/aureazjl/shop_manage.git D:\shop_manage
cd D:\shop_manage
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install openpyxl
cd frontend_shell
npm ci
npm run build
cd ..
$env:PORT="18780"
python server.py
```

## 首次使用

1. 打开部署后的网页。
2. 首次访问创建管理员账号，密码至少 8 位。
3. 登录后进入“导入数据”上传利润表。
4. 后端会自动创建 `finance.db`，不要把这个文件提交到 GitHub。

## 安全措施

- 密码使用 PBKDF2-SHA256 哈希保存，不保存明文。
- 登录使用 HttpOnly、SameSite 会话 Cookie，有效期 7 天。
- 连续登录失败 5 次后锁定 15 分钟。
- 财务摘要、利润明细和文件导入接口均要求登录。
- 生产环境必须使用 HTTPS、反向代理和防火墙限制后端端口。
- 管理员密码不要写进部署脚本、README、环境变量示例或 Git 提交。

## 本地开发

后端：`python -m pip install openpyxl` 后执行 `python server.py`。

前端：进入 `frontend_shell` 执行 `npm ci`、`npm run dev`。

默认地址：前端 `http://127.0.0.1:5173`，后端 `http://127.0.0.1:18780`。

健康检查：`http://127.0.0.1:18780/api/health`。

## 数据导入规则

- 支持 `.xlsx` 和 `.csv`，支持多个 Sheet。
- 支持一个 Sheet 内连续放置多天数据，日期空白时继承上一条有效日期。
- 自动跳过空行、重复表头、合计/总计/小计行。
- 部门、主管、推广组长支持合并单元格填充。
- 重复导入相同日期和产品会更新记录，不会无限重复插入。

## 目录说明

```text
server.py                  Python API、导入清洗、SQLite 存储、账号认证
finance.db                 运行时数据库，不提交到 GitHub
frontend_shell/src         React 前端源码
frontend_shell/dist        前端构建产物，不提交到 GitHub
PROJECT_LOGIC.md           当前业务逻辑和改造记录
```

## 版本边界

1.0 只做确定性的财务数据导入、清洗、存储和展示；智能体数据分析接口暂不混入现有财务计算口径，后续以独立只读接口接入。

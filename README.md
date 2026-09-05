<div align="center">

# ⚡ PulseMark

### Smart Market Watchlist & Event-Driven Temporal Change Engine

*A modern, high-throughput financial surveillance platform engineered for active traders, quantitative analysts, and investors to track multi-dimensional asset deltas against session baselines, eliminate tabular cognitive fatigue, and surface real-time actionable market anomalies.*

<br/>

[![Next.js](https://img.shields.io/badge/Next.js-14_App_Router-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Fastify-4.x-black?style=for-the-badge&logo=fastify)](https://fastify.dev/)
[![Server-Sent Events](https://img.shields.io/badge/Streaming-SSE_HTTP%2F2-brightgreen?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Redis](https://img.shields.io/badge/Redis-Cache_%26_Failover-red?style=for-the-badge&logo=redis)](https://redis.io/)
[![Yahoo Finance](https://img.shields.io/badge/Data_Feed-NSE_Live_Quotes-purple?style=for-the-badge)](https://finance.yahoo.com/)
[![Status](https://img.shields.io/badge/Build-Passing_%26_Verified-success?style=for-the-badge)](https://github.com/Khushi1310-nayak/PulseMark)

</div>

---

# 📖 Overview

Standard stock watchlists act as dumb tabular spreadsheets: dumping raw green/red daily numbers that force traders to mentally remember where an equity stood hours or days ago.

If a stock opens $+3\%$ at 9:15 AM and stays completely flat for the rest of the day, a standard broker watchlist displays $+3\%$ in green—masking the fact that nothing has happened for four hours. Conversely, if a stock was quiet all morning and suddenly collapses $-2\%$ in ten minutes on $4\times$ volume, the daily change shows only $-1\%$, failing to convey the sudden flash breakdown.

**PulseMark** replaces visual spreadsheet scanning with an **Event-Driven Change Engine**. 

When a user returns after minutes, hours, or days, PulseMark computes multi-dimensional deltas against the exact snapshot of their prior session ($T_0$), scores anomalies across price trajectory, volume compression/spikes, range breaches, and VWAP deviation, and instantly groups items into an actionable **Attention Desk** vs. normal trading.

---

# ✨ Core Features

* 🎯 **Temporal Delta Diffing ($T_0$ vs $T_{\text{now}}$):**  
  Measures price, volume, and volatility displacement relative to the user's exact departure timestamp rather than an arbitrary midnight clock.

* ⚡ **Top Deck Attention Desk:**  
  Automatically promotes equities with anomalous movements into a high-visibility deck with clear, natural-language rationale chips (`Volume: 3.5x normal`, `Broke Day's Resistance`, `Delta: +₹42 since logout`).

* 📊 **High-Density Watchlist Matrix:**  
  Tabular terminal view with real-time micro-flashing on tick up/down (Emerald `#10B981` / Rose `#F43F5E`), smooth Catmull-Rom cubic Bézier trend splines, 52-week range bars, and instant search filtering.

* 🛡️ **3-Tier Circuit Breaker Ingestion:**  
  Fail-safe architecture featuring primary live Yahoo Finance NSE quote batching, secondary Redis stale caching with countdown flags, and tertiary synthetic simulation fallback.

* 🔬 **Asset Deep Dive & Financial Spline Canvas (`/stock/[symbol]`):**  
  Side-by-side session comparison matrix, continuous Catmull-Rom cubic spline trajectory with dual X (Timeline) & Y (Price) coordinate axes, interactive crosshair scrubbing, baseline $T_0$ reference guideline, and threshold audit logs.

* 🎛️ **Interactive Anomaly Heuristic Playground (`/docs`):**  
  Real-time quantitative simulation sandbox with live sliders and instant one-click scenario presets (*Institutional Squeeze, Flash Breakdown, Quiet Session*).

* 🏛️ **Architecture Canvas & Interactive ADRs (`/docs`):**  
  Click-to-inspect 4-stage pipeline visualizer and Architectural Decision Records detailing SSE vs. WebSockets, in-memory buffers, and beacon persistence.

* 🧪 **Evaluator & Scenario Simulator (`?demo=evaluator`):**  
  Built-in scenario testing drawer enabling instant session time-travel (15m, 2h, 1d), volatility shocks ($\pm 4\%$), and simulated network dropouts.

* 💾 **Zero-Loss Beacon Persistence:**  
  Uses `navigator.sendBeacon` to reliably commit exit snapshots to the server on browser close or tab switch without blocking the main UI thread.

* 🚀 **Zero-Config In-Memory Default:**  
  Boots instantly without requiring PostgreSQL or Redis containers, while seamlessly upgrading to Prisma PostgreSQL and Redis when connection strings are provided.

---

# 🏗 System Architecture

```mermaid
graph TD
    Client["Client Browser (Next.js 14 App Router)"]

    subgraph AppServer ["Next.js 14 Full-Stack Frontend (:3000)"]
        Pages["App Router (/ , /docs, /stock/[symbol])"]
        Hooks["Market Stream & Session Hooks (useMarketStream)"]
        UI["Attention Desk & High-Density Watchlist"]
    end

    subgraph BackendAPI ["Fastify 4.x High-Throughput API (:3001)"]
        StreamRouter["SSE Distributor (/api/stream/ticks)"]
        DeltaEngine["Multi-Factor Anomaly Evaluator"]
        SessionStore["Hybrid Store (Prisma PG / In-Memory Map)"]
        BeaconReceiver["sendBeacon Custom text/plain Parser"]
    end
    
    subgraph IngestionPipeline ["3-Tier Resilient Ingest Engine"]
        YahooFeed["Tier 1: NSE Live Quotes (Yahoo Finance)"]
        RedisCache["Tier 2: Redis Stale Snapshot Cache"]
        MockGen["Tier 3: Synthetic Brownian Motion Generator"]
        CircuitBreaker{"Circuit Breaker Failover Guard"}
    end

    YahooFeed --> CircuitBreaker
    RedisCache -. Stale Fallback .-> CircuitBreaker
    MockGen -. Tertiary Failover .-> CircuitBreaker
    CircuitBreaker --> DeltaEngine

    Client -- "HTTP/2 SSE Tick Stream" --> StreamRouter
    Client -- "sendBeacon (Exit Snapshot)" --> BeaconReceiver
    Pages --> Hooks --> UI
    
    DeltaEngine <--> SessionStore
    StreamRouter -- "Real-time Delta Broadcasts" --> Hooks
```

---

# 💻 System Modules

## ⚡ Attention Desk

The dynamic executive deck at the top of the terminal. It filters out market noise and elevates only those assets whose multi-factor composite anomaly score crosses the activation threshold ($\ge 35$). Each card displays:
- Composite Anomaly Score badge (out of 100)
- Real-time price and delta since last session logout ($T_0$)
- Specific trigger rationale pills (e.g., `Delta: +4.2% since logout`, `Volume: 3.5x normal`, `VWAP Divergence > 1.5%`)
- Direct deep-dive navigation to the stock's audit trail.

## 📊 Watchlist Matrix & Multi-List Tabs

High-performance, tabular equity deck supporting multiple watchlists (*Tech & Heavyweights, Banking & Financials, Auto & Industrials*). Features:
- Real-time tick micro-animations (green/red flash) on every quote refresh
- Intraday SVG sparklines tracking rolling price trajectories
- Day range progress meters and 52-week high/low boundaries
- Watchlist management drawer to create, rename, and add custom NSE tickers.

## 🔬 Asset Deep-Dive (`/stock/[symbol]`)

Comprehensive single-stock diagnostic page containing:
- **Session Baseline Matrix:** Side-by-side audit of price, volume, VWAP, and spread between your logout time ($T_0$) and current market ($T_{\text{now}}$).
- **Continuous Financial Spline Canvas:** Catmull-Rom cubic Bézier curve tracing every intraday 5-minute price tick, real coordinate axes with dynamic Y-axis live price pill tracking, floating $T_0$ reference guideline, and subtle volume distribution histogram.
- **Threshold Audit Log:** Historical ledger of every anomaly trigger and rule firing recorded during your session.

## 🎛️ Quantitative Anomaly Playground (`/docs`)

An interactive mathematical sandbox where users and evaluators can adjust sliders to test the multi-factor scoring engine:
- Price Delta vs. Session Baseline ($\pm 6\%$)
- Volume Surge Multiplier ($0.2\times$ to $5.0\times$)
- Session Range Breaches (Day High / Day Low pierced)
- Intraday VWAP Divergence ($> 1.5\%$)
- Quick Scenario Presets: *Default (+2.4% Surge)*, *Institutional Squeeze (+4.2%)*, *Flash Breakdown (-3.8%)*, and *Quiet Session (0.4%)*.

## 🧪 Evaluator & Scenario Simulator (`?demo=evaluator`)

A purpose-built scenario testing drawer to stress-test PulseMark across diverse market conditions:
- **Session Time-Travel:** Simulate logging back into the terminal after 15 minutes, 1 hour, 4 hours, 1 day, or 3 days.
- **Volatility Injection:** Instantly shock any stock with artificial price moves ($\pm 4\%$) or aggressive volume bursts ($3.5\times$).
- **Network Chaos:** Toggle simulated exchange connection drops to verify that the 3-tier circuit breaker falls back to cached snapshots without throwing errors.

## 💾 Session Tracker & sendBeacon Lifecycle

Maintains session continuity across tab switches and browser destruction:
- Background 30-second heartbeat ping keeps session benchmarks synchronized.
- Window `visibilitychange` and `beforeunload` events trigger `navigator.sendBeacon` to transmit exit state in the background.
- Custom Fastify `text/plain` parser ensures zero-latency asynchronous JSON ingestion.

---

# 🛠 Tech Stack

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 14 (App Router, Server Components) | High-performance terminal UI and client routing |
| **Backend Engine** | Fastify 4.x (Node.js) | Low-overhead REST and Server-Sent Events (SSE) server |
| **Programming Language**| TypeScript 5.4 (Strict Mode) | End-to-end type safety across shared packages and apps |
| **Styling & Design** | Vanilla CSS + Tailwind CSS | Custom dark terminal design system (`#070A0F`), glassmorphism |
| **Motion & Animation** | Framer Motion & Lucide Icons | Fluid attention card promotions and interactive UI controls |
| **Streaming Protocol** | Server-Sent Events (SSE) via HTTP/2 | Low-latency, unidirectional market data distribution |
| **Database & ORM** | PostgreSQL + Prisma ORM | Persistent storage for users, watchlists, and session snapshots |
| **Caching & Failover** | Redis (IORedis) | Sub-millisecond tick buffering and stale snapshot circuit-breaker |
| **Market Data Feed** | Yahoo Finance 2 (NSE Equities) | Genuine live quote ingestion for Indian equities |
| **Monorepo Architecture**| NPM Workspaces | Modular codebase (`@pulsemark/shared`, `@pulsemark/api`, `@pulsemark/web`) |

---

# 🔌 Developer REST & SSE API Reference

All API routes are served under `/api` and feature automatic URL normalization.

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/stream/ticks` | `GET` (SSE) | Server-Sent Events endpoint streaming unified initial snapshots and real-time tick broadcasts. |
| `/api/health` | `GET` | System health check returning latency, feed provider status, and circuit breaker health. |
| `/api/watchlists` | `GET` / `POST` | Retrieve all watchlists or create a new custom watchlist. |
| `/api/watchlists/:id` | `PUT` / `DELETE` | Update watchlist name/description or delete a watchlist. |
| `/api/watchlists/:id/items` | `POST` | Add a new stock ticker to a watchlist (anchors benchmark price at $T_{\text{add}}$). |
| `/api/watchlists/:id/items/:symbol` | `DELETE` | Remove a stock ticker from a watchlist. |
| `/api/session/snapshot` | `GET` / `POST` | Retrieve current session benchmark or commit an exit snapshot ($T_0$) via `sendBeacon`. |
| `/api/session/heartbeat` | `POST` | 30-second heartbeat to update session liveness timestamp. |
| `/api/session/settings` | `GET` / `PUT` | Retrieve or update quantitative anomaly sensitivity thresholds. |
| `/api/stocks` | `GET` | List all supported NSE equities and current prices. |
| `/api/stocks/:symbol` | `GET` | Deep dive diagnostics for a single stock: $T_0$ delta, 40-candle history, and audit log. |
| `/api/chaos/inject-volatility` | `POST` | Force an artificial price shock ($\pm\%$) and volume multiplier for evaluator testing. |
| `/api/chaos/time-travel` | `POST` | Simulate historical login elapsed times (15m, 2h, 1d) against current market prices. |
| `/api/chaos/network` | `POST` | Simulate exchange disconnection and trigger circuit breaker fallback. |
| `/api/chaos/reset` | `POST` | Reset all chaos modifications and restore live exchange state. |

---

# 📸 Screenshots

## 🏠 Main Terminal Dashboard & Attention Desk

![Main Terminal Dashboard](assets/screenshots/dashboard_overview.png)

## 📊 High-Density Watchlist Matrix & 30M Trend Splines

![Watchlist Matrix](assets/screenshots/watchlist_matrix.png)

## 🔬 Single Asset Deep-Dive & Continuous Financial Spline Canvas

![Stock Deep Dive](assets/screenshots/stock_deep_dive.png)

## 🧪 Evaluator Chaos Studio & Session Time Travel

![Evaluator Studio](assets/screenshots/evaluator_studio.png)

## 🎛️ Quantitative Anomaly Heuristic Playground

![Heuristic Playground](assets/screenshots/heuristic_playground.png)

## 🏛️ Interactive Architecture & Pipeline Canvas

![Architecture Canvas](assets/screenshots/docs_architecture.png)

## 📡 Live Telemetry, Feed Source & SSE Heartbeat

![Footer Telemetry](assets/screenshots/footer_telemetry.png)

---

# 🚀 Getting Started

PulseMark boots with an **in-memory Map store by default**. No external database or Redis instance is required to run and test the complete application locally.

## 1. Clone the Repository

```bash
git clone https://github.com/Khushi1310-nayak/PulseMark.git
cd PulseMark
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Configure Environment Variables (Optional)

Create a `.env` file in the root directory (or copy from `.env.example`):

```env
# SERVER PORTS
PORT=3001
HOST=0.0.0.0
NEXT_PUBLIC_API_URL=http://localhost:3001

# DATABASE (OPTIONAL - Defaults to in-memory store if unset)
# DATABASE_URL="postgresql://user:password@localhost:5432/pulsemark"

# REDIS CACHE (OPTIONAL - Defaults to in-memory cache if unset)
# REDIS_URL="redis://localhost:6379"

# LOGGING
LOG_LEVEL=info
```

## 4. Build Monorepo Packages

```bash
npm run build
```

## 5. Run in Development Mode

Run the API server and Web frontend concurrently:

```bash
# Terminal 1: Start Fastify API (Port 3001)
npm run dev:api

# Terminal 2: Start Next.js Frontend (Port 3000)
npm run dev:web
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

# 🚢 Production Deployment

PulseMark is hardened for single-VM, Docker, or clustered deployments.

### Running with PM2 (Recommended for Production / VM)

```bash
npm install -g pm2
npm run build

# Start both API and Web servers via ecosystem config
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

### Running Directly with Node

```bash
# Terminal 1: Start Production API Server
npm run start:api

# Terminal 2: Start Production Web App
npm run start:web
```

### Reverse Proxy Configuration (Nginx)

When serving behind Nginx, disable response buffering for the SSE streaming route to ensure instant delivery of tick frames:

```nginx
location /api/stream/ {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Connection '';
    proxy_buffering off;
    proxy_cache off;
    chunked_transfer_encoding off;
}
```

---

# 🔮 Future Roadmap

- 📱 **Mobile Application Companion:** Native React Native/Expo app with lock-screen widgets for instant Attention Desk count.
- 🔔 **Multi-Channel Push Alerts:** WebPush, Telegram, and Discord webhooks when an equity triggers a Tier-1 anomaly score ($\ge 70$).
- 📈 **Options & Derivative Greeks Delta:** Incorporate Implied Volatility (IV) spikes and Open Interest (OI) buildup into the composite scoring formula.
- 🏢 **Direct Broker Execution:** One-click bracket order placement via Zerodha Kite, Groww, and Upstox API integration.

---

# 🤝 Contributing

Contributions are welcome! Fork the repository, create a feature branch, and submit a pull request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

# 📄 License

This project is licensed under the MIT License.

---

# 👩‍💻 Author

## **Manisa Nayak**

🎓 Student | Full-Stack Developer | AI Product Builder

Passionately building scalable full-stack applications, intelligent telemetry systems, and delightful developer experiences.

### Connect with Me

- **GitHub:** [@Khushi1310-nayak](https://github.com/Khushi1310-nayak)
- **LinkedIn:** [Manisa Nayak](https://www.linkedin.com/in/manisa-nayak-185bb5378/)

---

<div align="center">
<br/>

⭐ If you found PulseMark interesting or useful, please consider giving it a **Star** on GitHub!

</div>

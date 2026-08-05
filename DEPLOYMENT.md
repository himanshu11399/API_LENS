# APILens — Deployment Guide (Render + Vercel)

Follow these step-by-step instructions to deploy APILens Backend on **Render** (Node.js Web Service with full WebSocket support) and Frontend on **Vercel** or **Render**.

---

## 📋 Prerequisites

Before deploying, ensure you have:
1. A **GitHub** account with your APILens repository pushed (`https://github.com/himanshu11399/API_LENS.git`).
2. A **Render** account ([render.com](https://render.com)).
3. A **Vercel** account ([vercel.com](https://vercel.com)) for the Frontend (optional).
4. A free **MongoDB Atlas** database cluster ([mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)).
5. An **NVIDIA AI API Key** (from [build.nvidia.com](https://build.nvidia.com)) or OpenAI API Key.

---

## Step 1: Set Up MongoDB Atlas (Cloud Database)

1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free cluster.
2. Under **Database Access**, create a database user (e.g. `apilens_user` with a secure password).
3. Under **Network Access**, click **Add IP Address** -> Select **Allow Access from Anywhere (`0.0.0.0/0`)** so Render services can connect.
4. Click **Connect** -> Choose **Drivers** -> Copy your Connection String:
   ```env
   MONGODB_URI=mongodb+srv://apilens_user:<password>@cluster0.abcde.mongodb.net/apilens?retryWrites=true&w=majority
   ```

---

## Step 2: Deploy Backend API on Render (Web Service)

1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** -> Select **Web Service**.
3. Connect your GitHub repository (`API_LENS`).
4. Configure the Web Service settings:
   - **Name**: `apilens-backend`
   - **Region**: Select your preferred region (e.g., Oregon / Singapore / Frankfurt)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free` (or higher)

5. Scroll down to **Environment Variables** and add the following keys:

   | Variable Name | Example / Recommended Value |
   |---------------|-----------------------------|
   | `PORT` | `5000` |
   | `NODE_ENV` | `production` |
   | `MONGODB_URI` | `mongodb+srv://apilens_user:<password>@cluster0.abcde.mongodb.net/apilens?retryWrites=true&w=majority` |
   | `JWT_SECRET` | `your-random-jwt-access-secret-32-chars` |
   | `JWT_REFRESH_SECRET` | `your-random-jwt-refresh-secret-32-chars` |
   | `NVIDIA_API_KEY` | `nvapi-your-nvidia-api-key-here` |
   | `CORS_ORIGIN` | `*` (or your deployed frontend URL) |

6. Click **Create Web Service**.
7. Render will build and start your Node.js backend server. Once deployed, copy your **Render Service URL** (e.g. `https://apilens-backend.onrender.com`).
8. Test it by opening `https://apilens-backend.onrender.com/health` in your browser. You should see `{"status":"ok","message":"APILens Backend API is running"}`.

---

## Step 3: Deploy Frontend SPA to Vercel (or Render)

### Option A: Deploy Frontend to Vercel

1. Log in to the [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New...** -> **Project**.
2. Select your `API_LENS` repository.
3. Configure settings:
   - **Project Name**: `apilens`
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. In **Environment Variables**, add:

   | Variable Name | Value |
   |---------------|-------|
   | `VITE_API_URL` | `https://apilens-backend.onrender.com` *(Your Render backend URL from Step 2)* |

5. Click **Deploy**.

---

## Step 4: Update Backend CORS Settings (Optional Safety)

In your Render backend Web Service settings:
- Update `CORS_ORIGIN` from `*` to your deployed frontend domain (e.g. `https://apilens.vercel.app` or `https://apilens.onrender.com`).

---

## 🎉 Done!

Your APILens platform is now live:
- **Backend API**: `https://apilens-backend.onrender.com` (with full WebSocket real-time collaboration support)
- **Frontend SPA**: `https://apilens.vercel.app`
- **AI Assistant**: Operating live via NVIDIA NIM API on Render Node.js backend!

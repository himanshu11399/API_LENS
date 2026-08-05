# APILens — Vercel Deployment Guide

Follow these step-by-step instructions to deploy APILens (Frontend + Backend + Database) to Vercel.

---

## 📋 Prerequisites

Before deploying, ensure you have:
1. A **GitHub** account with your APILens repository pushed.
2. A **Vercel** account ([vercel.com](https://vercel.com)).
3. A free **MongoDB Atlas** database cluster ([mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)).
4. An **NVIDIA AI API Key** (from [build.nvidia.com](https://build.nvidia.com)) or OpenAI API Key.

---

## Step 1: Set Up MongoDB Atlas (Cloud Database)

1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free M0 Cluster.
2. Under **Database Access**, create a database user (e.g. username: `apilens_user`, password: `your_secure_password`).
3. Under **Network Access**, click **Add IP Address** -> Select **Allow Access from Anywhere (`0.0.0.0/0`)** so Vercel serverless functions can connect.
4. Click **Connect** -> Choose **Drivers** -> Copy your Connection String. It looks like:
   ```env
   mongodb+srv://apilens_user:<password>@cluster0.abcde.mongodb.net/apilens?retryWrites=true&w=majority
   ```

---

## Step 2: Deploy the Backend API to Vercel

1. Log in to the [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New...** -> **Project**.
2. Import your GitHub repository containing APILens.
3. In the project setup screen:
   - **Project Name**: `apilens-backend` (or your preferred name)
   - **Root Directory**: Select `backend`
   - **Framework Preset**: Select **Other**
4. Expand **Environment Variables** and add the following:

   | Variable Name | Example / Recommended Value |
   |---------------|-----------------------------|
   | `MONGODB_URI` | `mongodb+srv://apilens_user:<password>@cluster0.abcde.mongodb.net/apilens?retryWrites=true&w=majority` |
   | `JWT_SECRET` | `generate-a-random-secret-key-32-chars` |
   | `JWT_REFRESH_SECRET` | `generate-a-different-secret-key-32-chars` |
   | `NVIDIA_API_KEY` | `nvapi-your-nvidia-api-key-here` |
   | `CORS_ORIGIN` | `https://your-frontend-domain.vercel.app` (or `*`) |

5. Click **Deploy**.
6. Once deployed, copy your **Backend Deployment URL** (e.g. `https://apilens-backend.vercel.app`).
7. Test it by opening `https://apilens-backend.vercel.app/health` in your browser. You should see `{"status":"ok"}`.

---

## Step 3: Deploy the Frontend to Vercel

1. In the Vercel Dashboard, click **Add New...** -> **Project**.
2. Select your repository again.
3. In the project setup screen:
   - **Project Name**: `apilens`
   - **Root Directory**: Select `frontend`
   - **Framework Preset**: Select **Vite**
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Expand **Environment Variables** and add:

   | Variable Name | Value |
   |---------------|-------|
   | `VITE_API_URL` | `https://apilens-backend.vercel.app` *(Your deployed backend URL from Step 2)* |

5. Click **Deploy**.
6. Vercel will build and deploy your frontend. Once complete, click the deployment link (e.g., `https://apilens.vercel.app`).

---

## Step 4: Update Backend CORS Settings

1. Open your `apilens-backend` project settings in Vercel.
2. Under **Environment Variables**, set `CORS_ORIGIN` to your deployed frontend domain:
   ```env
   CORS_ORIGIN=https://apilens.vercel.app
   ```
3. Redeploy the backend if needed.

---

## 🎉 Done!

Your APILens platform is now live on Vercel:
- **Frontend SPA**: `https://apilens.vercel.app`
- **Backend API**: `https://apilens-backend.vercel.app`
- **AI Assistant**: Operating live via NVIDIA NIM API on Vercel Serverless Functions!

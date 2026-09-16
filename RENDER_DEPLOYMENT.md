# Deploying FileForge to Render

FileForge is pre-configured for seamless 1-click deployment on [Render](https://render.com) using a single free Web Service.

---

## Quick Deploy Steps

### 1. Log in to Render
- Go to [dashboard.render.com](https://dashboard.render.com) and log in with your GitHub account.

### 2. Create a New Web Service
1. Click **New +** in the top right corner and select **Web Service**.
2. Select **Build and deploy from a Git repository**.
3. Choose your repository: **`Captain-JackSparrow1674/FileForge`**.
4. Configure the settings:
   - **Name**: `fileforge` (or any name you prefer)
   - **Region**: Any (e.g. *Oregon* or *Frankfurt*)
   - **Branch**: `main`
   - **Root Directory**: *(leave blank)*
   - **Runtime**: **Node**
   - **Build Command**: `npm run build`
   - **Start Command**: `npm run start:prod`
   - **Instance Type**: **Free**
5. Click **Deploy Web Service**.

---

## That's It!
Render will automatically:
1. Run `npm run build` (installs backend & frontend dependencies, compiles the Vite React production bundle).
2. Run `npm run start:prod` (boots the Express server which serves both the API and the React client).
3. Provide you with a live HTTPS URL (e.g. `https://fileforge.onrender.com`).

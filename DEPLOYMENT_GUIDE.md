# QC Tool - Render Deployment Guide

This guide will help you deploy the QC Tool to Render.com.

## Prerequisites

- GitHub account with the QC Tool repository: https://github.com/eacdc/QC-Tool.git
- Render account (free tier available at https://render.com)

## Deployment Steps

### Method 1: Using Render Dashboard (Recommended)

1. **Login to Render**
   - Go to https://render.com
   - Sign in with your GitHub account

2. **Create New Static Site**
   - Click "New +" button in the top right
   - Select "Static Site"

3. **Connect Your Repository**
   - Select "Connect a repository"
   - Find and select `eacdc/QC-Tool` from your GitHub repositories
   - Click "Connect"

4. **Configure Your Static Site**
   - **Name**: `qc-tool` (or your preferred name)
   - **Branch**: `master`
   - **Build Command**: Leave empty or use `echo "No build required"`
   - **Publish Directory**: `.` (current directory)

5. **Deploy**
   - Click "Create Static Site"
   - Render will automatically deploy your application
   - Deployment typically takes 1-2 minutes

6. **Access Your Application**
   - Once deployed, you'll receive a URL like: `https://qc-tool.onrender.com`
   - Your application is now live!

### Method 2: Using render.yaml (Blueprint)

The repository includes a `render.yaml` file for automated deployment.

1. **Login to Render**
   - Go to https://render.com
   - Sign in with your GitHub account

2. **Create New Blueprint**
   - Click "New +" button
   - Select "Blueprint"
   - Connect your GitHub account if not already connected

3. **Select Repository**
   - Choose `eacdc/QC-Tool`
   - Render will automatically detect the `render.yaml` file

4. **Apply Blueprint**
   - Review the configuration
   - Click "Apply"
   - Render will create and deploy the static site automatically

## Configuration Files

### render.yaml
```yaml
services:
  - type: web
    name: qc-tool
    env: static
    buildCommand: echo "No build required"
    staticPublishPath: .
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
```

This configuration:
- Deploys as a static site
- No build process required (pure HTML/CSS/JS)
- Serves files from the root directory
- Rewrites all routes to index.html for client-side routing

## Post-Deployment

### Testing Your Deployment

1. Visit your Render URL (e.g., `https://qc-tool.onrender.com`)
2. You should see the QC Tool login page
3. Test login functionality with your credentials
4. Verify running processes display correctly

### Automatic Deployments

Render automatically redeploys when you push changes to GitHub:

```bash
# Make changes to your code
git add .
git commit -m "Update QC Tool"
git push origin master
```

Render will detect the push and automatically redeploy.

## Environment Configuration

The QC Tool uses the CDC API at: `https://cdcapi.onrender.com/api`

No environment variables are required as the API endpoint is hardcoded in the application.

## Custom Domain (Optional)

To use a custom domain:

1. Go to your Render dashboard
2. Select your QC Tool service
3. Navigate to "Settings" tab
4. Under "Custom Domain", click "Add Custom Domain"
5. Follow the instructions to configure DNS

## Troubleshooting

### Issue: 404 Errors on Page Refresh

**Solution**: The `render.yaml` includes route rewrites to handle this. If you still see 404s:
- Verify the `routes` section is in your `render.yaml`
- Redeploy the service

### Issue: API Connection Failed

**Possible causes**:
- Backend API is down
- CORS issues
- Network connectivity

**Solution**:
- Verify backend is running at `https://cdcapi.onrender.com/api`
- Check browser console for CORS errors
- Test API directly using curl or Postman

### Issue: Blank Page After Deployment

**Solution**:
- Check browser console for JavaScript errors
- Verify all files (index.html, script.js, styles.css) are committed
- Clear browser cache and refresh

## Performance Optimization

### Free Tier Considerations

- Render free tier spins down after 15 minutes of inactivity
- First request after spin-down may take 30-60 seconds
- Subsequent requests are fast

### Upgrade Options

For production use, consider:
- **Starter Plan** ($7/month): No spin-down, faster deployment
- **Standard Plan** ($25/month): More resources, priority support

## Monitoring

### View Logs

1. Go to Render dashboard
2. Select your QC Tool service
3. Click "Logs" tab
4. View real-time deployment and access logs

### View Metrics

1. Go to Render dashboard
2. Select your QC Tool service
3. Click "Metrics" tab
4. View bandwidth, requests, and performance metrics

## Security

### HTTPS

- All Render deployments use HTTPS by default
- SSL certificates are automatically provisioned and renewed

### API Security

- Authentication is handled through the backend API
- Session tokens are stored in localStorage
- Always use HTTPS URLs for API endpoints

## Support

For issues or questions:
- Render Documentation: https://render.com/docs
- Render Community: https://community.render.com
- GitHub Issues: https://github.com/eacdc/QC-Tool/issues

## Quick Reference

| Item | Value |
|------|-------|
| Repository | https://github.com/eacdc/QC-Tool.git |
| Branch | master |
| Build Command | `echo "No build required"` |
| Publish Directory | `.` |
| API Endpoint | https://cdcapi.onrender.com/api |
| Type | Static Site |

---

**Last Updated**: November 2025


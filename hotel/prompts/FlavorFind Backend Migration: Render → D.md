FlavorFind Backend Migration: Render → DigitalOcean
  
  Phase 1: Provision DigitalOcean Droplet
  
  1. Create a Droplet (Ubuntu 24.04 LTS, recommended: Basic $6/mo or $12/mo depending on traffic)
  2. Add your SSH public key during creation
  3. Note the Droplet's public IP
  4. Configure firewall (UFW): allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS), and your app port (e.g.
  3000/8000)
  
  ────────────────────────────────────────────────────────────────────────────────────────────────────────
  
  Phase 2: Initial Server Setup via SSH
  
  1. SSH into the Droplet as root
  2. Create a non-root deploy user with sudo privileges
  3. Install runtime dependencies (Node.js/Python/whatever the backend uses)
  4. Install Nginx as reverse proxy
  5. Install Certbot for SSL (Let's Encrypt)
  6. Clone the production branch from GitHub onto the server
  7. Install app dependencies, set up .env/environment variables
  8. Set up PM2 (or systemd) to run and auto-restart the app
  9. Configure Nginx to proxy requests to the app
  
  ────────────────────────────────────────────────────────────────────────────────────────────────────────
  
  Phase 3: Domain & DNS Configuration
  
  1. Buy domain (e.g. flavorfind.com)
  2. In your domain registrar's DNS settings, add:
    - A record: api.flavorfind.com → Droplet IP
    - (Optional) A record: www.flavorfind.com → frontend host
  
  3. Wait for DNS propagation (~5–30 min)
  4. Run Certbot to issue SSL cert for api.flavorfind.com
  5. Update Nginx config to serve HTTPS on api.flavorfind.com
  6. Update the frontend (index.html) to point API calls to https://api.flavorfind.com
  
  ────────────────────────────────────────────────────────────────────────────────────────────────────────
  
  Phase 4: Auto-Deploy from GitHub production Branch
  
  Two options — pick one:
  
  Option A: GitHub Actions (recommended)
  
  - Add a workflow that triggers on push to production
  - Workflow SSHs into the Droplet, pulls latest code, restarts the app
  - Store Droplet IP and SSH private key as GitHub Secrets
  
  Option B: Webhook + deploy script on server
  
  - Install a lightweight webhook listener on the Droplet
  - GitHub sends a POST to it on push to production
  - Server pulls and restarts automatically
  
  ────────────────────────────────────────────────────────────────────────────────────────────────────────
  
  Phase 5: Cutover & Cleanup
  
  1. Test https://api.flavorfind.com end-to-end
  2. Update frontend to use new API URL
  3. Verify all endpoints work
  4. Remove/suspend the Render service


-----BEGIN OPENSSH PRIVATE KEY-----
  b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
  QyNTUxOQAAACCLnANfq/miS8WOvLy9yMWD6i6YgEEveKgObVZja7nPIAAAAJhDIH2WQyB9
  lgAAAAtzc2gtZWQyNTUxOQAAACCLnANfq/miS8WOvLy9yMWD6i6YgEEveKgObVZja7nPIA
  AAAEBSkgz7aRxbSWn34dQlQzLqWW9VrOpSkDDHysXqT6dMf4ucA1+r+aJLxY68vL3IxYPq
  LpiAQS94qA5tVmNruc8gAAAAFWdpdGh1Yi1hY3Rpb25zLWRlcGxveQ==
  -----END OPENSSH PRIVATE KEY-----
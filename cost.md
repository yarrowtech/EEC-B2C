# EEC B2C Platform - Deployment Cost Analysis
## For 1000 Active Users (Monthly Estimates in INR)

---

## Tech Stack Overview

### Frontend
- **Framework**: React 19.x with Vite
- **Styling**: TailwindCSS 4.x
- **Key Features**: Real-time updates, PDF viewer, Rich text editor, Socket.io client
- **Current Deployment**: Vercel (as per CORS config)

### Backend
- **Runtime**: Node.js with Express 5.x
- **Real-time**: Socket.io for chat and notifications
- **Key Features**:
  - User Authentication (JWT + bcrypt)
  - RESTful APIs (40+ endpoints)
  - Rate limiting
  - File uploads
  - Push notifications
  - Auto-promotion scheduler
  - PDF generation

### Database & Services
- **Primary Database**: MongoDB (Mongoose ODM)
- **File Storage**: Cloudinary (images, videos, documents)
- **Payment Gateway**: Razorpay
- **Email Service**: Resend/Nodemailer
- **Push Notifications**: Web Push

### Application Features
- User management (students, teachers, admins)
- Exam/Quiz system with attempts tracking
- Study materials management
- Real-time global chat
- Subscription/Package system
- Daily challenges
- Gamification (points, levels, gift cards)
- AI-powered question generation
- Newsletter system
- Career applications portal

---

## Infrastructure Requirements Estimation

### Assumptions for 1000 Active Users:
- **Daily Active Users (DAU)**: ~400-500 users
- **Peak Concurrent Users**: ~100-150 users
- **Average Session Duration**: 30-45 minutes
- **API Requests**: ~50,000-75,000 requests/day
- **Real-time Connections**: ~50-80 concurrent Socket.io connections
- **Database Operations**: ~100,000 reads + 20,000 writes/day
- **Storage Growth**: ~5-10 GB/month (study materials, user uploads)
- **Bandwidth**: ~200-300 GB/month (includes static assets, API responses, real-time data)
- **Email Sending**: ~5,000-8,000 emails/month (notifications, newsletters)

---

## AWS (Amazon Web Services) Cost Breakdown

### 1. Compute (Backend + Real-time Services)
**Service**: EC2 or App Runner + Load Balancer

**Option A: EC2 Instance (Recommended for Socket.io)**
- **Instance Type**: t3.medium (2 vCPU, 4 GB RAM)
  - On-Demand: $0.0416/hour × 730 hours = $30.37/month
  - Reserved (1 year): ~$20/month (35% savings)
  - **In INR**: ₹2,528/month (on-demand) or ₹1,670/month (reserved)
- **Application Load Balancer**: $16.20/month base + $0.008/LCU-hour
  - Estimated: $25/month = ₹2,087/month
- **Data Transfer**: First 10 GB free, then $0.09/GB
  - ~100 GB/month = $9 = ₹751/month

**Total Compute**: ₹5,366/month (on-demand) or ₹4,508/month (reserved)

### 2. Frontend Hosting
**Service**: S3 + CloudFront CDN

- **S3 Storage**: ~2 GB @ $0.023/GB = ₹4/month
- **S3 Requests**: ~500K requests = $2 = ₹167/month
- **CloudFront**:
  - Data Transfer: 150 GB @ $0.085/GB = $12.75 = ₹1,064/month
  - Requests: 5M requests @ $0.0075/10K = $3.75 = ₹313/month
- **Route 53 DNS**: $0.50/hosted zone + queries = ₹60/month

**Total Frontend**: ₹1,608/month

### 3. Database
**Service**: MongoDB Atlas (AWS Region)

- **M10 Cluster** (2 GB RAM, 10 GB storage, backup)
  - Shared deployment = $0.08/hour × 730 = $57/month = ₹4,757/month
- **Storage (if exceeds 10 GB)**: $0.25/GB-month
  - Additional 10 GB = ₹208/month

**Total Database**: ₹4,965/month

### 4. File Storage
**Service**: Cloudinary (Same for both AWS/DO)

- **Free Tier**: 25 credits/month (~25 GB storage, 25 GB bandwidth)
- **Plus Plan**: $99/month for 1000 active users (recommended)
  - 87 credits (~87 GB storage, 87 GB bandwidth)
  - **In INR**: ₹8,262/month

**Alternative**: AWS S3 for file storage
- Storage: 50 GB @ $0.023/GB = $1.15 = ₹96/month
- Transfer: 100 GB @ $0.09/GB = $9 = ₹751/month
- Requests: 1M @ $0.005/1K = $5 = ₹417/month
- **Total**: ₹1,264/month (much cheaper than Cloudinary)

**Recommended**: Use S3 = ₹1,264/month

### 5. Email Service
**Service**: Resend or AWS SES

- **Resend**: $20/month for 50K emails = ₹1,670/month
- **AWS SES**: $0.10/1000 emails
  - 8,000 emails = $0.80 = ₹67/month

**Recommended**: AWS SES = ₹67/month

### 6. Payment Gateway
**Service**: Razorpay (Same for both platforms)

- **Transaction Fee**: 2% + GST per transaction
- Assuming ₹50,000 in monthly subscriptions
- **Fee**: ₹1,000 + ₹180 GST = ₹1,180/month

### 7. Monitoring & Logging
**Service**: CloudWatch

- **Logs**: 5 GB ingestion = $2.50 = ₹209/month
- **Metrics**: Basic monitoring (free)
- **Alarms**: 10 alarms × $0.10 = ₹8/month

**Total Monitoring**: ₹217/month

### 8. Backup & Security
- **EBS Snapshots**: 50 GB @ $0.05/GB = ₹209/month
- **WAF (Optional)**: $5 + $1/rule = ₹500/month (optional)
- **Certificate Manager (SSL)**: Free
- **Secrets Manager**: $0.40/secret × 10 = ₹334/month

**Total**: ₹543/month (without WAF)

### 9. Additional Services
- **ElastiCache Redis (Session storage)**: Optional
  - cache.t3.micro = $0.017/hour × 730 = ₹1,035/month
- **SNS (Push Notifications)**: $0.50/million + $2/100K mobile = ₹42/month

**Total Additional**: ₹1,077/month

---

## AWS Total Monthly Cost

| Component | Cost (INR) |
|-----------|------------|
| Compute (EC2 + ALB + Transfer) | ₹5,366 |
| Frontend (S3 + CloudFront) | ₹1,608 |
| Database (MongoDB Atlas M10) | ₹4,965 |
| File Storage (S3) | ₹1,264 |
| Email (SES) | ₹67 |
| Payment Gateway (Razorpay) | ₹1,180 |
| Monitoring (CloudWatch) | ₹217 |
| Backup & Security | ₹543 |
| Additional Services | ₹1,077 |
| **TOTAL** | **₹16,287/month** |

**Annual Cost**: ₹1,95,444 (~₹1.95 lakhs)

**With Reserved Instances**: ₹15,429/month or ₹1,85,148/year

**Per User Cost**: ₹16.29/month per active user

---

## Digital Ocean Cost Breakdown

### 1. Compute (Backend Application)
**Service**: App Platform or Droplet

**Option A: App Platform (PaaS - Easier)**
- **Professional Plan**: $12/month per container
  - Backend API: 1 container (2 GB RAM, 1 vCPU) = $12
  - Socket.io Service: 1 container (2 GB RAM) = $12
  - **Total**: $24 = ₹2,004/month

**Option B: Droplet (More Control)**
- **Basic Droplet**: 4 GB RAM, 2 vCPU, 80 GB SSD = $24/month
  - **In INR**: ₹2,004/month
- **Load Balancer**: $12/month = ₹1,002/month

**Recommended**: Droplet + Load Balancer = ₹3,006/month

### 2. Frontend Hosting
**Service**: Digital Ocean Spaces + CDN

- **Spaces Storage**: 250 GB included, 1 TB bandwidth
  - $5/month = ₹417/month
- **CDN**: Included in Spaces pricing
- **DNS**: Free with domain

**Total Frontend**: ₹417/month

### 3. Database
**Service**: Managed MongoDB or MongoDB Atlas

**Option A: MongoDB Atlas (DO Region)**
- Same as AWS: M10 = ₹4,757/month

**Option B: Self-hosted on Droplet**
- **Droplet**: 4 GB RAM, 2 vCPU = $24 = ₹2,004/month
- **Managed Database (PostgreSQL fallback)**:
  - 2 GB RAM, 1 vCPU, 25 GB = $15/month = ₹1,253/month
  - Note: DO doesn't offer managed MongoDB

**Recommended**: MongoDB Atlas M10 = ₹4,757/month
or Self-hosted Droplet = ₹2,004/month (requires maintenance)

### 4. File Storage
**Service**: Digital Ocean Spaces or Cloudinary

- **Spaces**: 250 GB storage, 1 TB bandwidth = $5 = ₹417/month
- **Cloudinary**: Same as AWS = ₹8,262/month

**Recommended**: DO Spaces = ₹417/month

### 5. Email Service
**Service**: Resend or External Provider

- **Resend**: $20/month = ₹1,670/month
- **SendGrid**: $14.95/month for 50K emails = ₹1,248/month
- **Mailgun**: Pay-as-you-go: $0.80/1000 emails = ₹67/month

**Recommended**: Mailgun = ₹67/month

### 6. Payment Gateway
**Service**: Razorpay

- Same as AWS: ₹1,180/month

### 7. Monitoring & Logging
**Service**: Built-in Monitoring + External Tools

- **DO Monitoring**: Free (basic)
- **Uptime Monitoring**: Free tier (UptimeRobot)
- **Logs**: $10/month for enhanced logging = ₹835/month

**Total Monitoring**: ₹835/month

### 8. Backup & Security
- **Droplet Backups**: 20% of droplet cost
  - $24 × 0.2 × 2 droplets = $9.60 = ₹801/month
- **Snapshots**: $0.05/GB-month for manual snapshots
  - 50 GB = ₹209/month
- **SSL Certificate**: Free (Let's Encrypt)
- **Firewall**: Free

**Total**: ₹1,010/month

### 9. Additional Services
- **Redis Cache**:
  - Self-hosted on existing droplet: ₹0 (included)
  - Or separate 1 GB droplet: $6 = ₹501/month
- **Object Storage (additional)**: Included in Spaces

**Total Additional**: ₹501/month (if separate Redis)

---

## Digital Ocean Total Monthly Cost

| Component | Cost (INR) |
|-----------|------------|
| Compute (Droplet + LB) | ₹3,006 |
| Frontend (Spaces + CDN) | ₹417 |
| Database (MongoDB Atlas M10) | ₹4,757 |
| File Storage (DO Spaces) | ₹417 |
| Email (Mailgun) | ₹67 |
| Payment Gateway (Razorpay) | ₹1,180 |
| Monitoring | ₹835 |
| Backup & Security | ₹1,010 |
| Additional (Redis) | ₹501 |
| **TOTAL** | **₹12,190/month** |

**Annual Cost**: ₹1,46,280 (~₹1.46 lakhs)

**Per User Cost**: ₹12.19/month per active user

---

## Alternative: Self-Hosted MongoDB on Digital Ocean

| Component | Cost (INR) |
|-----------|------------|
| Compute (Droplet + LB) | ₹3,006 |
| Frontend (Spaces + CDN) | ₹417 |
| Database (Self-hosted Droplet) | ₹2,004 |
| File Storage (DO Spaces) | ₹417 |
| Email (Mailgun) | ₹67 |
| Payment Gateway (Razorpay) | ₹1,180 |
| Monitoring | ₹835 |
| Backup & Security | ₹1,010 |
| Additional (Redis) | ₹0 |
| **TOTAL** | **₹8,936/month** |

**Annual Cost**: ₹1,07,232 (~₹1.07 lakhs)

**Per User Cost**: ₹8.94/month per active user

---

## Cost Comparison Summary

| Platform | Monthly Cost | Annual Cost | Per User/Month | Savings vs AWS |
|----------|--------------|-------------|----------------|----------------|
| **AWS (Optimized)** | ₹15,429 | ₹1,85,148 | ₹15.43 | Baseline |
| **Digital Ocean (Atlas DB)** | ₹12,190 | ₹1,46,280 | ₹12.19 | 21% cheaper |
| **Digital Ocean (Self-hosted DB)** | ₹8,936 | ₹1,07,232 | ₹8.94 | 42% cheaper |

---

## Recommendations

### Best Option for Starting (0-1000 users): Digital Ocean
**Monthly Cost**: ₹12,190

**Pros**:
- 21% cheaper than AWS
- Simpler pricing structure
- Easier to understand and manage
- Great for startups
- Predictable costs
- Good support
- All-in-one dashboard

**Cons**:
- Less scalability options compared to AWS
- Fewer advanced services
- Smaller global presence

### Configuration:
1. **App Droplet**: 4 GB RAM, 2 vCPU ($24/month)
2. **DB Droplet**: 4 GB RAM, 2 vCPU ($24/month) or MongoDB Atlas M10
3. **Load Balancer**: $12/month
4. **Spaces**: $5/month (250 GB + CDN)
5. **Monitoring**: Built-in free + $10/month for logs
6. **Backups**: Automated backups enabled

---

### Best Option for Scaling (1000+ users): AWS
**Monthly Cost**: ₹15,429 (with reserved instances)

**Pros**:
- Better scalability (auto-scaling, load balancing)
- More services (Lambda for background jobs, SQS for queues)
- Better global CDN (CloudFront)
- Advanced monitoring (CloudWatch)
- Better security options (WAF, Shield)
- Industry standard for enterprise

**Cons**:
- More complex pricing
- Steeper learning curve
- Higher base costs
- Can get expensive without optimization

### Configuration:
1. **EC2**: t3.medium with reserved instance
2. **MongoDB Atlas**: M10 cluster
3. **S3 + CloudFront**: For frontend and file storage
4. **SES**: For emails
5. **ElastiCache**: For session management
6. **CloudWatch**: For monitoring

---

## Cost Optimization Tips

### For Both Platforms:
1. **Use Self-hosted MongoDB** if you have DevOps expertise (saves ₹2,753/month)
2. **Implement Caching** to reduce database queries (Redis/Memcached)
3. **Optimize Images** before uploading to reduce storage and bandwidth
4. **Use CDN** effectively for static assets
5. **Implement Rate Limiting** to prevent abuse
6. **Monitor Usage** regularly and scale down unused resources
7. **Use Spot Instances/Preemptible VMs** for non-critical workloads
8. **Batch Email Sending** to reduce email service costs
9. **Implement Lazy Loading** for frontend to reduce bandwidth

### Specific to AWS:
1. Use **Reserved Instances** or **Savings Plans** (up to 72% savings)
2. Use **Lambda** for scheduled tasks instead of keeping EC2 running
3. Use **S3 Intelligent-Tiering** for file storage
4. Use **CloudFront Cache** aggressively
5. Enable **Cost Explorer** and set up billing alerts

### Specific to Digital Ocean:
1. Use **Referral Credits** (often $200 free credit)
2. Annual billing (10% discount on yearly plans)
3. Use **Spaces** instead of Cloudinary
4. Self-host services where possible
5. Use community tutorials and one-click apps

---

## Hidden Costs to Consider

1. **Development/DevOps Time**:
   - AWS: 10-15 hours/month = ₹15,000-20,000 (if outsourced)
   - DO: 5-8 hours/month = ₹7,500-12,000 (if outsourced)

2. **SSL Certificates**:
   - AWS: Free (ACM)
   - DO: Free (Let's Encrypt)

3. **Domain**: ₹1,000-2,000/year

4. **Data Transfer Overages**: Can add 10-20% to the bill

5. **Monitoring Tools**:
   - Free tier usually sufficient
   - Premium: ₹2,000-5,000/month (Datadog, New Relic)

6. **Security**:
   - WAF: ₹500-2,000/month
   - DDoS Protection: ₹1,000-5,000/month

7. **Support Plans**:
   - AWS: $29-$100/month (₹2,421-8,342)
   - DO: Email support free, ticket priority $50/month

---

## Scaling Costs (Projected)

### 5,000 Users:
- **AWS**: ₹45,000-55,000/month
- **Digital Ocean**: ₹30,000-40,000/month

### 10,000 Users:
- **AWS**: ₹85,000-1,10,000/month
- **Digital Ocean**: ₹60,000-80,000/month

### 50,000 Users:
- **AWS**: ₹3,50,000-4,50,000/month
- **Digital Ocean**: May need to migrate to AWS or multi-cloud setup

---

## Final Recommendation

### For Your Current Stage (1000 Users):
**Choose Digital Ocean with MongoDB Atlas**

**Total Monthly Cost**: ₹12,190 (~₹12,200)
**Annual Cost**: ₹1,46,280 (~₹1.46 lakhs)

**Rationale**:
1. 21% cheaper than AWS
2. Simpler to manage
3. Sufficient for current scale
4. Easy to understand billing
5. Good documentation and community
6. Can always migrate to AWS later

### When to Migrate to AWS:
- When you cross 5,000 active users
- When you need advanced features (machine learning, advanced analytics)
- When you need multi-region deployment
- When you have dedicated DevOps team
- When investors/clients prefer AWS

---

## Implementation Checklist

### Digital Ocean Setup:
- [ ] Create account (use referral for $200 credit)
- [ ] Set up 2 droplets (4 GB each) for app and database
- [ ] Configure load balancer
- [ ] Set up Spaces for file storage
- [ ] Configure MongoDB on droplet or Atlas
- [ ] Set up automatic backups
- [ ] Configure firewall rules
- [ ] Set up domain and SSL
- [ ] Configure monitoring and alerts
- [ ] Set up email service (Mailgun/SendGrid)
- [ ] Integrate Razorpay webhooks
- [ ] Test Socket.io real-time features
- [ ] Set up CI/CD pipeline
- [ ] Configure environment variables
- [ ] Test load and performance

### Cost Monitoring:
- [ ] Set up billing alerts
- [ ] Weekly cost review
- [ ] Monthly optimization review
- [ ] Quarterly scaling assessment

---

## Notes

- All prices are approximate and subject to change
- Exchange rate used: $1 = ₹83.50 (March 2026)
- Costs may vary based on actual usage patterns
- Always test in staging before production deployment
- Consider multi-month/annual billing for discounts
- Factor in data transfer costs for Indian users
- Consider using Mumbai/Bangalore region for lower latency

---

**Generated**: March 2026
**For**: EEC B2C Educational Platform
**Target**: 1000 Active Users
**Recommendation**: Start with Digital Ocean, migrate to AWS at 5K+ users

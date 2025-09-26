# 🔔 Personal Reminder & Notification System

A modern web application that integrates **n8n**, **Docker**, and **PostgreSQL** to create a powerful reminder system with automated email notifications.

## ✨ Features

- **📅 Schedule Reminders**: Create reminders with specific dates and times
- **📧 Email Notifications**: Automated email reminders powered by n8n workflows
- **⚡ Immediate Notifications**: Send instant notifications for urgent reminders
- **🎨 Modern UI**: Beautiful, responsive web interface
- **🗄️ Database Storage**: PostgreSQL for reliable data persistence
- **🔄 Real-time Updates**: Auto-refreshing reminder list
- **📱 Mobile Friendly**: Responsive design for all devices

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web App       │    │      n8n        │    │   PostgreSQL    │
│   (Express.js)  │◄──►│   Workflows     │◄──►│    Database     │
│   Port: 3000    │    │   Port: 5678    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Git

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd reminder-system
```

### 2. Configure Email Settings

1. Copy the environment file:
```bash
cp env.example .env
```

2. Edit `.env` and configure your email settings:
```bash
# For Gmail (recommended)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password  # Use App Password, not regular password
```

**Gmail Setup:**
- Enable 2-Factor Authentication
- Generate an App Password: Google Account → Security → App passwords
- Use the App Password in `SMTP_PASS`

### 3. Start the System

```bash
docker-compose up -d
```

This will start:
- **Web App**: http://localhost:3000
- **n8n Interface**: http://localhost:5678 (no login required)
- **PostgreSQL**: localhost:5432

### 4. Configure n8n Workflows

1. Open n8n at http://localhost:5678 (no login required)
2. Import the workflows from `n8n-workflows/` directory:
   - Import `email-reminder-workflow.json`
   - Import `immediate-notification-workflow.json`
4. Configure email credentials in n8n:
   - Go to Settings → Credentials
   - Add SMTP credentials
   - Update the email nodes in workflows

## 📖 Usage

### Creating Reminders

1. Open http://localhost:3000
2. Fill in the reminder form:
   - **Title**: Brief description of the reminder
   - **Email**: Where to send the notification
   - **Description**: Optional detailed description
   - **Reminder Time**: When to send the notification
3. Click "Create Reminder"

### Managing Reminders

- **View All**: See all your reminders in the dashboard
- **Send Now**: Send immediate notification for any reminder
- **Delete**: Remove reminders you no longer need
- **Status Tracking**: Monitor pending, triggered, and overdue reminders

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://reminder_user:reminder_password@postgres:5432/reminder_system` |
| `N8N_WEBHOOK_URL` | n8n webhook endpoint | `http://n8n:5678/webhook` |
| `WEBHOOK_BASE_URL` | Your app's webhook URL | `http://localhost:3000` |
| `PORT` | Web app port | `3000` |

### Database Schema

#### Reminders Table
- `id`: Primary key
- `title`: Reminder title
- `description`: Optional description
- `reminder_time`: When to send the reminder
- `email`: Recipient email
- `status`: pending/triggered/overdue
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

#### Notifications Table
- `id`: Primary key
- `reminder_id`: Foreign key to reminders
- `type`: email/webhook/push
- `status`: pending/sent/failed
- `sent_at`: When notification was sent
- `error_message`: Error details if failed

## 🛠️ Development

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Start PostgreSQL and n8n:
```bash
docker-compose up postgres n8n -d
```

3. Run the web app:
```bash
npm run dev
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/reminders` | Get all reminders |
| `POST` | `/api/reminders` | Create new reminder |
| `PUT` | `/api/reminders/:id/status` | Update reminder status |
| `DELETE` | `/api/reminders/:id` | Delete reminder |
| `POST` | `/api/reminders/:id/notify` | Send immediate notification |
| `POST` | `/api/reminders/:id/trigger` | Webhook for n8n triggers |

## 🔄 n8n Workflows

### Email Reminder Workflow
- **Trigger**: Webhook `/webhook/schedule-reminder`
- **Process**: Validates reminder time, sends email, triggers webhook
- **Features**: Time validation, error handling

### Immediate Notification Workflow
- **Trigger**: Webhook `/webhook/send-notification`
- **Process**: Sends urgent email notification immediately
- **Features**: Priority subject line, instant delivery

## 🐛 Troubleshooting

### Common Issues

1. **Email not sending**:
   - Check SMTP credentials in n8n
   - Verify email provider settings
   - Check firewall/network restrictions

2. **Database connection failed**:
   - Ensure PostgreSQL container is running
   - Check database credentials
   - Verify network connectivity

3. **n8n workflows not triggering**:
   - Check webhook URLs
   - Verify n8n is accessible
   - Check workflow activation status

### Logs

```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs webapp
docker-compose logs n8n
docker-compose logs postgres
```

## 📝 Customization

### Adding New Notification Types

1. Create new n8n workflow
2. Add webhook endpoint to `server.js`
3. Update database schema if needed
4. Add UI controls in `public/index.html`

### Styling Changes

Edit `public/index.html` CSS section or create separate CSS files.

### Database Modifications

Update `database/init.sql` and restart PostgreSQL container.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- [n8n](https://n8n.io/) for workflow automation
- [Express.js](https://expressjs.com/) for the web framework
- [PostgreSQL](https://www.postgresql.org/) for database
- [Docker](https://www.docker.com/) for containerization

---

**Happy Reminding! 🔔✨**

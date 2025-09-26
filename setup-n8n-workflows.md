# n8n Workflow Setup Guide

This guide will help you set up the n8n workflows for the Personal Reminder System.

## Prerequisites

- n8n running at http://localhost:5678
- No login required (user management disabled)

## Step 1: Access n8n

1. Open your browser and go to http://localhost:5678
2. No login required - you'll go directly to the n8n interface

## Step 2: Configure Email Credentials

Before importing workflows, you need to set up email credentials:

1. Click on **Settings** (gear icon) in the left sidebar
2. Go to **Credentials**
3. Click **Add Credential**
4. Search for **SMTP** and select it
5. Fill in your email details:

   **For Gmail:**
   - Host: `smtp.gmail.com`
   - Port: `587`
   - Username: `your-email@gmail.com`
   - Password: `your-app-password` (not your regular password!)
   - Security: `TLS`

   **For Outlook:**
   - Host: `smtp-mail.outlook.com`
   - Port: `587`
   - Username: `your-email@outlook.com`
   - Password: `your-password`
   - Security: `TLS`

6. Click **Save** and give it a name like "Email SMTP"

## Step 3: Import Workflows

### Import Email Reminder Workflow

1. Click **Workflows** in the left sidebar
2. Click **Import from File**
3. Select `n8n-workflows/email-reminder-workflow.json`
4. Click **Import**

### Import Immediate Notification Workflow

1. Repeat the import process
2. Select `n8n-workflows/immediate-notification-workflow.json`
3. Click **Import**

## Step 4: Configure Workflows

### Email Reminder Workflow

1. Open the "Email Reminder Workflow"
2. Click on the **Send Email** node
3. In the credentials dropdown, select your SMTP credential
4. Update the **From Email** field to match your email
5. Click **Save** and **Activate** the workflow

### Immediate Notification Workflow

1. Open the "Immediate Notification Workflow"
2. Click on the **Send Immediate Email** node
3. In the credentials dropdown, select your SMTP credential
4. Update the **From Email** field to match your email
5. Click **Save** and **Activate** the workflow

## Step 5: Test the Setup

1. Go to your web app at http://localhost:3000
2. Create a test reminder with your email address
3. Set the reminder time to 1 minute from now
4. Wait for the email notification

## Troubleshooting

### Workflows Not Triggering

1. Check that both workflows are **Active** (green toggle)
2. Verify webhook URLs in the webhook nodes
3. Check the n8n logs: `docker-compose logs n8n`

### Email Not Sending

1. Verify SMTP credentials are correct
2. Check if your email provider requires app passwords
3. Test the email node manually in n8n
4. Check firewall settings

### Webhook Errors

1. Ensure the web app is running
2. Check the webhook URLs in both workflows
3. Verify network connectivity between containers

## Advanced Configuration

### Custom Email Templates

You can customize the email content by editing the **Message** field in the email nodes:

```
Hello {{ $json.email }}!

This is a reminder for: {{ $json.title }}

Description: {{ $json.description || 'No description provided' }}

Reminder Time: {{ $json.reminder_time }}

Best regards,
Your Personal Reminder System
```

### Adding More Notification Types

1. Create a new workflow in n8n
2. Add a webhook trigger
3. Add notification logic (SMS, Slack, etc.)
4. Update the web app to call the new webhook

### Scheduling Options

The current setup uses immediate webhook triggers. For more advanced scheduling:

1. Use n8n's **Cron** node for recurring reminders
2. Implement **Wait** nodes for delayed execution
3. Use **Schedule Trigger** for specific times

## Security Notes

- Change the default n8n admin password
- Use environment variables for sensitive data
- Consider using n8n's built-in authentication
- Regularly update n8n to the latest version

## Support

If you encounter issues:

1. Check the n8n documentation: https://docs.n8n.io/
2. Review the workflow execution logs in n8n
3. Check Docker container logs
4. Verify all services are running properly

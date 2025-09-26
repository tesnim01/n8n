const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const axios = require('axios');
const cron = require('node-cron');
require('dotenv').config();

// Set timezone for Tunisia
process.env.TZ = 'Africa/Tunis';

const app = express();
const port = process.env.PORT || 3000;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://reminder_user:reminder_password@localhost:5432/reminder_system'
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes

// Get all reminders
app.get('/api/reminders', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, n.status as notification_status, n.sent_at
      FROM reminders r
      LEFT JOIN notifications n ON r.id = n.reminder_id
      ORDER BY r.reminder_time ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching reminders:', err);
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
});

// Create a new reminder
// Create a new reminder
app.post('/api/reminders', async (req, res) => {
  const { title, description, reminder_time, email } = req.body;

  // ✅ reminder_time already in UTC from frontend
  const utcTime = new Date(reminder_time);

  try {
    const result = await pool.query(
      'INSERT INTO reminders (title, description, reminder_time, email) VALUES ($1, $2, $3, $4) RETURNING *',
      [title, description, utcTime.toISOString(), email]
    );
    
    const reminder = result.rows[0];
    
    // Schedule the reminder with n8n
    await scheduleReminderWithN8N(reminder);
    
    res.status(201).json(reminder);
  } catch (err) {
    console.error('Error creating reminder:', err);
    res.status(500).json({ error: 'Failed to create reminder' });
  }
});


// Update reminder status
app.put('/api/reminders/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  try {
    const result = await pool.query(
      'UPDATE reminders SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating reminder:', err);
    res.status(500).json({ error: 'Failed to update reminder' });
  }
});

// Delete a reminder
app.delete('/api/reminders/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query('DELETE FROM reminders WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    
    res.json({ message: 'Reminder deleted successfully' });
  } catch (err) {
    console.error('Error deleting reminder:', err);
    res.status(500).json({ error: 'Failed to delete reminder' });
  }
});

// Send immediate notification
app.post('/api/reminders/:id/notify', async (req, res) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query('SELECT * FROM reminders WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reminder not found' });
    }
    
    const reminder = result.rows[0];
    await sendImmediateNotification(reminder);
    
    res.json({ message: 'Notification sent successfully' });
  } catch (err) {
    console.error('Error sending notification:', err);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// Function to schedule reminder with n8n
async function scheduleReminderWithN8N(reminder) {
  try {
    // Check if reminder is overdue
    const now = new Date();
    const reminderTime = new Date(reminder.reminder_time);
    
    if (reminderTime <= now) {
      // If overdue, send immediate notification instead
      console.log(`Reminder ${reminder.id} is overdue, sending immediate notification`);
      await sendImmediateNotification(reminder);
      
      // Update reminder status to overdue
      await pool.query(
        'UPDATE reminders SET status = $1 WHERE id = $2',
        ['overdue', reminder.id]
      );
      
      return;
    }
    
    const scheduleWebhookUrl = process.env.SCHEDULE_WEBHOOK_URL || `${process.env.N8N_WEBHOOK_BASE || 'http://n8n:5678/webhook'}/schedule-reminder`;
    
    const reminderData = {
      id: reminder.id,
      title: reminder.title,
      description: reminder.description,
      email: reminder.email,
      reminder_time: reminder.reminder_time,
      webhook_url: `${process.env.WEBHOOK_BASE_URL || 'http://localhost:3000'}/api/reminders/${reminder.id}/trigger`
    };
    
    console.log(`Attempting to schedule reminder ${reminder.id} with n8n at: ${scheduleWebhookUrl}`);
    console.log('Reminder data:', reminderData);
    
    const response = await axios.post(scheduleWebhookUrl, reminderData);
    console.log('n8n response:', response.data);
    
    // Log notification creation (upsert without relying on constraints)
    const updateScheduled = await pool.query(
      'UPDATE notifications SET status = $1 WHERE reminder_id = $2 AND type = $3',
      ['scheduled', reminder.id, 'email']
    );
    if (updateScheduled.rowCount === 0) {
      await pool.query(
        'INSERT INTO notifications (reminder_id, type, status) VALUES ($1, $2, $3)',
        [reminder.id, 'email', 'scheduled']
      );
    }
    
    console.log(`Reminder ${reminder.id} scheduled with n8n successfully`);
  } catch (error) {
    console.error('Error scheduling reminder with n8n:', error.message);
    if (error.response) {
      console.error('n8n response error:', error.response.data);
    }
  }
}

// Function to send immediate notification
async function sendImmediateNotification(reminder) {
  try {
    const immediateWebhookUrl = process.env.IMMEDIATE_WEBHOOK_URL || `${process.env.N8N_WEBHOOK_BASE || 'http://n8n:5678/webhook'}/send-notification`;
    
    const notificationData = {
      id: reminder.id,
      title: reminder.title,
      description: reminder.description,
      email: reminder.email,
      type: 'immediate'
    };
    
    await axios.post(immediateWebhookUrl, notificationData);
    
    // Update notification status (upsert without relying on constraints)
    const updateRes = await pool.query(
      'UPDATE notifications SET status = $1, sent_at = $2 WHERE reminder_id = $3 AND type = $4',
      ['sent', new Date(), reminder.id, 'email']
    );
    if (updateRes.rowCount === 0) {
      await pool.query(
        'INSERT INTO notifications (reminder_id, type, status, sent_at) VALUES ($1, $2, $3, $4)',
        [reminder.id, 'email', 'sent', new Date()]
      );
    }
    
    console.log(`Immediate notification sent for reminder ${reminder.id}`);
  } catch (error) {
    console.error('Error sending immediate notification:', error);
  }
}

// Webhook endpoint for n8n to trigger reminders
app.post('/api/reminders/:id/trigger', async (req, res) => {
  const { id } = req.params;
  
  try {
    // Update reminder status to triggered
    await pool.query(
      'UPDATE reminders SET status = $1 WHERE id = $2',
      ['triggered', id]
    );
    
    // Update notification status (upsert safety)
    const updated = await pool.query(
      'UPDATE notifications SET status = $1, sent_at = $2 WHERE reminder_id = $3 AND type = $4',
      ['sent', new Date(), id, 'email']
    );
    if (updated.rowCount === 0) {
      await pool.query(
        'INSERT INTO notifications (reminder_id, type, status, sent_at) VALUES ($1, $2, $3, $4)',
        [id, 'email', 'sent', new Date()]
      );
    }
    
    console.log(`Reminder ${id} triggered successfully`);
    res.json({ message: 'Reminder triggered successfully' });
  } catch (error) {
    console.error('Error triggering reminder:', error);
    res.status(500).json({ error: 'Failed to trigger reminder' });
  }
});

// Cron job to check for overdue reminders
// TEMP: run every minute to verify behavior. Change back to '*/5 * * * *' later.
cron.schedule('* * * * *', async () => {
  const startedAt = new Date();
  console.log(`[cron] Running overdue check at ${startedAt.toISOString()}`);
  try {
    const result = await pool.query(`
      SELECT * FROM reminders 
      WHERE status = 'pending' 
      AND reminder_time <= NOW()
      ORDER BY reminder_time ASC
    `);
    console.log(`[cron] Found ${result.rowCount} pending reminders overdue`);
    
    for (const reminder of result.rows) {
      console.log(`[cron] Sending overdue reminder ${reminder.id} scheduled at ${reminder.reminder_time}`);
      await sendImmediateNotification(reminder);
      await pool.query(
        'UPDATE reminders SET status = $1 WHERE id = $2',
        ['overdue', reminder.id]
      );
      console.log(`[cron] Marked reminder ${reminder.id} as overdue`);
    }
  } catch (error) {
    console.error('Error in cron job:', error);
  }
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.listen(port, () => {
  console.log(`Reminder system running on port ${port}`);
  console.log(`n8n webhook URL: ${process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook'}`);
});

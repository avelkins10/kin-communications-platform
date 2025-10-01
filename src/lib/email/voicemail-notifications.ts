import nodemailer from 'nodemailer';
import { db } from '@/lib/db';
import { VoicemailPriority } from '@/types';

// Email configuration
function createTransporter() {
  if (process.env.VOICEMAIL_EMAIL_ENABLED === 'false') {
    return null;
  }

  const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required SMTP environment variables: ${missingVars.join(', ')}`);
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const transporter = createTransporter();

export interface VoicemailNotificationData {
  voicemailId: string;
  recipientEmail: string;
  voicemail: {
    id: string;
    fromNumber: string;
    duration?: number | null;
    priority: VoicemailPriority;
    transcription?: string | null;
    createdAt: Date;
    contact?: {
      firstName: string;
      lastName: string;
      organization?: string | null;
    } | null;
  };
  assignedBy?: string;
  notes?: string;
}

export interface VoicemailAssignmentData {
  voicemailId: string;
  recipientEmail: string;
  assignedBy: string;
  notes?: string;
  voicemail: {
    id: string;
    fromNumber: string;
    duration?: number | null;
    priority: VoicemailPriority;
    transcription?: string | null;
    createdAt: Date;
    contact?: {
      firstName: string;
      lastName: string;
      organization?: string | null;
    } | null;
  };
}

export interface VoicemailTranscriptionData {
  voicemailId: string;
  recipientEmail: string;
  transcription: string;
  priority: VoicemailPriority;
  voicemail: {
    id: string;
    fromNumber: string;
    duration?: number | null;
    createdAt: Date;
    contact?: {
      firstName: string;
      lastName: string;
      organization?: string | null;
    } | null;
  };
}

export interface DailySummaryData {
  recipientEmail: string;
  userName: string;
  date: Date;
  stats: {
    total: number;
    unread: number;
    byPriority: Record<VoicemailPriority, number>;
  };
  recentVoicemails: Array<{
    id: string;
    fromNumber: string;
    duration?: number | null;
    priority: VoicemailPriority;
    transcription?: string | null;
    createdAt: Date;
    contact?: {
      firstName: string;
      lastName: string;
      organization?: string | null;
    } | null;
  }>;
}

// Helper function to format duration
function formatDuration(seconds?: number | null): string {
  if (!seconds) return 'Unknown';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Helper function to get priority color
function getPriorityColor(priority: VoicemailPriority): string {
  switch (priority) {
    case VoicemailPriority.URGENT:
      return '#dc2626'; // red-600
    case VoicemailPriority.HIGH:
      return '#ea580c'; // orange-600
    case VoicemailPriority.NORMAL:
      return '#2563eb'; // blue-600
    case VoicemailPriority.LOW:
      return '#16a34a'; // green-600
    default:
      return '#6b7280'; // gray-500
  }
}

// Helper function to get priority label
function getPriorityLabel(priority: VoicemailPriority): string {
  switch (priority) {
    case VoicemailPriority.URGENT:
      return 'URGENT';
    case VoicemailPriority.HIGH:
      return 'HIGH';
    case VoicemailPriority.NORMAL:
      return 'NORMAL';
    case VoicemailPriority.LOW:
      return 'LOW';
    default:
      return 'NORMAL';
  }
}

// Send new voicemail notification
export async function sendNewVoicemailNotification(data: VoicemailNotificationData): Promise<void> {
  if (!transporter) {
    console.log('Email notifications disabled, skipping voicemail notification');
    return;
  }

  const { voicemail, recipientEmail } = data;
  
  const callerName = voicemail.contact 
    ? `${voicemail.contact.firstName} ${voicemail.contact.lastName}`
    : voicemail.fromNumber;

  const subject = `New Voicemail from ${callerName} - ${getPriorityLabel(voicemail.priority)} Priority`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Voicemail</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .priority { display: inline-block; padding: 4px 8px; border-radius: 4px; color: white; font-weight: bold; }
        .content { background: white; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; }
        .transcription { background: #f8f9fa; padding: 15px; border-radius: 4px; margin: 15px 0; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 12px; color: #6c757d; }
        .button { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>New Voicemail Received</h2>
          <p><strong>From:</strong> ${callerName}</p>
          <p><strong>Phone:</strong> ${voicemail.fromNumber}</p>
          <p><strong>Duration:</strong> ${formatDuration(voicemail.duration)}</p>
          <p><strong>Priority:</strong> 
            <span class="priority" style="background-color: ${getPriorityColor(voicemail.priority)}">
              ${getPriorityLabel(voicemail.priority)}
            </span>
          </p>
          <p><strong>Received:</strong> ${voicemail.createdAt.toLocaleString()}</p>
        </div>
        
        <div class="content">
          ${voicemail.transcription ? `
            <h3>Transcription:</h3>
            <div class="transcription">${voicemail.transcription}</div>
          ` : '<p><em>Transcription not yet available</em></p>'}
          
          <a href="${process.env.NEXTAUTH_URL}/dashboard/queue" class="button">View in Dashboard</a>
        </div>
        
        <div class="footer">
          <p>This is an automated notification from KIN Communications Hub.</p>
          <p>Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
New Voicemail Received

From: ${callerName}
Phone: ${voicemail.fromNumber}
Duration: ${formatDuration(voicemail.duration)}
Priority: ${getPriorityLabel(voicemail.priority)}
Received: ${voicemail.createdAt.toLocaleString()}

${voicemail.transcription ? `Transcription:\n${voicemail.transcription}` : 'Transcription not yet available'}

View in Dashboard: ${process.env.NEXTAUTH_URL}/dashboard/queue
  `;

  await transporter.sendMail({
    from: process.env.VOICEMAIL_FROM_EMAIL || process.env.SMTP_USER,
    to: recipientEmail,
    subject,
    text,
    html,
  });
}

// Send voicemail assignment notification
export async function sendVoicemailAssignmentNotification(data: VoicemailAssignmentData): Promise<void> {
  if (!transporter) {
    console.log('Email notifications disabled, skipping assignment notification');
    return;
  }

  const { voicemail, recipientEmail, assignedBy, notes } = data;
  
  const callerName = voicemail.contact 
    ? `${voicemail.contact.firstName} ${voicemail.contact.lastName}`
    : voicemail.fromNumber;

  const subject = `Voicemail Assigned to You - ${getPriorityLabel(voicemail.priority)} Priority`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Voicemail Assignment</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .priority { display: inline-block; padding: 4px 8px; border-radius: 4px; color: white; font-weight: bold; }
        .content { background: white; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; }
        .transcription { background: #f8f9fa; padding: 15px; border-radius: 4px; margin: 15px 0; }
        .assignment { background: #e3f2fd; padding: 15px; border-radius: 4px; margin: 15px 0; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 12px; color: #6c757d; }
        .button { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Voicemail Assigned to You</h2>
          <p><strong>From:</strong> ${callerName}</p>
          <p><strong>Phone:</strong> ${voicemail.fromNumber}</p>
          <p><strong>Duration:</strong> ${formatDuration(voicemail.duration)}</p>
          <p><strong>Priority:</strong> 
            <span class="priority" style="background-color: ${getPriorityColor(voicemail.priority)}">
              ${getPriorityLabel(voicemail.priority)}
            </span>
          </p>
          <p><strong>Assigned by:</strong> ${assignedBy}</p>
          <p><strong>Received:</strong> ${voicemail.createdAt.toLocaleString()}</p>
        </div>
        
        <div class="content">
          ${notes ? `
            <div class="assignment">
              <h3>Assignment Notes:</h3>
              <p>${notes}</p>
            </div>
          ` : ''}
          
          ${voicemail.transcription ? `
            <h3>Transcription:</h3>
            <div class="transcription">${voicemail.transcription}</div>
          ` : '<p><em>Transcription not yet available</em></p>'}
          
          <a href="${process.env.NEXTAUTH_URL}/dashboard/queue" class="button">View in Dashboard</a>
        </div>
        
        <div class="footer">
          <p>This is an automated notification from KIN Communications Hub.</p>
          <p>Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: process.env.VOICEMAIL_FROM_EMAIL || process.env.SMTP_USER,
    to: recipientEmail,
    subject,
    html,
  });
}

// Send voicemail transcription notification
export async function sendVoicemailTranscriptionNotification(data: VoicemailTranscriptionData): Promise<void> {
  if (!transporter) {
    console.log('Email notifications disabled, skipping transcription notification');
    return;
  }

  const { voicemail, recipientEmail, transcription, priority } = data;
  
  const callerName = voicemail.contact 
    ? `${voicemail.contact.firstName} ${voicemail.contact.lastName}`
    : voicemail.fromNumber;

  const subject = `Voicemail Transcription Available - ${getPriorityLabel(priority)} Priority`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Voicemail Transcription</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .priority { display: inline-block; padding: 4px 8px; border-radius: 4px; color: white; font-weight: bold; }
        .content { background: white; padding: 20px; border: 1px solid #e9ecef; border-radius: 8px; }
        .transcription { background: #f8f9fa; padding: 15px; border-radius: 4px; margin: 15px 0; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 12px; color: #6c757d; }
        .button { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Voicemail Transcription Available</h2>
          <p><strong>From:</strong> ${callerName}</p>
          <p><strong>Phone:</strong> ${voicemail.fromNumber}</p>
          <p><strong>Duration:</strong> ${formatDuration(voicemail.duration)}</p>
          <p><strong>Priority:</strong> 
            <span class="priority" style="background-color: ${getPriorityColor(priority)}">
              ${getPriorityLabel(priority)}
            </span>
          </p>
          <p><strong>Received:</strong> ${voicemail.createdAt.toLocaleString()}</p>
        </div>
        
        <div class="content">
          <h3>Transcription:</h3>
          <div class="transcription">${transcription}</div>
          
          <a href="${process.env.NEXTAUTH_URL}/dashboard/queue" class="button">View in Dashboard</a>
        </div>
        
        <div class="footer">
          <p>This is an automated notification from KIN Communications Hub.</p>
          <p>Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: process.env.VOICEMAIL_FROM_EMAIL || process.env.SMTP_USER,
    to: recipientEmail,
    subject,
    html,
  });
}

// Send daily voicemail summary
export async function sendDailyVoicemailSummary(data: DailySummaryData): Promise<void> {
  if (!transporter) {
    console.log('Email notifications disabled, skipping daily summary');
    return;
  }

  const { recipientEmail, userName, date, stats, recentVoicemails } = data;

  const subject = `Daily Voicemail Summary - ${date.toLocaleDateString()}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Daily Voicemail Summary</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0; }
        .stat-card { background: white; padding: 15px; border: 1px solid #e9ecef; border-radius: 8px; text-align: center; }
        .stat-number { font-size: 24px; font-weight: bold; color: #007bff; }
        .stat-label { font-size: 12px; color: #6c757d; text-transform: uppercase; }
        .priority { display: inline-block; padding: 2px 6px; border-radius: 3px; color: white; font-size: 10px; font-weight: bold; }
        .voicemail-item { background: white; padding: 15px; border: 1px solid #e9ecef; border-radius: 8px; margin: 10px 0; }
        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e9ecef; font-size: 12px; color: #6c757d; }
        .button { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Daily Voicemail Summary</h2>
          <p><strong>Date:</strong> ${date.toLocaleDateString()}</p>
          <p><strong>User:</strong> ${userName}</p>
        </div>
        
        <div class="stats">
          <div class="stat-card">
            <div class="stat-number">${stats.total}</div>
            <div class="stat-label">Total Voicemails</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${stats.unread}</div>
            <div class="stat-label">Unread</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${stats.byPriority.URGENT}</div>
            <div class="stat-label">Urgent</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">${stats.byPriority.HIGH}</div>
            <div class="stat-label">High Priority</div>
          </div>
        </div>
        
        ${recentVoicemails.length > 0 ? `
          <h3>Recent Voicemails:</h3>
          ${recentVoicemails.map(voicemail => {
            const callerName = voicemail.contact 
              ? `${voicemail.contact.firstName} ${voicemail.contact.lastName}`
              : voicemail.fromNumber;
            
            return `
              <div class="voicemail-item">
                <p><strong>${callerName}</strong> (${voicemail.fromNumber})</p>
                <p>Duration: ${formatDuration(voicemail.duration)} | 
                   Priority: <span class="priority" style="background-color: ${getPriorityColor(voicemail.priority)}">${getPriorityLabel(voicemail.priority)}</span> | 
                   ${voicemail.createdAt.toLocaleString()}</p>
                ${voicemail.transcription ? `<p><em>"${voicemail.transcription.substring(0, 100)}${voicemail.transcription.length > 100 ? '...' : ''}"</em></p>` : ''}
              </div>
            `;
          }).join('')}
        ` : '<p>No voicemails received today.</p>'}
        
        <a href="${process.env.NEXTAUTH_URL}/dashboard/queue" class="button">View All Voicemails</a>
        
        <div class="footer">
          <p>This is an automated daily summary from KIN Communications Hub.</p>
          <p>Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: process.env.VOICEMAIL_FROM_EMAIL || process.env.SMTP_USER,
    to: recipientEmail,
    subject,
    html,
  });
}

// Helper function to send voicemail notification by ID
export async function sendNewVoicemailNotificationById(voicemailId: string): Promise<void> {
  const voicemail = await db.voicemail.findUnique({
    where: { id: voicemailId },
    include: {
      contact: true,
      assignedTo: true,
    },
  });

  if (!voicemail || !voicemail.assignedTo) {
    throw new Error('Voicemail or assigned user not found');
  }

  await sendNewVoicemailNotification({
    voicemailId: voicemail.id,
    recipientEmail: voicemail.assignedTo.email,
    voicemail: {
      id: voicemail.id,
      fromNumber: voicemail.fromNumber,
      duration: voicemail.duration,
      priority: voicemail.priority,
      transcription: voicemail.transcription,
      createdAt: voicemail.createdAt,
      contact: voicemail.contact,
    },
  });
}

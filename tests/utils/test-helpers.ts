// KIN Communications Platform - Test Helpers
// Utility functions for comprehensive end-to-end testing

import { Page, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

// Test configuration
export const TEST_CONFIG = {
  baseUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  testUsers: {
    admin: {
      email: 'qa-admin@example.com',
      password: 'password123',
      role: 'admin'
    },
    agent: {
      email: 'qa-agent@example.com',
      password: 'password123',
      role: 'agent'
    },
    supervisor: {
      email: 'qa-supervisor@example.com',
      password: 'password123',
      role: 'supervisor'
    }
  },
  testContacts: {
    customer: {
      name: 'Test Customer 1',
      phone: '+15552222222',
      email: 'customer1@example.com',
      company: 'Test Company 1'
    },
    vipCustomer: {
      name: 'VIP Customer',
      phone: '+15554444444',
      email: 'vip@example.com',
      company: 'VIP Company'
    }
  },
  testPhoneNumbers: {
    main: '+15551234567',
    support: '+15559876543',
    sales: '+15551111111'
  },
  timeouts: {
    short: 5000,
    medium: 15000,
    long: 30000,
    veryLong: 60000
  }
};

// Database helper
export class DatabaseHelper {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async cleanup() {
    await this.prisma.$disconnect();
  }

  async createTestUser(userData: any) {
    return await this.prisma.user.upsert({
      where: { email: userData.email },
      update: userData,
      create: userData
    });
  }

  async createTestContact(contactData: any) {
    return await this.prisma.contact.upsert({
      where: { phone: contactData.phone },
      update: contactData,
      create: contactData
    });
  }

  async createTestCall(callData: any) {
    return await this.prisma.call.upsert({
      where: { sid: callData.sid },
      update: callData,
      create: callData
    });
  }

  async createTestMessage(messageData: any) {
    return await this.prisma.message.upsert({
      where: { sid: messageData.sid },
      update: messageData,
      create: messageData
    });
  }

  async createTestVoicemail(voicemailData: any) {
    return await this.prisma.voicemail.upsert({
      where: { sid: voicemailData.sid },
      update: voicemailData,
      create: voicemailData
    });
  }

  async getTestData() {
    return {
      users: await this.prisma.user.findMany(),
      contacts: await this.prisma.contact.findMany(),
      calls: await this.prisma.call.findMany(),
      messages: await this.prisma.message.findMany(),
      voicemails: await this.prisma.voicemail.findMany()
    };
  }
}

// Authentication helper
export class AuthHelper {
  static async loginAs(page: Page, userType: 'admin' | 'agent' | 'supervisor') {
    const user = TEST_CONFIG.testUsers[userType];
    
    await page.goto(`${TEST_CONFIG.baseUrl}/auth/signin`);
    await page.fill('input[name="email"]', user.email);
    await page.fill('input[name="password"]', user.password);
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL(`${TEST_CONFIG.baseUrl}/dashboard`);
    
    // Verify user is logged in
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  }

  static async logout(page: Page) {
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    await page.waitForURL(`${TEST_CONFIG.baseUrl}/auth/signin`);
  }
}

// Voice calling helper
export class VoiceCallHelper {
  static async initiateCall(page: Page, phoneNumber: string) {
    await page.click('[data-testid="call-button"]');
    await page.fill('[data-testid="phone-input"]', phoneNumber);
    await page.click('[data-testid="call-initiate-button"]');
    
    // Wait for call to be initiated
    await page.waitForSelector('[data-testid="call-controls"]', { timeout: 10000 });
  }

  static async endCall(page: Page) {
    await page.click('[data-testid="end-call-button"]');
    await page.waitForSelector('[data-testid="call-ended"]', { timeout: 10000 });
  }

  static async muteCall(page: Page) {
    await page.click('[data-testid="mute-button"]');
    await expect(page.locator('[data-testid="mute-button"]')).toHaveClass(/muted/);
  }

  static async unmuteCall(page: Page) {
    await page.click('[data-testid="mute-button"]');
    await expect(page.locator('[data-testid="mute-button"]')).not.toHaveClass(/muted/);
  }

  static async holdCall(page: Page) {
    await page.click('[data-testid="hold-button"]');
    await expect(page.locator('[data-testid="hold-button"]')).toHaveClass(/on-hold/);
  }

  static async unholdCall(page: Page) {
    await page.click('[data-testid="hold-button"]');
    await expect(page.locator('[data-testid="hold-button"]')).not.toHaveClass(/on-hold/);
  }
}

// SMS messaging helper
export class SMSHelper {
  static async sendMessage(page: Page, phoneNumber: string, message: string) {
    await page.click('[data-testid="sms-button"]');
    await page.fill('[data-testid="phone-input"]', phoneNumber);
    await page.fill('[data-testid="message-input"]', message);
    await page.click('[data-testid="send-message-button"]');
    
    // Wait for message to be sent
    await page.waitForSelector('[data-testid="message-sent"]', { timeout: 10000 });
  }

  static async replyToMessage(page: Page, message: string) {
    await page.fill('[data-testid="reply-input"]', message);
    await page.click('[data-testid="reply-button"]');
    
    // Wait for reply to be sent
    await page.waitForSelector('[data-testid="reply-sent"]', { timeout: 10000 });
  }

  static async useTemplate(page: Page, templateName: string) {
    await page.click('[data-testid="template-button"]');
    await page.click(`[data-testid="template-${templateName}"]`);
    
    // Wait for template to be applied
    await page.waitForSelector('[data-testid="template-applied"]', { timeout: 5000 });
  }
}

// Voicemail helper
export class VoicemailHelper {
  static async playVoicemail(page: Page, voicemailId: string) {
    await page.click(`[data-testid="voicemail-${voicemailId}"]`);
    await page.click('[data-testid="play-button"]');
    
    // Wait for voicemail to start playing
    await page.waitForSelector('[data-testid="voicemail-playing"]', { timeout: 5000 });
  }

  static async pauseVoicemail(page: Page) {
    await page.click('[data-testid="pause-button"]');
    await page.waitForSelector('[data-testid="voicemail-paused"]', { timeout: 5000 });
  }

  static async markAsRead(page: Page, voicemailId: string) {
    await page.click(`[data-testid="voicemail-${voicemailId}"]`);
    await page.click('[data-testid="mark-read-button"]');
    
    // Wait for voicemail to be marked as read
    await page.waitForSelector('[data-testid="voicemail-read"]', { timeout: 5000 });
  }

  static async assignVoicemail(page: Page, voicemailId: string, assignee: string) {
    await page.click(`[data-testid="voicemail-${voicemailId}"]`);
    await page.click('[data-testid="assign-button"]');
    await page.selectOption('[data-testid="assignee-select"]', assignee);
    await page.click('[data-testid="assign-confirm-button"]');
    
    // Wait for voicemail to be assigned
    await page.waitForSelector('[data-testid="voicemail-assigned"]', { timeout: 5000 });
  }
}

// Quickbase helper
export class QuickbaseHelper {
  static async searchCustomer(page: Page, searchTerm: string) {
    await page.fill('[data-testid="customer-search"]', searchTerm);
    await page.click('[data-testid="search-button"]');
    
    // Wait for search results
    await page.waitForSelector('[data-testid="search-results"]', { timeout: 10000 });
  }

  static async selectCustomer(page: Page, customerId: string) {
    await page.click(`[data-testid="customer-${customerId}"]`);
    
    // Wait for customer details to load
    await page.waitForSelector('[data-testid="customer-details"]', { timeout: 10000 });
  }

  static async logActivity(page: Page, activityType: string, description: string) {
    await page.click('[data-testid="log-activity-button"]');
    await page.selectOption('[data-testid="activity-type"]', activityType);
    await page.fill('[data-testid="activity-description"]', description);
    await page.click('[data-testid="save-activity-button"]');
    
    // Wait for activity to be logged
    await page.waitForSelector('[data-testid="activity-logged"]', { timeout: 5000 });
  }
}

// TaskRouter helper
export class TaskRouterHelper {
  static async createTask(page: Page, taskData: any) {
    await page.click('[data-testid="create-task-button"]');
    await page.fill('[data-testid="task-name"]', taskData.name);
    await page.fill('[data-testid="task-description"]', taskData.description);
    await page.selectOption('[data-testid="task-priority"]', taskData.priority);
    await page.click('[data-testid="create-task-confirm-button"]');
    
    // Wait for task to be created
    await page.waitForSelector('[data-testid="task-created"]', { timeout: 10000 });
  }

  static async assignTask(page: Page, taskId: string, workerId: string) {
    await page.click(`[data-testid="task-${taskId}"]`);
    await page.click('[data-testid="assign-task-button"]');
    await page.selectOption('[data-testid="worker-select"]', workerId);
    await page.click('[data-testid="assign-confirm-button"]');
    
    // Wait for task to be assigned
    await page.waitForSelector('[data-testid="task-assigned"]', { timeout: 10000 });
  }

  static async updateTaskStatus(page: Page, taskId: string, status: string) {
    await page.click(`[data-testid="task-${taskId}"]`);
    await page.selectOption('[data-testid="task-status"]', status);
    await page.click('[data-testid="update-status-button"]');
    
    // Wait for status to be updated
    await page.waitForSelector('[data-testid="status-updated"]', { timeout: 5000 });
  }
}

// Admin panel helper
export class AdminHelper {
  static async navigateToUsers(page: Page) {
    await page.click('[data-testid="admin-menu"]');
    await page.click('[data-testid="users-menu"]');
    await page.waitForURL(`${TEST_CONFIG.baseUrl}/admin/users`);
  }

  static async createUser(page: Page, userData: any) {
    await page.click('[data-testid="create-user-button"]');
    await page.fill('[data-testid="user-name"]', userData.name);
    await page.fill('[data-testid="user-email"]', userData.email);
    await page.selectOption('[data-testid="user-role"]', userData.role);
    await page.click('[data-testid="create-user-confirm-button"]');
    
    // Wait for user to be created
    await page.waitForSelector('[data-testid="user-created"]', { timeout: 10000 });
  }

  static async configurePhoneNumber(page: Page, phoneNumber: string, configuration: any) {
    await page.click('[data-testid="phone-numbers-menu"]');
    await page.click(`[data-testid="phone-${phoneNumber}"]`);
    await page.fill('[data-testid="friendly-name"]', configuration.friendlyName);
    await page.selectOption('[data-testid="phone-type"]', configuration.type);
    await page.click('[data-testid="save-configuration-button"]');
    
    // Wait for configuration to be saved
    await page.waitForSelector('[data-testid="configuration-saved"]', { timeout: 5000 });
  }
}

// Real-time features helper
export class RealtimeHelper {
  static async waitForSocketConnection(page: Page) {
    await page.waitForFunction(() => {
      return window.socket && window.socket.connected;
    }, { timeout: 10000 });
  }

  static async waitForQueueUpdate(page: Page) {
    await page.waitForSelector('[data-testid="queue-updated"]', { timeout: 10000 });
  }

  static async waitForPresenceUpdate(page: Page, userId: string) {
    await page.waitForSelector(`[data-testid="presence-${userId}"]`, { timeout: 10000 });
  }

  static async waitForCallStatusUpdate(page: Page, callId: string, status: string) {
    await page.waitForSelector(`[data-testid="call-${callId}-${status}"]`, { timeout: 10000 });
  }
}

// Performance testing helper
export class PerformanceHelper {
  static async measurePageLoadTime(page: Page, url: string) {
    const startTime = Date.now();
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    const endTime = Date.now();
    return endTime - startTime;
  }

  static async measureApiResponseTime(page: Page, endpoint: string) {
    const startTime = Date.now();
    await page.request.get(endpoint);
    const endTime = Date.now();
    return endTime - startTime;
  }

  static async waitForConcurrentUsers(page: Page, userCount: number) {
    await page.waitForFunction((count) => {
      return window.concurrentUsers >= count;
    }, userCount, { timeout: 30000 });
  }
}

// Security testing helper
export class SecurityHelper {
  static async testWebhookSignature(page: Page, webhookUrl: string, payload: any) {
    const response = await page.request.post(webhookUrl, {
      data: payload,
      headers: {
        'X-Twilio-Signature': 'test-signature'
      }
    });
    return response;
  }

  static async testRateLimiting(page: Page, endpoint: string, requestCount: number) {
    const responses = [];
    for (let i = 0; i < requestCount; i++) {
      const response = await page.request.get(endpoint);
      responses.push(response);
    }
    return responses;
  }

  static async testUnauthorizedAccess(page: Page, protectedUrl: string) {
    const response = await page.request.get(protectedUrl);
    return response;
  }
}

// Cross-browser testing helper
export class CrossBrowserHelper {
  static async testWebRTCSupport(page: Page) {
    const webRTCSupported = await page.evaluate(() => {
      return !!(window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection);
    });
    return webRTCSupported;
  }

  static async testSocketIOSupport(page: Page) {
    const socketIOSupported = await page.evaluate(() => {
      return typeof window.io !== 'undefined';
    });
    return socketIOSupported;
  }

  static async testLocalStorageSupport(page: Page) {
    const localStorageSupported = await page.evaluate(() => {
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return true;
      } catch (e) {
        return false;
      }
    });
    return localStorageSupported;
  }
}

// Mobile testing helper
export class MobileHelper {
  static async testTouchInteractions(page: Page) {
    // Test tap
    await page.tap('[data-testid="test-button"]');
    
    // Test swipe
    await page.touchscreen.tap(100, 100);
    await page.touchscreen.tap(200, 200);
    
    // Test pinch
    await page.touchscreen.tap(100, 100);
    await page.touchscreen.tap(200, 200);
  }

  static async testResponsiveLayout(page: Page, viewport: { width: number; height: number }) {
    await page.setViewportSize(viewport);
    await page.waitForLoadState('networkidle');
    
    // Check if layout is responsive
    const isResponsive = await page.evaluate(() => {
      return window.innerWidth <= 768;
    });
    
    return isResponsive;
  }

  static async testMobileNavigation(page: Page) {
    // Test hamburger menu
    await page.click('[data-testid="mobile-menu-button"]');
    await page.waitForSelector('[data-testid="mobile-menu"]', { timeout: 5000 });
    
    // Test menu items
    await page.click('[data-testid="mobile-menu-item-1"]');
    await page.waitForURL(`${TEST_CONFIG.baseUrl}/dashboard`);
    
    // Close menu
    await page.click('[data-testid="mobile-menu-close"]');
    await page.waitForSelector('[data-testid="mobile-menu"]', { state: 'hidden' });
  }
}

// Utility functions
export const TestUtils = {
  async waitForElement(page: Page, selector: string, timeout: number = 10000) {
    await page.waitForSelector(selector, { timeout });
  },

  async waitForText(page: Page, text: string, timeout: number = 10000) {
    await page.waitForSelector(`text=${text}`, { timeout });
  },

  async waitForUrl(page: Page, url: string, timeout: number = 10000) {
    await page.waitForURL(url, { timeout });
  },

  async takeScreenshot(page: Page, name: string) {
    await page.screenshot({ path: `tests/screenshots/${name}.png` });
  },

  async generateTestData(type: string, count: number = 1) {
    const data = [];
    for (let i = 0; i < count; i++) {
      switch (type) {
        case 'user':
          data.push({
            name: `Test User ${i + 1}`,
            email: `testuser${i + 1}@example.com`,
            password: 'password123',
            role: 'agent'
          });
          break;
        case 'contact':
          data.push({
            name: `Test Contact ${i + 1}`,
            phone: `+1555${String(i + 1).padStart(7, '0')}`,
            email: `contact${i + 1}@example.com`,
            company: `Test Company ${i + 1}`
          });
          break;
        case 'call':
          data.push({
            sid: `CA_test_call_${i + 1}`,
            from: `+1555${String(i + 1).padStart(7, '0')}`,
            to: TEST_CONFIG.testPhoneNumbers.main,
            status: 'completed',
            direction: 'inbound',
            duration: Math.floor(Math.random() * 300) + 60
          });
          break;
        case 'message':
          data.push({
            sid: `SM_test_message_${i + 1}`,
            from: `+1555${String(i + 1).padStart(7, '0')}`,
            to: TEST_CONFIG.testPhoneNumbers.main,
            body: `Test message ${i + 1}`,
            status: 'delivered',
            direction: 'inbound'
          });
          break;
        case 'voicemail':
          data.push({
            sid: `VM_test_voicemail_${i + 1}`,
            from: `+1555${String(i + 1).padStart(7, '0')}`,
            to: TEST_CONFIG.testPhoneNumbers.main,
            transcription: `Test voicemail transcription ${i + 1}`,
            duration: Math.floor(Math.random() * 120) + 30,
            status: 'unread'
          });
          break;
      }
    }
    return data;
  }
};

export default {
  TEST_CONFIG,
  DatabaseHelper,
  AuthHelper,
  VoiceCallHelper,
  SMSHelper,
  VoicemailHelper,
  QuickbaseHelper,
  TaskRouterHelper,
  AdminHelper,
  RealtimeHelper,
  PerformanceHelper,
  SecurityHelper,
  CrossBrowserHelper,
  MobileHelper,
  TestUtils
};


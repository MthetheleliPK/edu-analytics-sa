const axios = require('axios');

class SMSService {
  constructor() {
    this.provider = process.env.SMS_PROVIDER || 'clickatell';
    this.apiKey = process.env.SMS_API_KEY;
    this.from = process.env.SMS_FROM || 'EduAnalytics';
  }

  async sendSMS(to, message) {
    if (!this.apiKey) {
      console.warn('SMS API key not configured. SMS would be sent to:', to, message);
      return { success: true, simulated: true };
    }

    try {
      let response;

      switch (this.provider) {
        case 'clickatell':
          response = await this.sendViaClickatell(to, message);
          break;
        case 'twilio':
          response = await this.sendViaTwilio(to, message);
          break;
        case 'africas_talking':
          response = await this.sendViaAfricasTalking(to, message);
          break;
        default:
          throw new Error(`Unsupported SMS provider: ${this.provider}`);
      }

      console.log(`SMS sent to ${to}: ${message}`);
      return { success: true, provider: this.provider, response };
    } catch (error) {
      console.error('SMS sending error:', error);
      throw new Error('Failed to send SMS');
    }
  }

  async sendViaClickatell(to, message) {
    const response = await axios.post(
      'https://platform.clickatell.com/messages',
      {
        to: [this.formatNumber(to)],
        content: message,
        from: this.from
      },
      {
        headers: {
          Authorization: this.apiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  }

  async sendViaTwilio(to, message) {
    // Twilio implementation would go here
    // const client = require('twilio')(accountSid, authToken);
    // return await client.messages.create({
    //   body: message,
    //   from: this.from,
    //   to: this.formatNumber(to)
    // });
    console.log('Twilio SMS:', to, message);
    return { sid: 'simulated' };
  }

  async sendViaAfricasTalking(to, message) {
    // Africa's Talking implementation
    const response = await axios.post(
      'https://api.africastalking.com/version1/messaging',
      new URLSearchParams({
        username: process.env.AT_USERNAME,
        to: this.formatNumber(to),
        message: message,
        from: this.from
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'apiKey': this.apiKey
        }
      }
    );

    return response.data;
  }

  formatNumber(number) {
    // Format number for international use
    let cleaned = number.replace(/\D/g, '');
    
    if (cleaned.startsWith('0')) {
      cleaned = '27' + cleaned.substring(1);
    }
    
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    return cleaned;
  }

  async sendAssessmentNotification(parentPhone, studentName, assessment, marks, percentage) {
    const message = `New result for ${studentName}: ${assessment.title} - ${marks}/${assessment.maxMarks} (${percentage}%). View details in parent portal.`;
    
    return await this.sendSMS(parentPhone, message);
  }

  async sendAttendanceNotification(parentPhone, studentName, date, status) {
    const message = `Attendance Alert: ${studentName} was ${status} on ${new Date(date).toLocaleDateString()}.`;
    
    return await this.sendSMS(parentPhone, message);
  }

  async sendGeneralAnnouncement(phoneNumbers, message) {
    const results = [];
    
    for (const number of phoneNumbers) {
      try {
        const result = await this.sendSMS(number, message);
        results.push({ number, success: true, result });
      } catch (error) {
        results.push({ number, success: false, error: error.message });
      }
    }

    return results;
  }
}

module.exports = new SMSService();
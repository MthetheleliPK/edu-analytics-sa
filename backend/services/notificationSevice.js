const emailService = require('./emailService');
const smsService = require('./smsService');
const User = require('../models/User');
const Student = require('../models/Student');

class NotificationService {
  /**
   * Send assessment results to parents
   */
  async sendAssessmentResults(assessment, results) {
    const notifications = [];
    
    for (const result of results) {
      try {
        const student = await Student.findById(result.studentId)
          .populate('contact');
        
        if (!student || !student.contact) continue;

        const percentage = (result.marks / assessment.maxMarks * 100).toFixed(1);
        
        // Email notification
        if (student.contact.parentEmail && student.contact.parentEmail !== '') {
          await emailService.sendAssessmentResults(
            student.contact.parentEmail,
            student.contact.parentName || 'Parent',
            `${student.firstName} ${student.lastName}`,
            assessment,
            result.marks,
            percentage
          );
          notifications.push({
            type: 'email',
            to: student.contact.parentEmail,
            student: `${student.firstName} ${student.lastName}`,
            status: 'sent'
          });
        }
        
        // SMS notification
        if (student.contact.parentPhone && student.contact.parentPhone !== '') {
          await smsService.sendAssessmentNotification(
            student.contact.parentPhone,
            `${student.firstName} ${student.lastName}`,
            assessment,
            result.marks,
            percentage
          );
          notifications.push({
            type: 'sms',
            to: student.contact.parentPhone,
            student: `${student.firstName} ${student.lastName}`,
            status: 'sent'
          });
        }
      } catch (error) {
        console.error(`Notification failed for student ${result.studentId}:`, error);
        notifications.push({
          type: 'error',
          student: result.studentId,
          status: 'failed',
          error: error.message
        });
      }
    }
    
    return notifications;
  }

  /**
   * Send bulk announcement to all parents in a school
   */
  async sendSchoolAnnouncement(schoolId, message, title = 'School Announcement') {
    try {
      const students = await Student.find({ schoolId })
        .populate('contact');
      
      const uniqueParents = new Map();
      
      // Collect unique parent contacts
      students.forEach(student => {
        if (student.contact) {
          if (student.contact.parentEmail && student.contact.parentEmail !== '') {
            uniqueParents.set(student.contact.parentEmail, {
              email: student.contact.parentEmail,
              name: student.contact.parentName || 'Parent',
              phone: student.contact.parentPhone
            });
          }
        }
      });

      const notifications = [];
      const parentArray = Array.from(uniqueParents.values());
      
      // Send emails
      for (const parent of parentArray) {
        try {
          await emailService.sendGeneralAnnouncement(
            parent.email,
            title,
            message,
            parent.name
          );
          notifications.push({
            type: 'email',
            to: parent.email,
            status: 'sent'
          });
        } catch (error) {
          notifications.push({
            type: 'email',
            to: parent.email,
            status: 'failed',
            error: error.message
          });
        }
      }

      // Send SMS (limit to avoid excessive costs)
      const parentsWithPhone = parentArray.filter(p => p.phone && p.phone !== '').slice(0, 100); // Limit to 100 SMS
      
      for (const parent of parentsWithPhone) {
        try {
          await smsService.sendSMS(
            parent.phone,
            `Announcement: ${message.substring(0, 100)}...`
          );
          notifications.push({
            type: 'sms',
            to: parent.phone,
            status: 'sent'
          });
        } catch (error) {
          notifications.push({
            type: 'sms',
            to: parent.phone,
            status: 'failed',
            error: error.message
          });
        }
      }

      return {
        totalParents: parentArray.length,
        notificationsSent: notifications.filter(n => n.status === 'sent').length,
        notificationsFailed: notifications.filter(n => n.status === 'failed').length,
        details: notifications
      };
    } catch (error) {
      console.error('School announcement error:', error);
      throw new Error('Failed to send school announcement');
    }
  }

  /**
   * Send low performance alerts to parents
   */
  async sendPerformanceAlerts(schoolId, threshold = 50) {
    try {
      // Find students with average below threshold
      const lowPerformers = await require('../models/AssessmentResult').aggregate([
        {
          $lookup: {
            from: 'assessments',
            localField: 'assessmentId',
            foreignField: '_id',
            as: 'assessment'
          }
        },
        { $unwind: '$assessment' },
        {
          $match: {
            'assessment.schoolId': require('mongoose').Types.ObjectId(schoolId)
          }
        },
        {
          $group: {
            _id: '$studentId',
            averagePercentage: { $avg: '$percentage' },
            subjectCount: { $addToSet: '$assessment.subject' }
          }
        },
        {
          $match: {
            averagePercentage: { $lt: threshold }
          }
        }
      ]);

      const notifications = [];
      
      for (const performer of lowPerformers) {
        const student = await Student.findById(performer._id)
          .populate('contact');
        
        if (!student || !student.contact || !student.contact.parentEmail) continue;

        try {
          await emailService.sendPerformanceAlert(
            student.contact.parentEmail,
            student.contact.parentName || 'Parent',
            `${student.firstName} ${student.lastName}`,
            performer.averagePercentage.toFixed(1),
            threshold
          );
          
          notifications.push({
            student: `${student.firstName} ${student.lastName}`,
            average: performer.averagePercentage.toFixed(1),
            email: student.contact.parentEmail,
            status: 'sent'
          });
        } catch (error) {
          notifications.push({
            student: `${student.firstName} ${student.lastName}`,
            average: performer.averagePercentage.toFixed(1),
            status: 'failed',
            error: error.message
          });
        }
      }

      return {
        totalAlerts: lowPerformers.length,
        notificationsSent: notifications.filter(n => n.status === 'sent').length,
        details: notifications
      };
    } catch (error) {
      console.error('Performance alerts error:', error);
      throw new Error('Failed to send performance alerts');
    }
  }

  /**
   * Send system maintenance notifications
   */
  async sendMaintenanceNotification(schoolId, maintenanceSchedule) {
    try {
      const users = await User.find({ 
        schoolId,
        role: { $in: ['admin', 'principal'] }
      });

      const notifications = [];
      
      for (const user of users) {
        try {
          await emailService.sendMaintenanceNotification(
            user.email,
            user.firstName,
            maintenanceSchedule
          );
          notifications.push({
            type: 'email',
            to: user.email,
            status: 'sent'
          });
        } catch (error) {
          notifications.push({
            type: 'email',
            to: user.email,
            status: 'failed',
            error: error.message
          });
        }
      }

      return notifications;
    } catch (error) {
      console.error('Maintenance notification error:', error);
      throw new Error('Failed to send maintenance notifications');
    }
  }
}

module.exports = new NotificationService();
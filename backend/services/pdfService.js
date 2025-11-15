const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFService {
  generateStudentReport(student, assessments, overallStats) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers = [];
        
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Header
        this.addHeader(doc, `${student.firstName} ${student.lastName} - Academic Report`);

        // Student Information
        this.addStudentInfo(doc, student);

        // Overall Performance
        this.addOverallPerformance(doc, overallStats);

        // Subject Breakdown
        this.addSubjectBreakdown(doc, assessments);

        // Assessment Details
        this.addAssessmentDetails(doc, assessments);

        // Footer
        this.addFooter(doc);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  generateClassReport(className, students, assessments, stats) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers = [];
        
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // Header
        this.addHeader(doc, `Class Report - ${className}`);

        // Class Statistics
        this.addClassStatistics(doc, stats);

        // Student Performance Table
        this.addStudentPerformanceTable(doc, students);

        // Footer
        this.addFooter(doc);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  addHeader(doc, title) {
    // School Logo/Header
    doc
      .fontSize(20)
      .font('Helvetica-Bold')
      .fillColor('#2563eb')
      .text('EduAnalytics SA', 50, 50)
      .fontSize(16)
      .fillColor('#000000')
      .text(title, 50, 80)
      .moveDown();
  }

  addStudentInfo(doc, student) {
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Student Information:', 50, doc.y)
      .font('Helvetica')
      .text(`Name: ${student.firstName} ${student.lastName}`, 50, doc.y + 20)
      .text(`Student Number: ${student.studentNumber}`, 50, doc.y)
      .text(`Grade: ${student.grade}`, 50, doc.y)
      .text(`Class: ${student.class.name}`, 50, doc.y)
      .moveDown();
  }

  addOverallPerformance(doc, stats) {
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Overall Performance:', 50, doc.y)
      .font('Helvetica')
      .text(`Average: ${stats.average.toFixed(1)}%`, 50, doc.y + 20)
      .text(`Total Assessments: ${stats.totalAssessments}`, 50, doc.y)
      .text(`Position in Class: ${stats.position || 'N/A'}`, 50, doc.y)
      .moveDown();
  }

  addSubjectBreakdown(doc, assessments) {
    const subjects = {};
    assessments.forEach(assessment => {
      if (!subjects[assessment.subject]) {
        subjects[assessment.subject] = [];
      }
      subjects[assessment.subject].push(assessment);
    });

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Subject Performance:', 50, doc.y);

    Object.entries(subjects).forEach(([subject, subjectAssessments]) => {
      const average = subjectAssessments.reduce((sum, a) => sum + a.percentage, 0) / subjectAssessments.length;
      
      doc
        .font('Helvetica')
        .text(`${subject}: ${average.toFixed(1)}%`, 70, doc.y + 15);
    });
    
    doc.moveDown();
  }

  addAssessmentDetails(doc, assessments) {
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Assessment Details:', 50, doc.y)
      .moveDown();

    assessments.forEach((assessment, index) => {
      if (doc.y > 700) { // Add new page if needed
        doc.addPage();
      }

      doc
        .font('Helvetica')
        .text(`${assessment.title} (${assessment.assessmentType})`, 70, doc.y)
        .text(`Subject: ${assessment.subject}`, 70, doc.y + 15)
        .text(`Marks: ${assessment.marks}/${assessment.maxMarks} (${assessment.percentage}%)`, 70, doc.y + 15)
        .text(`Date: ${new Date(assessment.date).toLocaleDateString()}`, 70, doc.y + 15)
        .moveDown();
    });
  }

  addClassStatistics(doc, stats) {
    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .text('Class Statistics:', 50, doc.y)
      .font('Helvetica')
      .text(`Class Average: ${stats.classAverage.toFixed(1)}%`, 50, doc.y + 20)
      .text(`Top Student: ${stats.topStudent} - ${stats.topAverage.toFixed(1)}%`, 50, doc.y)
      .text(`Students at Risk: ${stats.atRiskCount}`, 50, doc.y)
      .moveDown();
  }

  addStudentPerformanceTable(doc, students) {
    // Table header
    const startY = doc.y;
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('Student', 50, startY)
      .text('Average %', 200, startY)
      .text('Status', 280, startY);

    // Table rows
    students.forEach((student, index) => {
      const y = startY + 20 + (index * 15);
      
      if (y > 700) {
        doc.addPage();
        // Re-add header on new page
        doc.text('Student', 50, 50);
        doc.text('Average %', 200, 50);
        doc.text('Status', 280, 50);
      }

      doc
        .font('Helvetica')
        .text(`${student.firstName} ${student.lastName}`, 50, y)
        .text(student.average.toFixed(1), 200, y)
        .text(student.average < 50 ? 'At Risk' : 'Good', 280, y);
    });

    doc.moveDown();
  }

  addFooter(doc) {
    doc
      .fontSize(8)
      .fillColor('#666666')
      .text(`Generated on ${new Date().toLocaleDateString()} by EduAnalytics SA`, 
            50, doc.page.height - 50);
  }
}

module.exports = new PDFService();
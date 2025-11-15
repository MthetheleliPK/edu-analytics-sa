const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

class BackupService {
  constructor() {
    this.s3Client = process.env.AWS_ACCESS_KEY_ID ? new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    }) : null;
  }

  async createBackup(schoolId = null) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(__dirname, '../backups', timestamp);
    
    // Ensure backup directory exists
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    try {
      const models = mongoose.modelNames();
      const backupData = {};

      // Export data from each model
      for (const modelName of models) {
        const model = mongoose.model(modelName);
        let query = {};
        
        if (schoolId && this.isSchoolSpecificModel(modelName)) {
          query = { schoolId: mongoose.Types.ObjectId(schoolId) };
        }

        const data = await model.find(query).lean();
        backupData[modelName] = data;

        // Save individual model backup
        fs.writeFileSync(
          path.join(backupDir, `${modelName}.json`),
          JSON.stringify(data, null, 2)
        );
      }

      // Create metadata
      const metadata = {
        timestamp: new Date().toISOString(),
        schoolId: schoolId,
        version: '1.0',
        models: models,
        recordCounts: Object.keys(backupData).reduce((acc, key) => {
          acc[key] = backupData[key].length;
          return acc;
        }, {})
      };

      fs.writeFileSync(
        path.join(backupDir, 'metadata.json'),
        JSON.stringify(metadata, null, 2)
      );

      // Create zip archive
      const zipPath = path.join(__dirname, '../backups', `${timestamp}.zip`);
      await this.createZipArchive(backupDir, zipPath);

      // Upload to S3 if configured
      if (this.s3Client) {
        await this.uploadToS3(zipPath, `backups/${timestamp}.zip`);
      }

      // Cleanup temporary files
      fs.rmSync(backupDir, { recursive: true, force: true });

      return {
        filename: `${timestamp}.zip`,
        path: zipPath,
        metadata
      };
    } catch (error) {
      // Cleanup on error
      if (fs.existsSync(backupDir)) {
        fs.rmSync(backupDir, { recursive: true, force: true });
      }
      throw error;
    }
  }

  async restoreBackup(backupPath, schoolId = null) {
    try {
      const extractPath = path.join(__dirname, '../temp', Date.now().toString());
      
      // Extract zip file
      await this.extractZipArchive(backupPath, extractPath);

      // Read metadata
      const metadata = JSON.parse(
        fs.readFileSync(path.join(extractPath, 'metadata.json'), 'utf8')
      );

      // Restore data
      for (const modelName of metadata.models) {
        const model = mongoose.model(modelName);
        const dataPath = path.join(extractPath, `${modelName}.json`);
        
        if (fs.existsSync(dataPath)) {
          const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
          
          // Clear existing data if full restore
          if (!schoolId) {
            await model.deleteMany({});
          } else {
            await model.deleteMany({ schoolId: mongoose.Types.ObjectId(schoolId) });
          }

          // Insert new data
          if (data.length > 0) {
            await model.insertMany(data);
          }
        }
      }

      // Cleanup
      fs.rmSync(extractPath, { recursive: true, force: true });

      return { message: 'Backup restored successfully', metadata };
    } catch (error) {
      throw error;
    }
  }

  async createZipArchive(sourceDir, outputPath) {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outputPath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => resolve());
      archive.on('error', reject);

      archive.pipe(output);
      archive.directory(sourceDir, false);
      archive.finalize();
    });
  }

  async uploadToS3(filePath, key) {
    const fileContent = fs.readFileSync(filePath);
    
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BACKUP_BUCKET,
      Key: key,
      Body: fileContent,
    });

    await this.s3Client.send(command);
  }

  isSchoolSpecificModel(modelName) {
    const schoolModels = ['User', 'Student', 'Class', 'Assessment', 'AssessmentResult'];
    return schoolModels.includes(modelName);
  }

  async listBackups(schoolId = null) {
    const backupsDir = path.join(__dirname, '../backups');
    
    if (!fs.existsSync(backupsDir)) {
      return [];
    }

    const files = fs.readdirSync(backupsDir)
      .filter(file => file.endsWith('.zip'))
      .map(file => {
        const filePath = path.join(backupsDir, file);
        const stats = fs.statSync(filePath);
        
        return {
          filename: file,
          path: filePath,
          size: stats.size,
          created: stats.birthtime,
          schoolId: this.extractSchoolIdFromFilename(file)
        };
      })
      .filter(backup => !schoolId || backup.schoolId === schoolId)
      .sort((a, b) => b.created - a.created);

    return files;
  }

  extractSchoolIdFromFilename(filename) {
    // Implement logic to extract schoolId from filename if needed
    return null;
  }
}

module.exports = new BackupService();
const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  siteName: { type: String, default: 'Quiz Hub' },
  siteDescription: { type: String, default: 'Online Quiz System' },
  language: { type: String, enum: ['English', 'Sinhala', 'Tamil'], default: 'English' },
  timezone: { type: String, default: 'Asia/Colombo' },
  defaultQuizTimeLimit: { type: Number, default: 30 }, // minutes
  defaultPassingScore: { type: Number, default: 60 }, // percentage
  maintenanceMode: { type: Boolean, default: false },

  // Notification preferences
  notifications: {
    appQuizComplete: { type: Boolean, default: true },
    appEventReminders: { type: Boolean, default: true },
    appNewStudents: { type: Boolean, default: true },
    appMarketing: { type: Boolean, default: false },
    frequency: { type: String, enum: ['immediately', 'daily', 'weekly'], default: 'immediately' }
  },

  // Privacy settings
  privacy: {
    publicProfile: { type: Boolean, default: true },
    showOnline: { type: Boolean, default: true },
    activityHistory: { type: Boolean, default: true },
    analytics: { type: Boolean, default: true },
    personalization: { type: Boolean, default: true },
    cookies: { type: Boolean, default: false }
  },

  updatedAt: { type: Date, default: Date.now }
});

// Ensure only one settings document
settingsSchema.statics.getInstance = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);

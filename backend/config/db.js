const mongoose = require('mongoose');

// Singleton Pattern - only one DB connection instance
class DatabaseConnection {
  constructor() {
    if (DatabaseConnection.instance) {
      return DatabaseConnection.instance;
    }
    this.connection = null;
    DatabaseConnection.instance = this;
  }

  async connect() {
    if (this.connection) {
      return this.connection;
    }
    try {
      this.connection = await mongoose.connect(process.env.MONGO_URI);
      console.log(`MongoDB Connected: ${mongoose.connection.host}`);
      return this.connection;
    } catch (error) {
      console.error(`DB Connection Error: ${error.message}`);
      process.exit(1);
    }
  }
}

module.exports = new DatabaseConnection();

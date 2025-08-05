const bcrypt = require("bcryptjs");
const { db } = require("../config/firebase");

class User {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.role = data.role || "user";
    this.avatar = data.avatar || "";
    this.status = data.status || "offline";
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.lastActive = data.lastActive || new Date();
    this.preferences = data.preferences || {
      theme: "light",
      notifications: {
        email: true,
        push: true,
        sms: false,
      },
      timezone: "UTC",
      language: "en",
    };
    this.resetPasswordToken = data.resetPasswordToken;
    this.resetPasswordExpire = data.resetPasswordExpire;
    this.emailVerified = data.emailVerified || false;
    this.emailVerificationToken = data.emailVerificationToken;
    this.emailVerificationExpire = data.emailVerificationExpire;
    this.googleTokens = data.googleTokens || null;
    this.googleCalendarConnected = data.googleCalendarConnected || false;
    this.googleCalendarConnectedAt = data.googleCalendarConnectedAt || null;
    this.outlookTokens = data.outlookTokens || null;
    this.outlookCalendarConnected = data.outlookCalendarConnected || false;
    this.outlookCalendarConnectedAt = data.outlookCalendarConnectedAt || null;
    this.zohoTokens = data.zohoTokens || null;
    this.zohoCalendarConnected = data.zohoCalendarConnected || false;
    this.zohoCalendarConnectedAt = data.zohoCalendarConnectedAt || null;
    this.defaultMeetingType = data.defaultMeetingType || "google-meet";
    this.customMeetingUrl = data.customMeetingUrl || "";
    this.meetingSettings = data.meetingSettings || {
      autoGenerateLinks: true,
      includePassword: true,
      defaultDuration: 30,
    };
    this.reminderPreferences = data.reminderPreferences || {
      email15min: true,
      email1hour: true,
      email1day: false,
      email1week: false,
      sms15min: false,
      sms1hour: false,
      whatsapp15min: false,
      whatsapp1hour: false,
      call15min: false,
      call1hour: false,
      enableSMS: false,
      enableWhatsApp: false,
      enableCall: false,
    };
    this.provider = data.provider || "local";
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Hash password before saving
  async hashPassword() {
    if (this.password) {
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  // Compare password
  async comparePassword(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  }

  // Save user to Firestore
  async save() {
    this.updatedAt = new Date();
    const userData = { ...this };
    delete userData.id; // Remove id from data
    
    if (this.id) {
      await db.collection('users').doc(this.id).set(userData, { merge: true });
    } else {
      const docRef = await db.collection('users').add(userData);
      this.id = docRef.id;
    }
    return this;
  }

  // Update last active
  async updateLastActive() {
    this.lastActive = new Date();
    await this.save();
    return this;
  }

  // Static methods
  static async findById(id) {
    const doc = await db.collection('users').doc(id).get();
    if (!doc.exists) return null;
    return new User({ id: doc.id, ...doc.data() });
  }

  static async findOne(query) {
    let queryRef = db.collection('users');
    
    // Build query
    Object.keys(query).forEach(key => {
      queryRef = queryRef.where(key, '==', query[key]);
    });

    const snapshot = await queryRef.limit(1).get();
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return new User({ id: doc.id, ...doc.data() });
  }

  static async create(data) {
    const user = new User(data);
    await user.hashPassword();
    await user.save();
    return user;
  }

  static async findByIdAndUpdate(id, updateData, options = {}) {
    const user = await this.findById(id);
    if (!user) return null;
    
    Object.keys(updateData).forEach(key => {
      if (key.startsWith('$')) {
        // Handle MongoDB-style operators
        if (key === '$unset') {
          Object.keys(updateData[key]).forEach(unsetKey => {
            delete user[unsetKey];
          });
        }
      } else {
        user[key] = updateData[key];
      }
    });
    
    await user.save();
    return options.new ? user : user;
  }

  static async findByRole(role) {
    const snapshot = await db.collection('users')
      .where('role', '==', role)
      .where('isActive', '==', true)
      .get();
    
    return snapshot.docs.map(doc => new User({ id: doc.id, ...doc.data() }));
  }

  static async findActive() {
    const snapshot = await db.collection('users')
      .where('isActive', '==', true)
      .get();
    
    return snapshot.docs.map(doc => new User({ id: doc.id, ...doc.data() }));
  }

  static async search(query) {
    // Firestore doesn't support regex, so we'll do a simple text search
    const snapshot = await db.collection('users')
      .where('isActive', '==', true)
      .get();
    
    const users = snapshot.docs.map(doc => new User({ id: doc.id, ...doc.data() }));
    
    return users.filter(user => 
      user.name.toLowerCase().includes(query.toLowerCase()) ||
      user.email.toLowerCase().includes(query.toLowerCase())
    );
  }

  // Convert to JSON (remove sensitive data)
  toJSON() {
    const userData = { ...this };
    delete userData.password;
    return userData;
  }

  // Get profile data
  get profile() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      role: this.role,
      avatar: this.avatar,
      status: this.status,
      isActive: this.isActive,
      lastActive: this.lastActive,
      preferences: this.preferences,
      emailVerified: this.emailVerified,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = User;
const { db } = require("../config/firebase");

class AutoReschedule {
  constructor(data) {
    this.id = data.id;
    this.owner = data.owner;
    this.name = data.name;
    this.description = data.description;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.conditions = data.conditions || [];
    this.actions = data.actions || [];
    this.settings = data.settings || {
      executeImmediately: false,
      executeAfterHours: 1,
      maxExecutions: 1,
      requireConfirmation: false,
    };
    this.stats = data.stats || {
      totalExecutions: 0,
      successfulActions: 0,
      failedActions: 0,
      lastExecuted: null,
    };
    this.bookingPages = data.bookingPages || [];
    this.surveys = data.surveys || [];
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  async save() {
    this.updatedAt = new Date();
    const ruleData = { ...this };
    delete ruleData.id;
    
    if (this.id) {
      await db.collection('autoReschedules').doc(this.id).set(ruleData, { merge: true });
    } else {
      const docRef = await db.collection('autoReschedules').add(ruleData);
      this.id = docRef.id;
    }
    return this;
  }

  static async create(data) {
    const rule = new AutoReschedule(data);
    await rule.save();
    return rule;
  }

  static async find(query = {}) {
    let queryRef = db.collection('autoReschedules');
    
    Object.keys(query).forEach(key => {
      if (key === '$or') {
        // Handle $or queries - we'll need to do multiple queries and merge
        // For now, simplified approach
      } else {
        queryRef = queryRef.where(key, '==', query[key]);
      }
    });

    const snapshot = await queryRef.orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => new AutoReschedule({ id: doc.id, ...doc.data() }));
  }

  static async findById(id) {
    const doc = await db.collection('autoReschedules').doc(id).get();
    if (!doc.exists) return null;
    return new AutoReschedule({ id: doc.id, ...doc.data() });
  }

  static async findOne(query) {
    const rules = await this.find(query);
    return rules.length > 0 ? rules[0] : null;
  }

  // Populate method simulation
  async populate(field, select) {
    if (field === 'bookingPages' && this.bookingPages) {
      const BookingPage = require('./BookingPage');
      const populatedPages = [];
      for (const pageId of this.bookingPages) {
        const page = await BookingPage.findById(pageId);
        if (page) populatedPages.push(page);
      }
      this.bookingPages = populatedPages;
    }
    if (field === 'surveys' && this.surveys) {
      const Survey = require('./Survey');
      const populatedSurveys = [];
      for (const surveyId of this.surveys) {
        const survey = await Survey.findById(surveyId);
        if (survey) populatedSurveys.push(survey);
      }
      this.surveys = populatedSurveys;
    }
    return this;
  }
}

module.exports = AutoReschedule;
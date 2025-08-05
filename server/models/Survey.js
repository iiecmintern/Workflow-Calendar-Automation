const { db } = require("../config/firebase");

class Survey {
  constructor(data) {
    this.id = data.id;
    this.owner = data.owner;
    this.name = data.name;
    this.description = data.description;
    this.questions = data.questions || [];
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.triggers = data.triggers || {
      sendAfterMeeting: true,
      sendAfterHours: 1,
      sendReminders: true,
      maxReminders: 2,
    };
    this.settings = data.settings || {
      allowAnonymous: false,
      showProgress: true,
      allowPartial: false,
    };
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  async save() {
    this.updatedAt = new Date();
    const surveyData = { ...this };
    delete surveyData.id;
    
    if (this.id) {
      await db.collection('surveys').doc(this.id).set(surveyData, { merge: true });
    } else {
      const docRef = await db.collection('surveys').add(surveyData);
      this.id = docRef.id;
    }
    return this;
  }

  static async create(data) {
    const survey = new Survey(data);
    await survey.save();
    return survey;
  }

  static async find(query = {}) {
    let queryRef = db.collection('surveys');
    
    Object.keys(query).forEach(key => {
      queryRef = queryRef.where(key, '==', query[key]);
    });

    const snapshot = await queryRef.orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => new Survey({ id: doc.id, ...doc.data() }));
  }

  static async findById(id) {
    const doc = await db.collection('surveys').doc(id).get();
    if (!doc.exists) return null;
    return new Survey({ id: doc.id, ...doc.data() });
  }

  static async findOne(query) {
    const surveys = await this.find(query);
    return surveys.length > 0 ? surveys[0] : null;
  }

  static async findOneAndDelete(query) {
    const survey = await this.findOne(query);
    if (survey) {
      await db.collection('surveys').doc(survey.id).delete();
    }
    return survey;
  }
}

module.exports = Survey;
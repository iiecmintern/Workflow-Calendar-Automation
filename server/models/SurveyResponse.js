const { db } = require("../config/firebase");

class SurveyResponse {
  constructor(data) {
    this.id = data.id;
    this.survey = data.survey;
    this.booking = data.booking;
    this.respondent = data.respondent;
    this.respondentEmail = data.respondentEmail;
    this.respondentName = data.respondentName;
    this.responses = data.responses || [];
    this.status = data.status || "started";
    this.startedAt = data.startedAt || new Date();
    this.completedAt = data.completedAt;
    this.sessionId = data.sessionId;
    this.timeSpent = data.timeSpent;
    this.sentiment = data.sentiment;
    this.overallRating = data.overallRating;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  async save() {
    this.updatedAt = new Date();
    const responseData = { ...this };
    delete responseData.id;
    
    if (this.id) {
      await db.collection('surveyResponses').doc(this.id).set(responseData, { merge: true });
    } else {
      const docRef = await db.collection('surveyResponses').add(responseData);
      this.id = docRef.id;
    }
    return this;
  }

  static async create(data) {
    const response = new SurveyResponse(data);
    await response.save();
    return response;
  }

  static async find(query = {}) {
    let queryRef = db.collection('surveyResponses');
    
    Object.keys(query).forEach(key => {
      if (typeof query[key] === 'object' && query[key].$in) {
        queryRef = queryRef.where(key, 'in', query[key].$in);
      } else {
        queryRef = queryRef.where(key, '==', query[key]);
      }
    });

    const snapshot = await queryRef.orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => new SurveyResponse({ id: doc.id, ...doc.data() }));
  }

  static async findById(id) {
    const doc = await db.collection('surveyResponses').doc(id).get();
    if (!doc.exists) return null;
    return new SurveyResponse({ id: doc.id, ...doc.data() });
  }

  static async findOne(query) {
    const responses = await this.find(query);
    return responses.length > 0 ? responses[0] : null;
  }

  static async deleteMany(query) {
    const responses = await this.find(query);
    const batch = db.batch();
    
    responses.forEach(response => {
      batch.delete(db.collection('surveyResponses').doc(response.id));
    });
    
    await batch.commit();
    return { deletedCount: responses.length };
  }

  // Populate method simulation
  async populate(field, select) {
    if (field === 'survey' && this.survey) {
      const Survey = require('./Survey');
      const survey = await Survey.findById(this.survey);
      this.survey = survey;
    }
    if (field === 'booking' && this.booking) {
      const Booking = require('./Booking');
      const booking = await Booking.findById(this.booking);
      this.booking = booking;
    }
    return this;
  }
}

module.exports = SurveyResponse;
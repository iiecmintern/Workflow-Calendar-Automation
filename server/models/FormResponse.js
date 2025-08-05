const { db } = require("../config/firebase");

class FormResponse {
  constructor(data) {
    this.id = data.id;
    this.form = data.form;
    this.booking = data.booking;
    this.guest = data.guest;
    this.responses = data.responses || [];
    this.submittedAt = data.submittedAt || new Date();
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  async save() {
    this.updatedAt = new Date();
    const responseData = { ...this };
    delete responseData.id;
    
    if (this.id) {
      await db.collection('formResponses').doc(this.id).set(responseData, { merge: true });
    } else {
      const docRef = await db.collection('formResponses').add(responseData);
      this.id = docRef.id;
    }
    return this;
  }

  static async create(data) {
    const response = new FormResponse(data);
    await response.save();
    return response;
  }

  static async find(query = {}) {
    let queryRef = db.collection('formResponses');
    
    Object.keys(query).forEach(key => {
      queryRef = queryRef.where(key, '==', query[key]);
    });

    const snapshot = await queryRef.orderBy('submittedAt', 'desc').get();
    return snapshot.docs.map(doc => new FormResponse({ id: doc.id, ...doc.data() }));
  }

  static async findById(id) {
    const doc = await db.collection('formResponses').doc(id).get();
    if (!doc.exists) return null;
    return new FormResponse({ id: doc.id, ...doc.data() });
  }

  static async countDocuments(query) {
    const responses = await this.find(query);
    return responses.length;
  }

  // Populate method simulation
  async populate(field, select) {
    if (field === 'booking' && this.booking) {
      const Booking = require('./Booking');
      const booking = await Booking.findById(this.booking);
      this.booking = booking;
    }
    return this;
  }
}

module.exports = FormResponse;
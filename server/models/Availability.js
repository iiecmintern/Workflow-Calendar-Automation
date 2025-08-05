const { db } = require("../config/firebase");

class Availability {
  constructor(data) {
    this.id = data.id;
    this.user = data.user;
    this.workingHours = data.workingHours || [];
    this.bufferBefore = data.bufferBefore || 0;
    this.bufferAfter = data.bufferAfter || 0;
    this.holidays = data.holidays || [];
    this.timezone = data.timezone || "UTC";
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  async save() {
    this.updatedAt = new Date();
    const availabilityData = { ...this };
    delete availabilityData.id;
    
    if (this.id) {
      await db.collection('availability').doc(this.id).set(availabilityData, { merge: true });
    } else {
      const docRef = await db.collection('availability').add(availabilityData);
      this.id = docRef.id;
    }
    return this;
  }

  static async create(data) {
    const availability = new Availability(data);
    await availability.save();
    return availability;
  }

  static async findOne(query) {
    let queryRef = db.collection('availability');
    
    Object.keys(query).forEach(key => {
      queryRef = queryRef.where(key, '==', query[key]);
    });

    const snapshot = await queryRef.limit(1).get();
    if (snapshot.empty) return null;
    
    const doc = snapshot.docs[0];
    return new Availability({ id: doc.id, ...doc.data() });
  }

  static async findByIdAndUpdate(id, updateData) {
    const availability = await this.findById(id);
    if (!availability) return null;
    
    Object.keys(updateData).forEach(key => {
      availability[key] = updateData[key];
    });
    
    await availability.save();
    return availability;
  }

  static async findById(id) {
    const doc = await db.collection('availability').doc(id).get();
    if (!doc.exists) return null;
    return new Availability({ id: doc.id, ...doc.data() });
  }
}

module.exports = Availability;
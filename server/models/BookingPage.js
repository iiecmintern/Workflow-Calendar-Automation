const { db } = require("../config/firebase");

class BookingPage {
  constructor(data) {
    this.id = data.id;
    this.owner = data.owner;
    this.slug = data.slug;
    this.title = data.title;
    this.description = data.description || "";
    this.logo = data.logo || "";
    this.color = data.color || "#2563eb";
    this.meetingTypes = data.meetingTypes || [];
    this.settings = data.settings || {
      buffer: 0,
      allowGuests: true,
    };
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  async save() {
    this.updatedAt = new Date();
    const pageData = { ...this };
    delete pageData.id;
    
    if (this.id) {
      await db.collection('bookingPages').doc(this.id).set(pageData, { merge: true });
    } else {
      const docRef = await db.collection('bookingPages').add(pageData);
      this.id = docRef.id;
    }
    return this;
  }

  static async create(data) {
    const page = new BookingPage(data);
    await page.save();
    return page;
  }

  static async find(query = {}) {
    let queryRef = db.collection('bookingPages');
    
    Object.keys(query).forEach(key => {
      queryRef = queryRef.where(key, '==', query[key]);
    });

    const snapshot = await queryRef.orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => new BookingPage({ id: doc.id, ...doc.data() }));
  }

  static async findById(id) {
    const doc = await db.collection('bookingPages').doc(id).get();
    if (!doc.exists) return null;
    return new BookingPage({ id: doc.id, ...doc.data() });
  }

  static async findOne(query) {
    const pages = await this.find(query);
    return pages.length > 0 ? pages[0] : null;
  }
}

module.exports = BookingPage;
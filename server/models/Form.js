const { db } = require("../config/firebase");

class Form {
  constructor(data) {
    this.id = data.id;
    this.owner = data.owner;
    this.name = data.name;
    this.description = data.description;
    this.type = data.type || "pre-booking";
    this.fields = data.fields || [];
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.bookingPage = data.bookingPage;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  async save() {
    this.updatedAt = new Date();
    const formData = { ...this };
    delete formData.id;
    
    if (this.id) {
      await db.collection('forms').doc(this.id).set(formData, { merge: true });
    } else {
      const docRef = await db.collection('forms').add(formData);
      this.id = docRef.id;
    }
    return this;
  }

  static async create(data) {
    const form = new Form(data);
    await form.save();
    return form;
  }

  static async find(query = {}) {
    let queryRef = db.collection('forms');
    
    Object.keys(query).forEach(key => {
      queryRef = queryRef.where(key, '==', query[key]);
    });

    const snapshot = await queryRef.orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => new Form({ id: doc.id, ...doc.data() }));
  }

  static async findById(id) {
    const doc = await db.collection('forms').doc(id).get();
    if (!doc.exists) return null;
    return new Form({ id: doc.id, ...doc.data() });
  }

  static async findOne(query) {
    const forms = await this.find(query);
    return forms.length > 0 ? forms[0] : null;
  }

  static async findByIdAndDelete(id) {
    const form = await this.findById(id);
    if (form) {
      await db.collection('forms').doc(id).delete();
    }
    return form;
  }
}

module.exports = Form;
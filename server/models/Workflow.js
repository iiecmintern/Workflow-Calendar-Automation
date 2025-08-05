const { db } = require("../config/firebase");

class Workflow {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.owner = data.owner;
    this.nodes = data.nodes || [];
    this.edges = data.edges || [];
    this.status = data.status || "draft";
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  async save() {
    this.updatedAt = new Date();
    const workflowData = { ...this };
    delete workflowData.id;
    
    if (this.id) {
      await db.collection('workflows').doc(this.id).set(workflowData, { merge: true });
    } else {
      const docRef = await db.collection('workflows').add(workflowData);
      this.id = docRef.id;
    }
    return this;
  }

  async deleteOne() {
    if (this.id) {
      await db.collection('workflows').doc(this.id).delete();
    }
  }

  static async create(data) {
    const workflow = new Workflow(data);
    await workflow.save();
    return workflow;
  }

  static async find(query = {}) {
    let queryRef = db.collection('workflows');
    
    Object.keys(query).forEach(key => {
      queryRef = queryRef.where(key, '==', query[key]);
    });

    const snapshot = await queryRef.orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => new Workflow({ id: doc.id, ...doc.data() }));
  }

  static async findById(id) {
    const doc = await db.collection('workflows').doc(id).get();
    if (!doc.exists) return null;
    return new Workflow({ id: doc.id, ...doc.data() });
  }

  static async findByIdAndUpdate(id, updateData) {
    const workflow = await this.findById(id);
    if (!workflow) return null;
    
    Object.keys(updateData).forEach(key => {
      workflow[key] = updateData[key];
    });
    
    await workflow.save();
    return workflow;
  }

  static async findByIdAndDelete(id) {
    const workflow = await this.findById(id);
    if (workflow) {
      await workflow.deleteOne();
    }
    return workflow;
  }
}

module.exports = Workflow;
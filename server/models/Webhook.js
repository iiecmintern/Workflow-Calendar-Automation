const { db } = require("../config/firebase");

class Webhook {
  constructor(data) {
    this.id = data.id;
    this.owner = data.owner;
    this.workflow = data.workflow;
    this.nodeId = data.nodeId;
    this.name = data.name;
    this.type = data.type;
    this.inbound = data.inbound;
    this.outbound = data.outbound;
    this.executions = data.executions || [];
    this.stats = data.stats || {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageResponseTime: 0,
      lastExecuted: null,
    };
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  async save() {
    this.updatedAt = new Date();
    const webhookData = { ...this };
    delete webhookData.id;
    
    if (this.id) {
      await db.collection('webhooks').doc(this.id).set(webhookData, { merge: true });
    } else {
      const docRef = await db.collection('webhooks').add(webhookData);
      this.id = docRef.id;
    }
    return this;
  }

  static async create(data) {
    const webhook = new Webhook(data);
    await webhook.save();
    return webhook;
  }

  static async find(query = {}) {
    let queryRef = db.collection('webhooks');
    
    Object.keys(query).forEach(key => {
      if (key === 'inbound.endpoint') {
        queryRef = queryRef.where('inbound.endpoint', '==', query[key]);
      } else {
        queryRef = queryRef.where(key, '==', query[key]);
      }
    });

    const snapshot = await queryRef.orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => new Webhook({ id: doc.id, ...doc.data() }));
  }

  static async findById(id) {
    const doc = await db.collection('webhooks').doc(id).get();
    if (!doc.exists) return null;
    return new Webhook({ id: doc.id, ...doc.data() });
  }

  static async findOne(query) {
    const webhooks = await this.find(query);
    return webhooks.length > 0 ? webhooks[0] : null;
  }

  static async findOneAndUpdate(query, updateData, options = {}) {
    const webhook = await this.findOne(query);
    if (!webhook) return null;
    
    Object.keys(updateData).forEach(key => {
      webhook[key] = updateData[key];
    });
    
    await webhook.save();
    return webhook;
  }

  static async findOneAndDelete(query) {
    const webhook = await this.findOne(query);
    if (webhook) {
      await db.collection('webhooks').doc(webhook.id).delete();
    }
    return webhook;
  }

  // Populate method simulation
  async populate(field, select) {
    if (field === 'workflow' && this.workflow) {
      const Workflow = require('./Workflow');
      const workflow = await Workflow.findById(this.workflow);
      this.workflow = workflow;
    }
    return this;
  }
}

module.exports = Webhook;
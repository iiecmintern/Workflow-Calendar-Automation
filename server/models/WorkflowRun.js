const { db } = require("../config/firebase");

class WorkflowRun {
  constructor(data) {
    this.id = data.id;
    this.workflow = data.workflow;
    this.user = data.user;
    this.status = data.status || "pending";
    this.steps = data.steps || [];
    this.result = data.result;
    this.startedAt = data.startedAt || new Date();
    this.finishedAt = data.finishedAt;
    this.error = data.error;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  async save() {
    this.updatedAt = new Date();
    const runData = { ...this };
    delete runData.id;
    
    if (this.id) {
      await db.collection('workflowRuns').doc(this.id).set(runData, { merge: true });
    } else {
      const docRef = await db.collection('workflowRuns').add(runData);
      this.id = docRef.id;
    }
    return this;
  }

  static async create(data) {
    const run = new WorkflowRun(data);
    await run.save();
    return run;
  }

  static async find(query = {}) {
    let queryRef = db.collection('workflowRuns');
    
    Object.keys(query).forEach(key => {
      if (key === 'steps.type' || key === 'steps.status' || key === 'steps.result.approver') {
        // For nested queries, we'll need to fetch all and filter
      } else {
        queryRef = queryRef.where(key, '==', query[key]);
      }
    });

    const snapshot = await queryRef.orderBy('startedAt', 'desc').limit(20).get();
    let runs = snapshot.docs.map(doc => new WorkflowRun({ id: doc.id, ...doc.data() }));
    
    // Apply complex filters
    if (query['steps.type'] || query['steps.status'] || query['steps.result.approver']) {
      runs = runs.filter(run => {
        return run.steps.some(step => {
          if (query['steps.type'] && step.type !== query['steps.type']) return false;
          if (query['steps.status'] && step.status !== query['steps.status']) return false;
          if (query['steps.result.approver'] && step.result?.approver !== query['steps.result.approver']) return false;
          return true;
        });
      });
    }
    
    return runs;
  }

  static async findById(id) {
    const doc = await db.collection('workflowRuns').doc(id).get();
    if (!doc.exists) return null;
    return new WorkflowRun({ id: doc.id, ...doc.data() });
  }

  // Populate method simulation
  async populate(field) {
    if (field === 'workflow' && this.workflow) {
      const Workflow = require('./Workflow');
      const workflow = await Workflow.findById(this.workflow);
      this.workflow = workflow;
    }
    return this;
  }
}

module.exports = WorkflowRun;
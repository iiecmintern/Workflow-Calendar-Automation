const { db } = require("../config/firebase");

class Booking {
  constructor(data) {
    this.id = data.id;
    this.owner = data.owner;
    this.title = data.title;
    this.start = data.start;
    this.end = data.end;
    this.guestName = data.guestName;
    this.guestEmail = data.guestEmail;
    this.guestPhone = data.guestPhone;
    this.bookingPage = data.bookingPage;
    this.meetingType = data.meetingType || "google-meet";
    this.meetingLink = data.meetingLink;
    this.meetingPassword = data.meetingPassword;
    this.meetingInstructions = data.meetingInstructions;
    this.reminderSettings = data.reminderSettings || {
      email15min: true,
      email1hour: true,
      email1day: false,
      email1week: false,
      sms15min: false,
      sms1hour: false,
      whatsapp15min: false,
      whatsapp1hour: false,
      call15min: false,
      call1hour: false,
    };
    this.reminderHistory = data.reminderHistory || [];
    this.preBookingFormResponse = data.preBookingFormResponse;
    this.postBookingFormResponse = data.postBookingFormResponse;
    this.survey = data.survey;
    this.surveyResponse = data.surveyResponse;
    this.feedback = data.feedback;
    this.autoReschedule = data.autoReschedule || {
      enabled: false,
      conditions: [],
    };
    this.status = data.status || "scheduled";
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  async save() {
    this.updatedAt = new Date();
    
    // Check for overlapping bookings before saving
    if (this.bookingPage) {
      const overlapping = await Booking.findOverlapping(
        this.bookingPage,
        this.start,
        this.end,
        this.id
      );
      if (overlapping) {
        throw new Error("Booking time overlaps with an existing booking.");
      }
    }

    const bookingData = { ...this };
    delete bookingData.id;
    
    if (this.id) {
      await db.collection('bookings').doc(this.id).set(bookingData, { merge: true });
    } else {
      const docRef = await db.collection('bookings').add(bookingData);
      this.id = docRef.id;
    }
    return this;
  }

  static async create(data) {
    const booking = new Booking(data);
    await booking.save();
    return booking;
  }

  static async find(query = {}) {
    let queryRef = db.collection('bookings');
    
    Object.keys(query).forEach(key => {
      if (key === 'start' && query[key].$gte && query[key].$lt) {
        queryRef = queryRef
          .where('start', '>=', query[key].$gte)
          .where('start', '<', query[key].$lt);
      } else if (key === 'start' && query[key].$lt) {
        queryRef = queryRef.where('start', '<', query[key].$lt);
      } else if (key === 'end' && query[key].$gt) {
        queryRef = queryRef.where('end', '>', query[key].$gt);
      } else if (typeof query[key] === 'object' && query[key].$ne) {
        // Handle $ne operator - we'll filter after fetch
      } else {
        queryRef = queryRef.where(key, '==', query[key]);
      }
    });

    const snapshot = await queryRef.orderBy('start', 'desc').get();
    let bookings = snapshot.docs.map(doc => new Booking({ id: doc.id, ...doc.data() }));
    
    // Apply $ne filters
    Object.keys(query).forEach(key => {
      if (typeof query[key] === 'object' && query[key].$ne) {
        bookings = bookings.filter(booking => booking[key] !== query[key].$ne);
      }
    });
    
    return bookings;
  }

  static async findById(id) {
    const doc = await db.collection('bookings').doc(id).get();
    if (!doc.exists) return null;
    return new Booking({ id: doc.id, ...doc.data() });
  }

  static async findOne(query) {
    const bookings = await this.find(query);
    return bookings.length > 0 ? bookings[0] : null;
  }

  static async findOverlapping(bookingPageId, start, end, excludeId = null) {
    let queryRef = db.collection('bookings')
      .where('bookingPage', '==', bookingPageId);

    const snapshot = await queryRef.get();
    const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return bookings.find(booking => {
      if (excludeId && booking.id === excludeId) return false;
      const bookingStart = new Date(booking.start);
      const bookingEnd = new Date(booking.end);
      const newStart = new Date(start);
      const newEnd = new Date(end);
      
      return (newStart < bookingEnd && newEnd > bookingStart);
    });
  }

  static async countDocuments(query) {
    const bookings = await this.find(query);
    return bookings.length;
  }
}

module.exports = Booking;
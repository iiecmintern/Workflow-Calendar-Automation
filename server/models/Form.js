const mongoose = require("mongoose");

const formFieldSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    enum: [
      "text",
      "email",
      "phone",
      "textarea",
      "select",
      "checkbox",
      "radio",
      "file",
      "date",
      "time",
      "number",
    ],
  },
  required: {
    type: Boolean,
    default: false,
  },
  placeholder: {
    type: String,
    trim: true,
  },
  options: [
    {
      label: String,
      value: String,
    },
  ],
  validation: {
    minLength: Number,
    maxLength: Number,
    pattern: String,
    fileTypes: [String], // for file uploads
    maxFileSize: Number, // in MB
  },
  order: {
    type: Number,
    default: 0,
  },
});

const formSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["pre-booking", "post-booking"],
      default: "pre-booking",
    },
    fields: [formFieldSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
    bookingPage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BookingPage",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Form", formSchema);

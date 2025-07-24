const mongoose = require("mongoose");

const formResponseSchema = new mongoose.Schema(
  {
    form: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Form",
      required: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    guest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    responses: [
      {
        fieldId: {
          type: String,
          required: true,
        },
        label: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          required: true,
        },
        value: mongoose.Schema.Types.Mixed, // Can be string, array, or file reference
        files: [
          {
            filename: String,
            originalName: String,
            mimetype: String,
            size: Number,
            path: String,
            uploadedAt: {
              type: Date,
              default: Date.now,
            },
          },
        ],
      },
    ],
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("FormResponse", formResponseSchema);

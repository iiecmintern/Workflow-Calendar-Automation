const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const Form = require("../models/Form");
const FormResponse = require("../models/FormResponse");
const Booking = require("../models/Booking");
const {
  upload,
  validateFileUpload,
  getFileInfo,
} = require("../services/fileUploadService");
const { body, validationResult } = require("express-validator");

// Get all forms for the authenticated user
router.get("/", protect, async (req, res) => {
  try {
    const forms = await Form.find({ owner: req.user._id })
      .populate("bookingPage", "name slug")
      .sort({ createdAt: -1 });

    res.json(forms);
  } catch (error) {
    console.error("Error fetching forms:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get a specific form
router.get("/:id", protect, async (req, res) => {
  try {
    const form = await Form.findOne({
      _id: req.params.id,
      owner: req.user._id,
    }).populate("bookingPage", "name slug");

    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    res.json(form);
  } catch (error) {
    console.error("Error fetching form:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create a new form
router.post(
  "/",
  protect,
  [
    body("name").trim().notEmpty().withMessage("Form name is required"),
    body("type")
      .isIn(["pre-booking", "post-booking"])
      .withMessage("Invalid form type"),
    body("fields").isArray().withMessage("Fields must be an array"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, type, fields, bookingPage } = req.body;

      // Validate fields
      if (!Array.isArray(fields) || fields.length === 0) {
        return res
          .status(400)
          .json({ message: "At least one field is required" });
      }

      // Validate each field
      for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        if (!field.label || !field.type) {
          return res
            .status(400)
            .json({ message: `Field ${i + 1} must have label and type` });
        }

        // Set order if not provided
        if (field.order === undefined) {
          field.order = i;
        }
      }

      const form = new Form({
        owner: req.user._id,
        name,
        description,
        type,
        fields,
        bookingPage,
      });

      await form.save();
      res.status(201).json(form);
    } catch (error) {
      console.error("Error creating form:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Update a form
router.put(
  "/:id",
  protect,
  [
    body("name").trim().notEmpty().withMessage("Form name is required"),
    body("type")
      .isIn(["pre-booking", "post-booking"])
      .withMessage("Invalid form type"),
    body("fields").isArray().withMessage("Fields must be an array"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const form = await Form.findOne({
        _id: req.params.id,
        owner: req.user._id,
      });
      if (!form) {
        return res.status(404).json({ message: "Form not found" });
      }

      const { name, description, type, fields, bookingPage, isActive } =
        req.body;

      // Validate fields
      if (!Array.isArray(fields) || fields.length === 0) {
        return res
          .status(400)
          .json({ message: "At least one field is required" });
      }

      // Validate each field
      for (let i = 0; i < fields.length; i++) {
        const field = fields[i];
        if (!field.label || !field.type) {
          return res
            .status(400)
            .json({ message: `Field ${i + 1} must have label and type` });
        }

        // Set order if not provided
        if (field.order === undefined) {
          field.order = i;
        }
      }

      form.name = name;
      form.description = description;
      form.type = type;
      form.fields = fields;
      form.bookingPage = bookingPage;
      if (isActive !== undefined) form.isActive = isActive;

      await form.save();
      res.json(form);
    } catch (error) {
      console.error("Error updating form:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Delete a form
router.delete("/:id", protect, async (req, res) => {
  try {
    const form = await Form.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    // Check if form has responses
    const responseCount = await FormResponse.countDocuments({
      form: req.params.id,
    });
    if (responseCount > 0) {
      return res.status(400).json({
        message:
          "Cannot delete form with existing responses. Consider deactivating instead.",
      });
    }

    await Form.findByIdAndDelete(req.params.id);
    res.json({ message: "Form deleted successfully" });
  } catch (error) {
    console.error("Error deleting form:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Submit form response (for public booking pages)
router.post("/:id/submit", upload.array("files", 5), async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form || !form.isActive) {
      return res.status(404).json({ message: "Form not found or inactive" });
    }

    const { bookingId, responses } = req.body;
    const files = req.files || [];

    // Validate booking exists
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Process responses and files
    const processedResponses = [];
    let fileIndex = 0;

    for (const response of responses) {
      const field = form.fields.find(
        (f) => f._id.toString() === response.fieldId
      );
      if (!field) {
        continue;
      }

      const processedResponse = {
        fieldId: response.fieldId,
        label: field.label,
        type: field.type,
        value: response.value,
      };

      // Handle file uploads
      if (field.type === "file" && files[fileIndex]) {
        const file = files[fileIndex];

        // Validate file upload
        const validationErrors = validateFileUpload(file, field);
        if (validationErrors.length > 0) {
          return res.status(400).json({
            message: `File validation failed: ${validationErrors.join(", ")}`,
          });
        }

        processedResponse.files = [getFileInfo(file)];
        fileIndex++;
      }

      processedResponses.push(processedResponse);
    }

    // Create form response
    const formResponse = new FormResponse({
      form: form._id,
      booking: bookingId,
      responses: processedResponses,
    });

    await formResponse.save();

    // Update booking with form response reference
    if (form.type === "pre-booking") {
      booking.preBookingFormResponse = formResponse._id;
    } else {
      booking.postBookingFormResponse = formResponse._id;
    }
    await booking.save();

    res.status(201).json(formResponse);
  } catch (error) {
    console.error("Error submitting form response:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get form responses for a form (owner only)
router.get("/:id/responses", protect, async (req, res) => {
  try {
    const form = await Form.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    const responses = await FormResponse.find({ form: req.params.id })
      .populate("booking", "title start end guestName guestEmail")
      .sort({ submittedAt: -1 });

    res.json(responses);
  } catch (error) {
    console.error("Error fetching form responses:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get form responses for a booking
router.get("/booking/:bookingId", protect, async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.bookingId,
      owner: req.user._id,
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    const responses = await FormResponse.find({
      booking: req.params.bookingId,
    }).populate("form", "name type");

    res.json(responses);
  } catch (error) {
    console.error("Error fetching booking form responses:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

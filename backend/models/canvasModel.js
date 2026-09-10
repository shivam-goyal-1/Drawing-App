const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const CanvasSchema = new Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    elements: {
      type: [{ type: mongoose.Schema.Types.Mixed }],
    },

    shared_with: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Users",
      },
    ],
  },
  { timestamps: true }
);

CanvasSchema.statics.getAllCanvases = async function (email) {
  const user = await mongoose.model("Users").findOne({ email });

  if (!user) {
    throw new Error("User not found");
  }

  const canvases = await this.find({
    $or: [
      { owner: user._id },
      { shared_with: user._id },
    ],
  });

  return canvases;
};

CanvasSchema.statics.createCanvas = async function (
  email,
  name
) {
  const user = await mongoose
    .model("Users")
    .findOne({ email });

  if (!user) {
    throw new Error("User not found");
  }

  try {
    const canvas = new this({
      owner: user._id,
      name,
      elements: [],
      shared_with: [],
    });

    const newCanvas = await canvas.save();

    return newCanvas;
  } catch (error) {
    throw new Error("Error creating canvas");
  }
};

CanvasSchema.statics.loadCanvas = async function (
  email,
  id
) {
  const user = await mongoose
    .model("Users")
    .findOne({ email });

  if (!user) {
    throw new Error("User not found");
  }

  try {
    const canvas = await this.findOne({
      _id: id,
      $or: [
        { owner: user._id },
        { shared_with: user._id },
      ],
    });

    if (!canvas) {
      throw new Error("Canvas not found");
    }

    return canvas;
  } catch (error) {
    if (error.message === "Canvas not found") {
      throw error;
    }

    throw new Error("Error getting canvas");
  }
};

CanvasSchema.statics.updateCanvas = async function (
  email,
  id,
  elements
) {
  const user = await mongoose
    .model("Users")
    .findOne({ email });

  if (!user) {
    throw new Error("User not found");
  }

  try {
    const canvas = await this.findOne({
      _id: id,
      $or: [
        { owner: user._id },
        { shared_with: user._id },
      ],
    });

    if (!canvas) {
      throw new Error("Canvas not found");
    }

    canvas.elements = elements;

    const updatedCanvas = await canvas.save();

    return updatedCanvas;
  } catch (error) {
    if (error.message === "Canvas not found") {
      throw error;
    }

    throw new Error("Error updating canvas");
  }
};

CanvasSchema.statics.shareCanvas = async function (
  email,
  canvasId,
  sharedWithEmail
) {
  const User = mongoose.model("Users");

  try {
    const user = await User.findOne({ email });

    if (!user) {
      throw new Error("User not found");
    }

    const sharedWithUser = await User.findOne({
      email: sharedWithEmail,
    });

    if (!sharedWithUser) {
      throw new Error(
        "The user with this email does not exist"
      );
    }

    const canvas = await this.findOne({
      _id: canvasId,
      owner: user._id,
    });

    if (!canvas) {
      throw new Error(
        "Canvas not found or you are not the owner"
      );
    }

    if (
      canvas.owner.toString() ===
      sharedWithUser._id.toString()
    ) {
      throw new Error(
        "You cannot share a canvas with yourself"
      );
    }

    const alreadyShared = canvas.shared_with.some(
      (userId) =>
        userId.toString() ===
        sharedWithUser._id.toString()
    );

    if (alreadyShared) {
      throw new Error(
        "This canvas is already shared with this user"
      );
    }

    canvas.shared_with.push(sharedWithUser._id);

    const updatedCanvas = await canvas.save();

    return updatedCanvas;
  } catch (error) {
    throw new Error(error.message || "Error sharing canvas");
  }
};

// Check whether a user (by email) may access a canvas, as owner or collaborator
CanvasSchema.statics.hasAccess = async function (email, canvasId) {
  const user = await mongoose.model("Users").findOne({ email });

  if (!user) {
    throw new Error("User not found");
  }

  const canvas = await this.findOne({
    _id: canvasId,
    $or: [{ owner: user._id }, { shared_with: user._id }],
  });

  if (!canvas) {
    throw new Error("Canvas not found or access denied");
  }

  return canvas;
};

// Insert or update a single element by id, then persist immediately
CanvasSchema.statics.upsertElement = async function (canvasId, element) {
  const canvas = await this.findById(canvasId);

  if (!canvas) {
    throw new Error("Canvas not found");
  }

  const existingIndex = canvas.elements.findIndex(
    (el) => el && el.id === element.id
  );

  if (existingIndex === -1) {
    canvas.elements.push(element);
  } else {
    canvas.elements[existingIndex] = element;
  }

  canvas.markModified("elements");

  const updatedCanvas = await canvas.save();

  return updatedCanvas;
};

// Remove a single element by id, then persist immediately
CanvasSchema.statics.deleteElement = async function (canvasId, elementId) {
  const canvas = await this.findById(canvasId);

  if (!canvas) {
    throw new Error("Canvas not found");
  }

  canvas.elements = canvas.elements.filter(
    (el) => !(el && el.id === elementId)
  );

  canvas.markModified("elements");

  const updatedCanvas = await canvas.save();

  return updatedCanvas;
};

const Canvas = mongoose.model("Canvas", CanvasSchema);

module.exports = Canvas;
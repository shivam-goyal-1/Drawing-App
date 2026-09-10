const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const validator = require("validator");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxLength: 50,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "users",
  },
);

// Strip the password hash out of every response automatically, so
// res.json(user) (or res.json(newUser)) can never accidentally leak it -
// whether that's from an endpoint that exists today or one added later.
userSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.password;
    return ret;
  },
});

userSchema.statics.register = async function (name, email, password) {
  try {
    if (!validator.isEmail(email)) {
      throw new Error("Please enter a valid email");
    }

    if (!validator.isStrongPassword(password)) {
      throw new Error(
        "Password must be at least 8 characters long and include an uppercase letter, lowercase letter, number, and symbol.",
      );
    }

    const salt = await bcrypt.genSalt(10);

    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new this({
      name,
      email,
      password: hashedPassword,
    });
    const newUser = await user.save();
    return newUser;
  } catch (error) {
    throw new Error("Error registering user: " + error.message);
  }
};

userSchema.statics.getUser = async function (email) {
  try {
    const users = await this.findOne({ email });
    return users;
  } catch (error) {
    throw new Error("Error getting user: " + error.message);
  }
};

userSchema.statics.login = async function (email, password) {
  try {
    const user = await this.findOne({ email });

    if (!user) {
      throw new Error("Invalid login credentials");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new Error("Invalid email or password");
    }

    return user;
  } catch (error) {
    throw new Error("Error logging in: " + error.message);
  }
};

const userModel = mongoose.model("Users", userSchema);
module.exports = userModel;
const crypto = require('crypto'); // built-in
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { modeOfLogin } = require('../drivers/constants');

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      //   required: [true, "Please tell us your name"],
    },
    email: {
      type: String,
      //   required: [true, "Please provide your email"],
      unique: true,
      lowercase: true,
      sparse: true,
    },

    password: {
      type: String,
      //   required: [true, "Please provide a password"],
      minlength: 8,
      select: false,
    },
    wallet: { type: String, unique: true, sparse: true },
    network: { type: String },
    profileId: { type: String }, //Moralis Profile Id
    MOL: { type: String, enum: modeOfLogin }, //Mode of Login

    googleId: { type: String, unique: true, sparse: true }, //Google Profile Id
    twitterId: { type: String, unique: true, sparse: true }, //Twitter Profile Id

    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,

    uniqueReferLink: {
      type: String,
      required: [true, 'Refer link could not be generated'],
      unique: true,
    },
  },
  { versionKey: false, timestamps: true }
);

userSchema.pre('save', async function (next) {
  // Only run this function if password is modified
  if (!this.isModified('password')) return next();

  // Hash the password with a cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete the confirm password
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000; // subtracting 1 sec to counter the time between issuing jwt and document saving time
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  // this.password is not available because this refers to current document and current document does not have password as it is false
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = async function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000, // milliseconds to seconds
      10 // base 10
    ); // change date object to timestamp (unix)

    // console.log(changedTimeStamp, JWTTimestamp);
    return JWTTimestamp < changedTimeStamp;
  }
  // False means not changed
  return false;
};

userSchema.methods.createPasswordResetToken = async function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // adding miliseconds to date object

  return resetToken; // to send token into email and encrypted version to database and so becomes useless to change password and hence secured
};

const User = mongoose.model('User', userSchema);

module.exports = User;

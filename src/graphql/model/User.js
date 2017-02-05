
import mongoose from 'mongoose';
import bcrypt from 'bcrypt-as-promised';

const Schema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    description: 'Admin User Hashed Password',
    required: true,
    hidden: true,
  },
  email: {
    type: String,
    required: true,
    index: true,
  },
  passport: {
    type: String,
    required: true,
  },
}, {
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  collection: 'User',
});

Schema
  .pre('save', function (next) {
    // Hash the password
    if (this.isModified('password')) {
      this.encryptPassword(this.password)
        .then((hash) => {
          this.password = hash;
          next();
        })
        .catch(err => next(err));
    } else {
      return next();
    }
  });

Schema.methods = {
  authenticate(plainText) {
    return bcrypt.compare(plainText, this.password);
  },
  encryptPassword(password) {
    return bcrypt.hash(password, 8);
  },
};

export default mongoose.model('User', Schema);

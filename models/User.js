const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email:          { type: String, required: true, unique: true  },
  address:        { type: String },
  country:        { type: String },
  zipcode:        { type: String },
  password:       { type: String },
  firstname:      { type: String },
  lastname:       { type: String },
  mobilenumber:   { type: String },
  register_type:  { type: String, default: 'NORMAL_SIGNUP'},
  google_auth_user_id: { type: String },
  fb_auth_user_id: { type: String },
  avatar:         { type: String, default: 'defaultUser.png'},  
  wallet:         { type: String },
  level:         { type: String, default: 0 },
  level1_done:         { type: Boolean, default: true },
  level2_done:         { type: Boolean, default: false },
  referrallink:  {type: String, default: ''},
  date_form:      { type: Date, default: Date.now },
  follow1: {type: String, default: 0},
  follow2: {type: String, default: 0},
  follow3: {type: String, default: 0},
  follow4: {type: String, default: 0},
  follow5: {type: String, default: 0},
  admin: {type: Boolean, default: false},
  verifylink: {type: String},
  verified: {type: Boolean, default: false}
});

module.exports = mongoose.model('user', UserSchema);

const {
  USER_COLLECTION,
  PRODUCT_COLLECTION,
} = require('../config/collections');
const { get } = require('../config/connection');
const bcrypt = require('bcrypt');
const twilio = require('twilio');
const { ObjectId } = require('mongodb');
require('dotenv').config();
const client = new twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
let otp = 0;
module.exports = {
  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      const {username, email, password} = userData;
      bcrypt.hash(userData.password, 10).then((pass) => {
        delete userData.confirmPassword;
        get()
          .collection(USER_COLLECTION)
          .insertOne({username:username, email:email, password:pass, isAllowed:true})
          .then((data) => {
            resolve(data.insertedId);
          });
      });
    });
  },
  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      console.log(userData);
      let loginStatus = false;
      let response = {};
      let user = await get()
        .collection(USER_COLLECTION)
        .findOne({ email: userData.email });
      if (user) {
        if(user.isAllowed) {
          bcrypt.compare(userData.password, user.password).then((status) => {
            if (status) {
              console.log('Login Success');
              response.user = user;
              response.status = true;
              resolve(response);
            } else {
              console.log('Login Failed1');
              resolve({ status: false });
            }
          });
        } else {
          resolve({ status: "block" });
        }
      } else {
        console.log('Login Failed2');
        resolve({ status: false });
      }
    });
  },
  getOtp: (data) => {
    otp = generateOTP();
    return new Promise((resolve, reject) => {
      console.log('otpSignup');
      client.messages
        .create({
          body: `This is login otp from Home.com. your otp for login is : ${otp}`,
          to: `+91${data.phone}`,
          from: process.env.TWILIO_NUMBER,
        })
        .then((message) => {
          console.log(message.sid);
          resolve(true);
        })
        .catch((error) => {
          console.log(error);
        });
    });
  },
  verifyOtp: (body) => {
    return new Promise((resolve, reject) => {
      console.log(body.otp);
      if (otp == body.otp) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  },
  loginOtp: (phone) => {
    return new Promise((resolve, reject) => {
      // const {phone} = data;
      console.log(phone);
      get()
        .collection(USER_COLLECTION)
        .findOne({ username: phone })
        .then((user) => {
          if (user) {
            console.log('user exits');
            resolve(user);
          } else {
            console.log('new user');
            get()
              .collection(USER_COLLECTION)
              .insertOne({ username: phone })
              .then((user) => {
                resolve(user);
              });
          }   
        });  
    });
  },
  getAllProducts: () => {
    return new Promise((resolve, reject) => {
      get()
        .collection(PRODUCT_COLLECTION)
        .find()
        .toArray()
        .then((product) => {
          resolve(product);
        });
    });
  },
  getProduct: (id) => {
    return new Promise((resolve, reject) => {
      get().collection(PRODUCT_COLLECTION).findOne({_id: ObjectId(id)}).then((product) => {
        resolve(product);
      })
    })
  }
  
};
function generateOTP() {
  var digits = '0123456789';
  let OTP = '';
  for (let i = 0; i < 4; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
}

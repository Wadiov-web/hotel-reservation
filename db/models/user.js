const mongoose = require('mongoose')

const user = new mongoose.Schema({
    email: {type: String, required: true},
    password: {type: String, required: true},
    username: {type: String, required: true},
    
    inbox: [
        {
            by: {type: String},
            catg: {type: String},
            from: {type: String},
            to: {type: String},
            rooms: {type: String},
            days: {type: String},
            totalPrice: {type: String},
            status: {type: Boolean}
        }
    ]
})


const User = mongoose.model('User', user)
module.exports = User
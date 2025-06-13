const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const validator = require('validator');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3
    },

    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        validate: {
            validator: validator.isEmail,
            message: 'Please enter a valid email address'
        }
    },

    password: {
        type: String,
        required: true,
        minlength: 6,
        select: false //don't return password in queries by default
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

//Hash password before saving
userSchema.pre('save', function(next){
    if(!this.isModified('password')){
        return next();
    }

    try{
        // use bcrypt for secure password hashing
        const saltRounds = 10;
        const salt = bcrypt.genSaltSync(saltRounds);
        this.password = bcrypt.hashSync(this.password, salt);
        next();
    }
    catch(err) {
        next(err);
    }

});

//method to verify password
userSchema.methods.verifyPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
}

const User = mongoose.model('User', userSchema);

module.exports = User;

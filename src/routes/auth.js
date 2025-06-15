const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Register a new user
router.post('/register', async(req,res)=>{
    try {
        const {username, email, password} = req.body;

        // validate input
        if(!username || !email || !password) {
            return res.status(400).json({
                error: 'Please provide username, email and password'
            });
        }

        // check if user already exists
        const existingUser = await User.findOne({
            $or: [{username}, {email}]
        });

        if(existingUser) {
            return res.status(400).json({
                error: 'Username or email is already in use'
            });
        }

        //create new user with 'user' role
        const newUser = new User({
            username,
            email,
            password,
            role: 'user'
        });

        await newUser.save();

        // Return success but don't send password
        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role 
            }
        });
    }
    catch(err) {
        console.error('Registration error: ',err);
        res.status(500).json({
            error: 'Failed to register user'
        });
    }
});

// User login
router.post('/login', async(req,res)=>{
    try{
        const {username, password} = req.body;

        //validate input
        if(!username || !password) {
            return res.status(400).json({
                error: 'Please provide username and password'
            });
        }

        //find user and include password for verification
        const user = await User.findOne({username}).select('+password');

        if(!user) {
            return res.status(401).json({
                error: 'Invalid credentials'
            });
        }

        // verify password
        if(!user.verifyPassword(password)){
            return res.status(401).json({
                error: 'Invalid credentials'
            });
        }
        const token = jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '24h'
            }
    );

    //set token as http only cookie
    res.cookie('token', token, {
        httpOnly: true,
        maxAge: parseInt(process.env.COOKIE_MAX_AGE) || 86400000, // 24 hours in milliseconds
    });

    // return success with user info without password
    res.json({
        message: 'Login successful',
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role
        }
    });
    }
    catch(err) {
        console.error('Login error: ',err);
        res.status(500).json({
            error: 'Failed to login'
        });
    }
});

// admin registration
router.post('/admin/register', async(req, res) => {
    try {
        const {username, email, password, adminKey} = req.body;

        //validate input
        if(!username || !email || !password) {
            return res.status(400).json({
                error: 'Please provide username, email and password'
            });
        }

        if(!adminKey || adminKey !== process.env.ADMIN_REGISTER_KEY){
            return  res.status(403).json({
                error: 'Invalid admin registration key'
            });
        }

        // check if user already exist
        const existingUser = await User.findOne({
            $or: [{username}, {email}]
        });

        if(existingUser) {
            return res.status(400).json({
                error: 'Username or email is already in use'
            });
        }

        // create new user with admin role
        const newAdmin = new User({
            username,
            email,
            password,
            role: 'admin'
        });

        await newAdmin.save();

        //return success but don't send password
        res.status(201).json({
            message: 'Admin registered successfully',
            user: {
                id: newAdmin._id,
                username: newAdmin.username,
                email: newAdmin.email,
                role: newAdmin.role 
            }
        });
    }
    catch(err) {
        console.error('Admin registration error: ', err);
        res.status(500).json({
            error: 'Failed to register admin'
        });
    }
});

// admin login
router.post('/admin/login', async(req,res) => {
    try {
        const {username, password} = req.body;

        //validate input
        if(!username || !password) {
            return res.status(400).json({
                error: 'Please provide username and password'
            });
        }

        // find user and include password for verification
        const admin = await User.findOne({
            username,
            role: 'admin',
        }).select('+password');

        if(!admin) {
            return res.status(401).json({
                error: 'Invalid credentials or not an admin'
            });
        }

        //verify password
        if(!admin.verifyPassword(password)){
            return res.status(401).json({
                error: 'Invalid credentials'
            });
        }

        //generate JWT
        const token = jwt.sign({
            id: admin._id,
            role: admin.role,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: '24h'
        }
        );

        // set token as http only cookie
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: parseInt(process.env.COOKIE_MAX_AGE) || 86400000, //24 hours in milliseconds
        });

        // return success with admin info without password
        res.json({
            message: 'Admin login successful',
            user: {
                id: admin._id,
                username: admin.username,
                email: admin.email,
                role: admin.role
            }
        }); 
    }
    catch(err) {
        console.error('Admin login error: ', err);
        res.status(500).json({
            error: 'Failed to login as admin'
        });
    }
});

// logout for both users and admins
router.post('/logout', (req,res) => {
    // clear token cookie
    res.clearCookie('token');
    res.json({
        message: 'Logged out successfully'
    });
});

module.exports = router;

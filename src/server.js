require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const {authenticate} = require('./middleware/auth');

// import routes
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
        .then(() => console.log('Connected to MongoDB'))
        .catch((err) => {
            console.log('MongoDB connection error: ',err);
            process.exit(1);
        });

// middleware
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

// Health check endpoint
app.get('/health', (req,res) => {
    res.json({
        status: 'ok',
        timestamp: new Date()
    });
});

// auth middleware for all protected routes
app.use('/api', authenticate);
app.use('/admin', authenticate);

// auth route - not protected by middleware
app.use('/auth', authRoutes);

// protected routes
app.use('/api', apiRoutes);
app.use('/admin', adminRoutes);

// 404 handler
app.use((req,res)=> {
    res.status(404).json({
        error: 'Not found'
    });
});

// Error handler
app.use((err,req,res,next) => {
    console.error('Server error: ',err);
    res.status(500).json({
        error: 'Internal Server Error'
    });
});

// start server
app.listen(PORT, ()=>{
    console.log(`Server running on PORT ${PORT}`);
});



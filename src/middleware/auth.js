const jwt = require('jsonwebtoken');

// middleware to verify JWT from cookie and attach user info to request
const authenticate = (req, res, next) =>{
    try{
        //get token from cookie
        const token = req.cookies.token;

        if(!token) {
            return res.status(401).json({
                error: 'Authentication required'
            });
        }

        //verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        //attach user info to the request
        req.user = decoded;

        next();
    }
    catch(err) {
        console.error('Authentication error: ',err.message);
        return res.status(401).json({
            error: 'Invalid token'
        });
    }
};
//middleware to check if user has admin role
const requireAdmin = (req, res, next)=> {
    if(!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
            error: 'Admin access required'
        });
    }
    next();
};


// middleware to check if user has user role
const requireUser = (req, res, next) => {
    if(!req.user || req.user.role !== 'user'){
        return res.status(403).json({
            error: 'User access required'
        });
    }
    next();
};

module.exports = {
    authenticate,
    requireAdmin,
    requireUser
};






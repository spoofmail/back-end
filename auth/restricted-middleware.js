const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.headers.authorization;
  const secret = process.env.JWT_SECRET || 'Spoofmail Secret!';

  if (token) {
    jwt.verify(token, secret, {}, (err, decoded) => {
      if(err) {
        return res.status(401).json({ status: 'error', message: 'Error validating token provided' }) 
      } else {
        req.jwt = { 
          username: decoded.username, 
          user_id: decoded.subject 
        }

        next();
      }
    });
  } else {
    return res.status(401).json({ status: 'error', message: 'No token provided' }) 
  }
}
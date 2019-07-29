const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {

  const token = req.headers.authorization
  const secret = process.env.JWT_SECRET || 'keep it secret, keep it safe!';

  if (token) {
    jwt.verify(token, secret, (err, decoded) => {
      if(err) {
        //invalid token
        res.status(401).json({ you: 'shall not pass'}) 
      } else {
        //valid token
        next();
      }
    });
  } else {
    res.status(401).json({ you: 'no token provided'}) 
  }
}
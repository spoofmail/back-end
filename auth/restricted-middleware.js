const jwt = require('jsonwebtoken');

parseJwt = function(token) {
  var base64Url = token.split('.')[1];
  var base64 = base64Url.replace('-', '+').replace('_', '/');
  return JSON.parse($window.atob(base64));
}

module.exports = (req, res, next) => {

  const token = req.headers.authorization
  const secret = process.env.JWT_SECRET || 'Spoofmail Secret!';

  if (token) {
    jwt.verify(token, secret, {}, (err, decoded) => {
      if(err) {
        //invalid token
        res.status(401).json({ you: 'shall not pass'}) 
      } else {
        //valid token
        
        req.jwt = parseJwt(token)

        next();
      }
    });
  } else {
    res.status(401).json({ you: 'no token provided'}) 
  }
}
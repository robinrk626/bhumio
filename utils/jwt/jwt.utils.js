const jwt = require('jsonwebtoken');

const {
  jwt: { secret: jwtSecret },
} = require('../../config').getConfig();

const generateToken = (params) => {
  const options = {};
  const token = jwt.sign(
    params,
    jwtSecret,
    options,
  );
  return token;
};

const decodeToken = (token='') => {
  const decodedToken = jwt.verify(token, jwtSecret);
  return decodedToken;
}

module.exports = {
  generateToken,
  decodeToken,
};

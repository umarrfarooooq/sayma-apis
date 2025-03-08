const jwt = require('jsonwebtoken');

const verifyAdminToken = (req, res, next) => {
  const token = req.cookies.adminToken;

  if (!token) {
    return res.redirect("/login");
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.redirect("/login");
    }
    if (!decoded.admin) {
      return res.redirect("/login");
    }

    req.userId = decoded.userId;
    next();
  });
};

module.exports = verifyAdminToken;

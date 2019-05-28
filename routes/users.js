var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/me', function(req, res, next) {
  if (!req.user) {
    res.status(401).send('please login first!');
    return;
  }
  res.send(`hello, ${req.user.name}`);
});

module.exports = router;

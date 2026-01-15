const validator = require('validator');

const validateInput = (req, res, next) => {
  // Sanitize and validate message content
  if (req.body.message) {
    req.body.message = validator.escape(req.body.message.trim());
    if (req.body.message.length > 2000) {
      return res.status(400).json({ error: 'Message too long' });
    }
  }

  // Validate project name
  if (req.body.name) {
    req.body.name = validator.escape(req.body.name.trim());
    if (!validator.isLength(req.body.name, { min: 1, max: 100 })) {
      return res.status(400).json({ error: 'Invalid project name' });
    }
  }

  // Validate email
  if (req.body.email && !validator.isEmail(req.body.email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  next();
};

module.exports = validateInput;
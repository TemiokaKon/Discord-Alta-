const Joi = require('joi');

/**
 * Validation middleware factory
 * @param {Object} schema - Joi validation schema
 * @param {String} property - Property to validate ('body', 'query', 'params')
 */
function validate(schema, property = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          errors: errors,
          timestamp: new Date().toISOString()
        }
      });
    }

    // Replace request property with validated value
    req[property] = value;
    next();
  };
}

/**
 * Common validation schemas
 */
const schemas = {
  // User schemas
  register: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
  }),

  login: Joi.object({
    email: Joi.string().email(),
    username: Joi.string().alphanum().min(3).max(30),
    password: Joi.string().required()
  }).xor('email', 'username'),

  updateProfile: Joi.object({
    username: Joi.string().alphanum().min(3).max(30),
    avatar: Joi.string().uri(),
    status: Joi.string().valid('online', 'away', 'dnd', 'invisible'),
    custom_status: Joi.string().max(128).allow('')
  }),

  // Message schemas
  sendMessage: Joi.object({
    content: Joi.string().min(1).max(2000).required()
  }),

  editMessage: Joi.object({
    content: Joi.string().min(1).max(2000).required()
  }),

  // Server schemas
  createServer: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    icon: Joi.string().uri(),
    description: Joi.string().max(500).allow('')
  }),

  updateServer: Joi.object({
    name: Joi.string().min(1).max(100),
    icon: Joi.string().uri()
  }),

  // Channel schemas
  createChannel: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    type: Joi.string().valid('text', 'voice').required(),
    serverId: Joi.number().integer().positive().required()
  }),

  // Friend schemas
  sendFriendRequest: Joi.object({
    friendId: Joi.number().integer().positive().required()
  }),

  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(50)
  }),

  // ID param
  id: Joi.object({
    id: Joi.number().integer().positive().required()
  })
};

module.exports = {
  validate,
  schemas
};

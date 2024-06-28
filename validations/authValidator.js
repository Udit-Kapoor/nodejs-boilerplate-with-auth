const Joi = require('joi');

const signupSchema = Joi.object({
  name: Joi.string().required(),
  password: Joi.string().required(),
  email: Joi.string().required().email(),
  referId: Joi.string().optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().required().email(),
  password: Joi.string().required(),
});

const web3VerifySchema = Joi.object({
  message: Joi.string().required(),
  signature: Joi.string().required(),
  network: Joi.string().required(),
  referId: Joi.string(),
});

module.exports = {
  signupSchema,
  loginSchema,
  web3VerifySchema,
};

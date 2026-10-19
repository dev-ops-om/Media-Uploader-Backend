import Joi from "joi";
import BaseDto from "../../../common/dto/base.dto.js";

class RegisterDto extends BaseDto {
  static schema = Joi.object({
    name: Joi.string().trim().min(2).max(50).required(),
    email: Joi.string().email().lowercase().trim().required(),
    password: Joi.string()
      .min(8)
      .message("Password must be at least 8 characters long")
      .required(),
    role: Joi.string().valid("customer", "seller").default("customer"),
  });
}

export default RegisterDto;
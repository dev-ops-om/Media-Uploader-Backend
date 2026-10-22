import Joi from "joi";
import BaseDto from "../../../common/dto/base.dto.js";

class ResetPasswordDto extends BaseDto {
  static schema = Joi.object({
    password: Joi.string()
      .min(8)
      .message("New password must be at least 8 characters long")
      .required(),
  });
}

export default ResetPasswordDto;
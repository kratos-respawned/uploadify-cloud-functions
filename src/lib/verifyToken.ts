import * as jwt from "jsonwebtoken";
import { instance } from "./axios";
import { AxiosError, AxiosResponse } from "axios";
type user = {
  id: string;
  name: string;
  email: string;
  image: string;
};
export const VerifyToken = async (
  API_KEY: string,
  API_SECRET: string,
  fileSize: number,
  fileName: string,
  fileUrl: string
): Promise<
  | {
      response: string;
      error: null;
    }
  | {
      response: null;
      error: string;
    }
> => {
  try {
    const id = jwt.verify(API_KEY, process.env.KEY_SECRET);
    const strSecret: unknown = jwt.verify(
      API_SECRET,
      process.env.SERVER_SECRET
    );

    const User: user = strSecret as user;
    if (User.id !== id) {
      return {
        response: null,
        error: "Invalid Token",
      };
    }
    const resp: AxiosResponse<{ message: string }> = await instance.post(
      "api/verifyKey",
      {
        id: id,
        key: API_KEY,
        secret: API_SECRET,
        fileSize: fileSize,
        fileName: fileName,
        fileUrl: fileUrl,
      }
    );
    return {
      response: resp.data.message,
      error: null,
    };
  } catch (err) {
    if (err instanceof AxiosError) {
      return {
        response: null,
        error: err.response?.data,
      };
    } else if (err instanceof jwt.JsonWebTokenError) {
      return {
        response: null,
        error: "Invalid Token",
      };
    }
    return {
      response: null,
      error: "Internal Server Error",
    };
  }
};

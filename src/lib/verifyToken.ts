import { instance } from "./axios";
import { AxiosError, AxiosResponse } from "axios";

export const VerifyToken = async (
  API_KEY: string,
  API_SECRET: string,
  fileSize: number
): Promise<
  | {
      response: string;
      userID: string;
      currentStorage: number;
      error: null;
    }
  | {
      response: null;
      userID: null;
      currentStorage: null;
      error: string;
    }
> => {
  try {
    const resp: AxiosResponse<{
      message: string;
      userID: string;
      currentStorage: number;
    }> = await instance.post("api/verifyKey", {
      key: API_KEY,
      secret: API_SECRET,
      fileSize: fileSize,
    });
    return {
      response: resp.data.message,
      userID: resp.data.userID,
      currentStorage: resp.data.currentStorage,
      error: null,
    };
  } catch (err) {
    if (err instanceof AxiosError) {
      return {
        response: null,
        userID: null,
        currentStorage: null,
        error: err.response?.data,
      };
    } else
      return {
        response: null,
        userID: null,
        currentStorage: null,
        error: "Internal Server Error",
      };
  }
};

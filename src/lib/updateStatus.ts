import { instance } from "./axios";
import { AxiosError, AxiosResponse } from "axios";
interface UpdateStatus {
  userID: string;
  fileName: string;
  fileSize: number;
  fileUrl: string;
  currentStorage: number;
}
export const updateStatus = async ({
  userID,
  currentStorage,
  fileName,
  fileSize,
  fileUrl,
}: UpdateStatus): Promise<
  | {
      response: number;
      error: null;
    }
  | {
      response: null;
      error: string;
    }
> => {
  try {
    console.log("updateStatus", {
      fileSize,
      fileName,
      fileUrl,
      userID,
      currentStorage,
    });
    const resp: AxiosResponse<{ remainingStorage: number }> =
      await instance.post("api/updateStatus", {
        fileSize,
        fileName,
        fileUrl,
        userID,
        currentStorage,
      });
    return {
      response: resp.data.remainingStorage,
      error: null,
    };
  } catch (err) {
    if (err instanceof AxiosError) {
      return {
        response: null,
        error: err.response?.data,
      };
    } else
      return {
        response: null,
        error: "Internal Server Error",
      };
  }
};

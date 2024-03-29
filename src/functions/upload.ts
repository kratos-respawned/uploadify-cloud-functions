import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { createHmac } from "crypto";
import { BlobServiceClient } from "@azure/storage-blob";
import { File } from "buffer";
import generateSASUrl from "../lib/generateSAStoken";
import { VerifyToken } from "../lib/verifyToken";
import { updateStatus } from "../lib/updateStatus";

export async function upload(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const body = await request.formData();
    const api_key = body.get("key");
    const token = request.headers.get("authorization");
    if (!token || !api_key) {
      return {
        jsonBody: {
          message: "Invalid Token",
        },
        status: 401,
      };
    }

    const file = body.get("file");
    const CONTAINERNAME = "images";
    if (file instanceof File) {
      if (file.size > 1024 * 1024 * 10) {
        return {
          jsonBody: { message: `File too large Max 10mb is supported` },
          status: 400,
        };
      }

      const { userID, response, error, currentStorage } = await VerifyToken(
        api_key as string,
        token,
        file.size
      );
      if (error) {
        return { jsonBody: { message: error }, status: 400 };
      }
      const fileName = file["name"];
      const extention = fileName.split(".").pop();
      const nameSalt = createHmac("sha256", process.env.SecretKey || "")
        .update(Date.now().toString())
        .digest("hex")
        .slice(-5);
      const hashedFileName =
        createHmac("sha256", process.env.SecretKey || "")
          .update(fileName)
          .digest("hex")
          .slice(0, 10) + nameSalt;
      const AccountName = process.env.AccountName;
      const AccountKey = process.env.AccountKey;
      if (!AccountName || !AccountKey) {
        return { jsonBody: { message: `Error` }, status: 500 };
      }
      const sasToken = await generateSASUrl({
        containerName: CONTAINERNAME,
        type: "upload",
      });
      const ViewToken = await generateSASUrl({
        containerName: CONTAINERNAME,
        type: "view",
      });

      const url = `https://${AccountName}.blob.core.windows.net/${CONTAINERNAME}/${hashedFileName}.${extention}?${ViewToken}`;

      const blobServiceClient = new BlobServiceClient(
        `https://${AccountName}.blob.core.windows.net?${sasToken}`
      );
      const containerClient =
        blobServiceClient.getContainerClient(CONTAINERNAME);
      const blockBlobClient = containerClient.getBlockBlobClient(
        `${hashedFileName}.${extention}`
      );
      const data = await file.arrayBuffer();
      try {
        await blockBlobClient.uploadData(data);
      } catch (error) {
        return { jsonBody: { message: `Error` }, status: 500 };
      }
      const updateRes = await updateStatus({
        userID,
        fileName,
        fileSize: file.size,
        fileUrl: url,
        currentStorage,
      });
      if (updateRes.error !== null) {
        // TODO: Delete the file
        // TODO: log the error in a database
        return { jsonBody: { message: updateRes.error }, status: 400 };
      }
      const body = {
        url,
        fileName: `${hashedFileName}.${extention}`,
        remainingStorage: response,
      };
      return {
        jsonBody: body,
        status: 200,
      };
    }
    return { jsonBody: { message: `Not a file` }, status: 400 };
  } catch (error) {
    return { jsonBody: { message: `Error` }, status: 500 };
  }
}

app.http("upload", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: upload,
});

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

export async function upload(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const body = await request.formData();
    const api_key = body.get("key");
    const token = request.headers.get("authorization");
    if (api_key !== process.env.Password || !token) {
      return { body: `Unauthorized`, status: 401 };
    }
    const file = body.get("file");
    const CONTAINERNAME = "images";
    if (file instanceof File) {
      if (file.size > 1024 * 1024 * 500) {
        return { body: `File too large`, status: 400 };
      }
      const fileName = file["name"];
      const extention = fileName.split(".").pop();
      const hashedFileName = createHmac("sha256", process.env.SecretKey || "")
        .update(fileName)
        .digest("hex");

      const AccountName = process.env.AccountName;
      const AccountKey = process.env.AccountKey;
      if (!AccountName || !AccountKey) {
        return { body: `Error`, status: 500 };
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
      const { response, error } = await VerifyToken(
        api_key,
        token,
        file.size,
        fileName,
        url
      );
      if (error) {
        return { body: error, status: 400 };
      }
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
        const resp = await blockBlobClient.uploadData(data);
        const body = {
          url,
          fileName: `${hashedFileName}.${extention}`,
        };
        return {
          jsonBody: body,
          status: 200,
        };
      } catch (error) {
        return { body: `Error`, status: 500 };
      }
    }
    return { body: `Not a file`, status: 400 };
  } catch (error) {
    context.log(error);
    return { body: `Error`, status: 500 };
  }
}

app.http("upload", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: upload,
});

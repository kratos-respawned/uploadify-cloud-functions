import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import generateSASUrl from "../lib/generateSAStoken";
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";
export async function download(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const token = request.headers.get("authorization");
  if (token !== process.env.ADMIN_SECRET) {
    return {
      jsonBody: {
        message: "Invalid Token",
      },
      status: 401,
    };
  }
  const CONTAINERNAME = "images";
  const AccountName = process.env.AccountName;
  const AccountKey = process.env.AccountKey;
  if (!AccountName || !AccountKey) {
    return { body: `Error`, status: 500 };
  }
  const sharedKeyCredential = new StorageSharedKeyCredential(
    AccountName,
    AccountKey
  );
  try {
    const sasToken = await generateSASUrl({
      containerName: CONTAINERNAME,
      type: "view",
    });
    const blobServiceClient = new BlobServiceClient(
      `https://${AccountName}.blob.core.windows.net?`,
      sharedKeyCredential
    );
    const containerClient = blobServiceClient.getContainerClient(CONTAINERNAME);
    const list = containerClient.listBlobsFlat();
    const blobs = [];
    for await (const blob of list) {
      context.log(blob.name);
      const url = `https://${AccountName}.blob.core.windows.net/${CONTAINERNAME}/${blob.name}?${sasToken}`;
      blobs.push(url);
    }
    return { jsonBody: blobs, status: 200 };
  } catch (error) {
    context.log(error);
    return { body: `Error`, status: 500 };
  }
}

app.http("download", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: download,
});

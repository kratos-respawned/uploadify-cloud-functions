import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  BlobSASPermissions,
  generateBlobSASQueryParameters,
} from "@azure/storage-blob";
const AccountName = process.env.AccountName;
const AccountKey = process.env.AccountKey;
const sharedKeyCredential = new StorageSharedKeyCredential(
  AccountName,
  AccountKey
);
const blobServiceClient = new BlobServiceClient(
  `https://${AccountName}.blob.core.windows.net`,
  sharedKeyCredential
);
interface GenerateSAS {
  containerName: string;
  type: "upload" | "view";
}
async function generateSASUrl({ containerName, type }: GenerateSAS) {
  // Create a container if not exists
  const containerClient = blobServiceClient.getContainerClient(containerName);
  await containerClient.createIfNotExists();
  //  check if current token is valid
  // if (currentToken) {
  //   const blockBlobClient = containerClient.getBlockBlobClient(currentToken);
  //   const exists = await blockBlobClient.exists();
  //   if (exists) {
  //     return currentToken;
  //   }
  // }
  const permissions = new BlobSASPermissions();
  if (type === "upload") {
    permissions.read = true;
    permissions.write = true;
    permissions.create = true;
  } else {
    permissions.read = true;
    permissions.write = false;
    permissions.create = false;
  }
  const expiryDate = new Date();
  if (type === "upload") {
    expiryDate.setHours(expiryDate.getHours() + 1);
  } else if (type === "view") {
    expiryDate.setFullYear(expiryDate.getFullYear() + 5);
  }
  const sasToken = generateBlobSASQueryParameters(
    {
      containerName: containerClient.containerName,
      permissions,
      expiresOn: expiryDate,
    },
    sharedKeyCredential
  ).toString();
  return sasToken;
}
export default generateSASUrl;

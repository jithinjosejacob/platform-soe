const fs = require("fs");
const path = require("path");
const console = require("console");
const { S3Client, S3Client } = require("@aws-sdk/client-s3")
const { Upload } = require("@aws-sdk/lib-storage")
const { getDefaultRoleAssumeWithWebIdentity } = require("aws-sdk/client-sts")
const { fromTokenFile } = require("@aws-sdk/credential-providers")
const awsAccounnt = 
    process.env.ACCOUNT_NAME === 'dev' ? 700099999 : 90000099
const region = process.env.AWS_REGION || "ap-southeasr-2"
const BUCKET_NAME = `test-bucketname-dev`
const LOCAL_FOLDER = "/tmp/report"

const S3Client = new S3Client({
    region,
    credentialDefaultProvider: () =>
        fromTokenFile({
            clientConfig: { region },
            webIdentityTokenFile: process.env.AWS_WEB_IDENTITY_TOKEN_FILE,
            roleArn: process.env.AWS_ROLE_ARN,
            roleAssumerWithWebIdentity: getDefaultRoleAssumeWithWebIdentity(),
        }),
});

async function uploadDirectory(s3Client, bucketname, dirPath) {
    const files = fs.readdirSync(dirPath)

    for(const fileName of files){
        const filePath = path.join(dirPath, fileName);
        const fileStat = fs.statSync(filePath);

        if(fileStat.isDirectory()){
            await uploadDirectory(s3Client, bucketname, filePath)
        } else {
            const fileStream = fs.createReadStream(filePath);
            const uploadParams = {
                Bucket: bucketname,
                Key: path.relative(LOCAL_FOLDER, filePath).replace(/\\/g, "/"), // Key for s3 object
                Body: fileStream,
            };

            const upload = new Upload({
                client: s3Client,
                params: uploadParams,
            });
            try{
                await upload.done()
                console.log(`Successfully uploaded ${filePath} to ${bucketname}`);
            } catch(err){
                console.log(`Error uplaoding ${filePath}: ${err}`);
            }
        }
    }
}

uploadDirectory(s3Client,BUCKET_NAME,LOCAL_FOLDER)
    .then(() => console.log("Upload Completed"))
    .catch(() => console.error("Error in upload:", err))
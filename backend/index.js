const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { graphqlUploadExpress } = require('graphql-upload-minimal');
const { json } = require('body-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const app = express();

require('dotenv').config();

const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.use(graphqlUploadExpress());

const typeDefs = `#graphql
  type Query {
    hello: String!
  }

  scalar Upload
  
  type Result{
    url: String
  }

  type Mutation {
    UploadFile(file: Upload): Result
  }
`;

const resolvers = {
  Query: {
    hello: () => 'Hello world!',
  },
  Mutation: {
    UploadFile: async (_, { file }) => {
      console.log(file);
      if (file) {
        try {
          let url = await uploadFile(file.file);
          return { url };
        } catch (err) {
          console.log(err);
          throw err;
        }
      }
      return { Message: 'Some error occured' };
    },
  },
};

const uploadFile = async function (file) {
  try {
    const { createReadStream } = await file;

    let stream = await createReadStream();
    let fileName = `${Date.now()}`;
    let serverFile = path.join(__dirname, `./${fileName}`);
    serverFile = serverFile.replace(' ', '_');
    let writeStream = await fs.createWriteStream(serverFile);
    await stream.pipe(writeStream);

    // upload to cloudinary
    const result = await cloudinary.uploader.upload(
      path.join(__dirname, fileName),
      {
        public_id: fileName,
        folder: 'graphql',
      }
    );

    // delete file from local
    await fs.promises.unlink(path.join(__dirname, fileName));

    return result.secure_url;
  } catch (err) {
    console.log(err);
    throw err;
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  csrfPrevention: false,
});

server.start().then(() => {
  app.use('/graphql', cors(), json(), expressMiddleware(server));

  app.listen(4100, () => {
    console.log('🚀 Server is good to go @  4100/graphql');
  });
});

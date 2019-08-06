import uuid from 'uuid/v4';
import multer from 'multer';
import mime from 'mime-types';
import { Storage } from '@google-cloud/storage';
import express from 'express'
const app = express()

const config = {
    google: {
        projectId: '<YOUR_PROJECT_ID>',
        bucket: '<YOUR_BUCKET_NAME>',
    },
};

app.post('/upload', multer().single('myfile'), async (req, res, next) => {
    const type = mime.lookup(req.file.originalname);

    const storage = new Storage({
        projectId: config.google.projectId,
        keyFilename: './google.json',
    });

    const bucket = storage.bucket(config.google.bucket);
    const blob = bucket.file(`${uuid()}.${mime.extensions[type][0]}`);

    const stream = blob.createWriteStream({
        resumable: true,
        contentType: type,
        predefinedAcl: 'publicRead',
    });

    stream.on('error', err => {
        next(err);
    });

    stream.on('finish', () => {
        res.status(200).json({
            data: {
                url: `https://storage.googleapis.com/${bucket.name}/${blob.name}`,
            },
        });
    });

    stream.end(req.file.buffer);
});

app.listen(3000, _ => console.log(`listening on 3000`))


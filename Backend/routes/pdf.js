import express from 'express';
import pdf from 'html-pdf';
import models from '../models';
import multer from 'multer';
import fs from 'fs';

const router = express.Router();
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, `${file.fieldname}_${+new Date()}.jpg`)
    }
});

const upload = multer({
    storage,
});

router.get("/", async (req, res, next) => {
  const documents = await models.Document.findAll();
  res.json(documents);
});

router.post("/", async (req, res, next) => {
  const document = await models.Document.create(req.body);
  res.json(document);
});

router.put("/:id", async (req, res, next) => {
  const id = req.params.id;
  const { name, document } = req.body;
  const doc = await models.Document.update(
    { name, document },
    { where: { id } }
  );
  res.json(doc);
});

router.delete("/:id", async (req, res, next) => {
  const id = req.params.id;
  await models.Document.destroy({ where: { id } });
  res.json({});
});

router.get("generatePdf/:id", async (req, res, next) => {
    const id = req.params.id;
    const documents = await models.Document.findAll({where: {id}});
    const document = documents[0];
    const stream = await new Promise((resolve, reject) => {
        pdf.create(document.document).toStream((err, stream) => {
            if(err) {
                reject(err);
                return;
            }
            resolve(stream);
        });
    });

    const fileName = `${+new Date()}.pdf`;
    const pdfPath = `${__dirname}/../files/${fileName}`;
    stream.pipe(fs.createWriteStream(pdfPath));
    const doc = await models.Document.update(
        { pdfPath: fileName },
        { where: { id } }
    );
    res.json(doc);
});

router.post("/uploadImage", upload.single('upload'), async (req, res, next) => {
    res.json({
        uploaded: true,
        url: `${process.env.BASE_URL}/${req.file.filename}`,
    });
});

export default router;
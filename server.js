const dotenv = require('dotenv');
const express = require('express');
const app = express();
const multer = require('multer');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const uri = "mongodb+srv://<username>:<password>@cluster0.bjj77ph.mongodb.net/?retryWrites=true&w=majority";
const File = require('./models/file');

app.use(express.urlencoded({extended:true}))
dotenv.config();

mongoose.connect(uri);

const upload = multer({ dest : "uploads" }) //to upload files to the destination uploads

app.set("view engine","ejs")

app.get("/", (req,res) => {
    res.render("index")
})

app.post("/upload", upload.single("file"), async (req,res) => {
    const fileData = {
        path : req.file.path,
        originalName: req.file.originalname
    }
    if(req.body.password != null && req.body.password != "") {
        fileData.password = await bcrypt.hash(req.body.password, 10)
    }
    const file = await File.create(fileData)
    res.render("index", {fileLink: `${req.headers.origin}/file/${file.id}`})
})

app.route("/file/:id").get(handleDownload).post(handleDownload)

async function handleDownload(req, res) {
  const file = await File.findById(req.params.id)

  if (file.password != null) {
    if (req.body.password == null) {
      res.render("password")
      return
    }

    if (!(await bcrypt.compare(req.body.password, file.password))) {
      res.render("password", { error: true })
      return
    }
  }

  await file.save()
  res.download(file.path, file.originalName)
}

app.listen(3000);
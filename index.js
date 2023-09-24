const express = require("express");
const  fs = require("fs");
const  path = require("path");
const app = express(); // setup express application
const PORT = process.env.PORT || 5123;
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
const ffmpeg = require('fluent-ffmpeg')
ffmpeg.setFfmpegPath(ffmpegPath)

app.get("/", (req, res) => {
  try {
    res.sendFile(__dirname + "/public/index.html");
  } catch (err) {
    res.status(500).send("internal server error occurred");
  }
});
app.get("/public/:file_name", (req, res) => {
	try {
        console.log('request get file', req.params.file_name);
		res.sendFile( path.join(__dirname, "public", req.params.file_name));
	} catch (err) {
		res.status(500).send("internal server error occurred");
	}
});

app.get("/video", (req, res) => {
    // indicates the part of a document that the server should return
    // on this measure in bytes for example: range = 0-6 bytes.
    const  range = req.headers.range;
    if (!range) res.status(400).send("Range must be provided");
    
    const  videoPath = path.join(__dirname, "public", "video.mp4");
    // extract video size by using statSyn()
    const  videoSize = fs.statSync(videoPath).size;
    // 10 powered by 6 equal 1000000bytes = 1mb
    const  chunkSize = 10 ** 6; 
    
    // calculating video where to start and where to end.
    const  start = Number(range.replace(/\D/g, ""));
    const  end = Math.min(start + chunkSize, videoSize - 1);
    const  contentLength = end - start + 1;
    
    // setup video headers
    const  headers = {
    "Content-Range":  `bytes ${start}-${end}/${videoSize}`,
    "Accept-Ranges":  "bytes",
    "Content-Length":  contentLength,
    "Content-Type":  "video/mp4",
    };
    
    res.writeHead(206, headers);
    // creating readStream (stdin).
    const  videoStream = fs.createReadStream(videoPath, { start, end });
    
    // create live stream pipe line
    videoStream.pipe(res);
});

app.get("/video/cut/:videoName", (req, res) => {
  ffmpeg(path.join(__dirname, "public",  req.params.videoName))
  .setStartTime('00:00:03')
  .setDuration(4)
  .output(path.join(__dirname, "public", "cut_" +  req.params.videoName))
  .on('end', function(err) {
    if(!err) { console.log('conversion Done') }
    res.send()
  })
  .on('error', err => console.log('error: ', err))
  .run()
});


app.listen(PORT, () => {
  console.log("SERVER STARTED AT PORT: " + PORT);
});

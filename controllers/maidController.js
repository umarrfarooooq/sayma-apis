const fs = require("fs")
const Maid = require("../Models/Maid")
const ffmpegStatic = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');
const jimp = require('jimp');
const { v4: uuidv4 } = require('uuid');
const path = require("path");


const generateUniqueCode = async (countryCode) => {
  let isUnique = false;
  let code;
  let counter = 1;

  while (!isUnique) {
    code = `${countryCode}${counter.toString().padStart(4, "0")}`;
    const existingMaid = await Maid.findOne({ code });

    if (!existingMaid) {
      isUnique = true;
    } else {
      counter++;
    }
  }

  return code;
};

exports.addMaid = async (req, res) =>{
  try {
    const compressImages = async () => {
      const images = ['maidImg', 'maidImg2', 'maidImg3', 'maidImg4'];
      const imagePaths = [];
    
      for (const image of images) {
        if (req.files[image] && req.files[image].length > 0) {
          const imagePath = req.files[image][0].path;
          const uniqueImageName = `${uuidv4()}_${image}.webp`;
          const compressedImagePath = `uploads/images/${uniqueImageName}`;
        
          try {
            const loadedImage = await jimp.read(imagePath);
            loadedImage.resize(500, jimp.AUTO);
            loadedImage.quality(50);

            await loadedImage.writeAsync(compressedImagePath);

            try {
              await fs.promises.unlink(imagePath);
            } catch (err) {
              console.error('Error deleting original image:', err.message);
            }
    
            imagePaths.push(compressedImagePath);
          } catch (err) {
            console.error('Error compressing image:', err.message);
            imagePaths.push(undefined);
          }
        } else {
          imagePaths.push(undefined);
        }
      }
    
      return imagePaths;
    };
    const compressedImagePaths = await compressImages();



    let videoPath;
    let compressedVideoPath;
    let uniqueFilename;

    const compressVideo = new Promise((resolve, reject) => {
      if (req.files["videoLink"] && req.files["videoLink"][0]) {
        const checkFile = req.files["videoLink"][0];
        videoPath = checkFile.path;
        compressedVideoPath = "uploads/maidVideos";
        const videoBitrate = '500k';
        const crfValue = '28';
        uniqueFilename = `video_${Date.now()}.mp4`;

        ffmpeg.setFfmpegPath(ffmpegStatic);

        ffmpeg()
          .input(videoPath)
          .videoCodec('libx264')
          .addOption('-crf', crfValue)
          .addOption('-b:v', videoBitrate)
          .output(`${compressedVideoPath}/${uniqueFilename}`)
          .on('start', () => {
            console.log('Compression started');
          })
          .on('end', () => {
            console.log('Video compression complete.');
            fs.unlink(videoPath, (err) => {
              if (err) {
                console.error('Error deleting the file:', err.message);
              } else {
                console.log('Original video file deleted successfully.');
              }
            });
            resolve(`${compressedVideoPath}/${uniqueFilename}`);
          })
          .on('error', (err) => {
            console.error('FFmpeg Error:', err.message);
            reject('Error compressing the video.');
          })
          .run();
      } else {
        resolve('');
      }
    });

    let country;

    const nationality = req.body.nationality.toLowerCase();

    if (nationality === 'myanmar') {
        country = 'MN';
    } else if (nationality === 'nepal') {
        country = 'NP';
    } else if (nationality === 'sri lanka') {
        country = 'SL';
    } else if (nationality === 'india') {
        country = 'IN';
    } else {
        country = 'GL';
    }
    
    if (!country) {
      return res.status(400).json({ error: 'Invalid country' });
    }

    const maidCode = await generateUniqueCode(country);

    
    const experienceYears = req.body.experienceYears;
    const experienceCountry = req.body.experienceCountry;

    let experience;

    if (!experienceYears || !experienceCountry) {
      experience = `New`
    }else{
      experience = `${experienceYears} from ${experienceCountry}`;
    }

    const maidNationality = (req.body.nationality === 'Other') ? req.body.otherNationality : req.body.nationality;
    const maidReligion = (req.body.religion === 'Other') ? req.body.otherReligion : req.body.religion;
    const allLanguages = Array.isArray(req.body.languages)
    ? req.body.languages.includes('Other')
      ? [...req.body.languages.filter(lang => lang !== 'Other'), req.body.otherLanguages].join(', ')
      : req.body.languages.join(', ')
    : '';
      const videoCompressionResult = await compressVideo;

      const newMaid = new Maid({
        code: maidCode,
        name: req.body.name,
        nationality:maidNationality,
        position:req.body.position,
        salery:req.body.salery,
        price:req.body.price,
        religion:maidReligion,
        maritalStatus:req.body.maritalStatus,
        childrens:req.body.childrens,
        age:req.body.age,
        appliedFor:req.body.appliedFor,
        experience:experience,
        education:req.body.education,
        languages:allLanguages,
        contractPeriod:req.body.contractPeriod,
        remarks:req.body.remarks,
        maidImg: compressedImagePaths[0] || '',
        maidImg2: compressedImagePaths[1] || '',
        maidImg3: compressedImagePaths[2] || '',
        maidImg4: compressedImagePaths[3] || '',
        videoLink: videoCompressionResult || ''
      });
      const savedMaid = await newMaid.save();
  
      res.redirect("/")
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'An error occurred' });
    }
  
}


exports.updateMaid = async (req, res) => {
  try {
    const maidId = req.params.id;
    const updatedMaidData = req.body;
    const existingMaid = await Maid.findById(maidId);

    if (!existingMaid) {
      return res.status(404).json({ error: 'Maid not found' });
    }

    let imagePath;
    let compressedImagePath;
    if (req.file) {
      imagePath = req.file.path;
      const uniqueImageName = `${uuidv4()}_maidImg.webp`;
      compressedImagePath = `uploads/images/${uniqueImageName}`;

      try {
        const loadedImage = await jimp.read(imagePath);
        loadedImage.resize(500, jimp.AUTO);
        loadedImage.quality(50);

        await loadedImage.writeAsync(compressedImagePath);

        if (existingMaid.maidImg) {
          try {
            await fs.promises.unlink(path.join(__dirname, '..', existingMaid.maidImg));
          } catch (err) {
            console.error('Error deleting previous image:', err.message);
          }
        }

        try {
          await fs.promises.unlink(imagePath);
        } catch (err) {
          console.error('Error deleting original image:', err.message);
        }

        const updatedMaid = {
          ...updatedMaidData,
          maidImg: compressedImagePath,
        };

        const updatedMaidInstance = await Maid.findByIdAndUpdate(maidId, updatedMaid, { new: true });

        res.redirect("/");
      } catch (err) {
        console.error('Error compressing image:', err.message);
        res.status(500).json({ error: 'An error occurred while updating maid data.' });
      }
    } else {
      const updatedMaidInstance = await Maid.findByIdAndUpdate(maidId, updatedMaidData, { new: true });

      res.redirect("/");
    }
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
};

exports.deleteMaid = async (req, res) => {
  try {
    const maidId = req.params.id;
    const findMaidForDelete = await Maid.findById(maidId);

    const imagePaths = [
      findMaidForDelete.maidImg,
      findMaidForDelete.maidImg2,
      findMaidForDelete.maidImg3,
      findMaidForDelete.maidImg4,
      findMaidForDelete.videoLink
    ];

    for (const imagePath of imagePaths) {
      if (imagePath) {
        try {
          await fs.promises.unlink(path.join(__dirname, '..', imagePath));
        } catch (err) {
          console.error('Error deleting image:', err.message);
        }
      }
    }

    const deletedMaid = await Maid.findByIdAndDelete({ _id: maidId });
    if (!deletedMaid) {
      return res.status(404).json({ error: 'Maid not found' });
    }

    res.redirect("/");
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
};

// exports.getAllMaids = async (req, res) => {
//   try {
//     const { search, page = 1 } = req.query;

//     let query = {};

//     const maidCount = await Maid.countDocuments(query);

//     const perPage = maidCount > 0 ? maidCount : 15;

//     if (search) {
//       query = {
//         $or: [
//           { name: { $regex: search, $options: "i" } },
//           { code: { $regex: search, $options: "i" } },
//         ],
//       };
//     }

//     const offset = (page - 1) * perPage;

//     const allMaids = await Maid.find(query)
//       .skip(offset)
//       .limit(Number(perPage));

//     const availableMaids = allMaids.filter((maid) => !maid.isHired);
//     res.status(200).json(availableMaids);
//   } catch (error) {
//     res.status(500).json({ error: 'An error occurred' });
//   }
// };


exports.getAllMaids = async (req, res) => {
  try {
    const {
      search,
      countries,
      languages,
      religions,
      experiences,
      page = 1,
      category,
    } = req.query;

    let query = {};

    const maidCount = await Maid.countDocuments(query);

    const perPage = maidCount > 0 ? maidCount : 15;

    if (category && category !== "All") {
      query.appliedFor = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { code: { $regex: search, $options: "i" } },
      ];
    }

    if (countries && countries.length > 0) {
      query.nationality = { $in: countries };
    }

    if (languages) {
      let individualLanguages = [];

      if (Array.isArray(languages)) {
        individualLanguages = languages
          .flatMap((lang) => lang.split(",").map((l) => l.trim()))
          .filter((lang) => lang !== "");
      } else if (typeof languages === "string") {
        individualLanguages = languages.split(",").map((l) => l.trim());
      }

      if (individualLanguages.includes("Other")) {
        query.languages = {
          $not: { $elemMatch: { $in: individualLanguages } },
        };
      } else {
        query.languages = { $elemMatch: { $in: individualLanguages } };
      }
    }

    if (religions && religions.length > 0) {
      if (religions.includes("Other")) {
        query.$or = [
          { religion: { $in: religions } },
          { religion: { $nin: religions } },
        ];
      } else {
        query.religion = { $in: religions };
      }
    }

    if (experiences && experiences.length > 0) {
      if (experiences.length === 1 && experiences[0] === "Experienced") {
        query.experience = { $regex: /^\d/ };
      } else if (experiences.length === 1 && experiences[0] === "New") {
        query.experience = { $eq: "New" };
      } else {
        query.experience = { $exists: true };
      }
    }

    const offset = (page - 1) * perPage;

    const allMaids = await Maid.find(query).skip(offset).limit(Number(perPage));

    const availableMaids = allMaids.filter(
      (maid) => !maid.isHired && !maid.isMonthlyHired && !maid.isOnTrial
    );
    res.status(200).json(availableMaids);
  } catch (error) {
    console.error("Error fetching maid profiles:", error);
    res.status(500).json({ error: "An error occurred" });
  }
};

exports.getMaid = async (req, res) =>{
    try {
        const maidId = req.params.id;
    
        const maid = await Maid.findById(maidId);
    
        if (!maid) {
          return res.status(404).json({ error: 'Maid not found' });
        }
    
        res.status(200).json(maid);
      } catch (error) {
        res.status(500).json({ error: 'An error occurred' });
      }
}

exports.updateMaidAvailablity = async (req, res) => {
  try {
      const maidId = req.params.id;
      const existingMaid = await Maid.findById(maidId);

      if (!existingMaid) {
          return res.status(404).json({ error: 'Maid not found' });
      }
      if(existingMaid.isHired){
        existingMaid.isHired = false;
      }else{
        existingMaid.isHired = true;
      }
      await existingMaid.save();

      res.redirect("/");
  } catch (error) {
      res.status(500).json({ error: 'An error occurred' });
  }
}

const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const inquirer = require("inquirer");
const sizeOf = require("image-size");

const RESIZED_DIR = path.resolve(__dirname, "output");

const locationChecker = (location) => {
    //Check it's a folder, and check it's a valid path
    let locationParsed;
    locationParsed = path.normalize(location.replace(/\"/g, ""));
    const stats = fs.statSync(locationParsed);
    return stats.isDirectory();
};

const resizeImage = async (imgInput) => {
    return sharp(path.join(imgInput.directoryLocation, imgInput.filename))
        .withMetadata()
        .resize({
            fit: sharp.fit.contain,
            [imgInput.longestDimension]: 1000,
        })
        .toFile(path.join(RESIZED_DIR, imgInput.filename));
};

const getAndFilterImages = (directoryLocation, ignoreList) => {
    return fs.readdirSync(directoryLocation).filter((image) => {
        const fileAttr = path.parse(image);
        //filtering out names in the ignore list and files that aren't jpg or png
        return (
            (fileAttr.ext.toLowerCase().includes("jpg") ||
                fileAttr.ext.toLowerCase().includes("jpeg") ||
                fileAttr.ext.toLowerCase().includes("png")) &&
            !ignoreList.some((ignoreItem) => fileAttr.name.toLowerCase().includes(ignoreItem))
        );
    });
};

async function mainApp() {
    console.log(
        "Image Resizer\n\nResizes images to have no greater dimension than 1200 px, excluding predetermined and user set exception files."
    );

    const menuAction = await inquirer.prompt([
        {
            type: "input",
            name: "directoryLocation",
            message:
                'Please enter the location of the folder containing images you wish to parse, or the course repo itself:\nEx: "C:\\MAMP\\htdocs\\baf3m_html\\assets\\img"\n',
            validate: function (inp) {
                return locationChecker(inp);
            },
        },
    ]);

    if (!fs.existsSync(RESIZED_DIR)) fs.mkdirSync(RESIZED_DIR);

    let directoryLocation = menuAction.directoryLocation;
    directoryLocation = directoryLocation.replace(/\"/g, ""); //removes quotation marks

    const ignoreList = ["mindson", "consolidation", "action", "learninggoals", "ilo"];

    directoryLocation = path.normalize(directoryLocation);
    // let imagesResized = [];
    let images = getAndFilterImages(directoryLocation, ignoreList);

    if (images.length < 2) {
        directoryLocation = path.join(directoryLocation, "assets", "img");
        if (fs.existsSync(directoryLocation)) {
            images = getAndFilterImages(directoryLocation, ignoreList);
        }
    }

    imagesToResize = images
        .map((image) => {
            let imgDimensions;
            try {
                imgDimensions = sizeOf(path.resolve(directoryLocation, image));
            } catch (err) {
                console.log("Error with image file", image, err);
                return null;
            }

            if (imgDimensions.width > 1200 || imgDimensions.height > 1200) {
                return {
                    directoryLocation,
                    filename: image,
                    longestDimension: imgDimensions.width > imgDimensions.height ? "width" : "height",
                    imgDimensions,
                };
            }

            return null;
        })
        .filter((image) => image !== null);

    if (imagesToResize.length === 0) {
        console.log("No images in need of resizing");
        return;
    }

    if (imagesToResize.length > 300){
        console.log("There are over 300 images to be resized, double check this is the correct directory and message me if it is please.")
        return
    }

    console.log(
        "Images to be resized: \n\n",
        imagesToResize.map((image) => ({ filename: image.filename, dimensions: image.imgDimensions }))
    );

    console.log("Resizing images");

    await Promise.all(imagesToResize.map((image) => resizeImage(image)));

    console.log("Images have been resized and placed in the output folder.  Drag them into the img folder within the course repo to replace the originals.");
}

mainApp();

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

async function mainApp() {
    console.log(
        "Image Resizer\n\nResizes images to have no greater dimension than 1200 px, excluding predetermined and user set exception files."
    );

    const menuAction = await inquirer.prompt([
        {
            type: "input",
            name: "directoryLocation",
            message:
                'Please enter the location of the folder containing images you wish to parse:\nEx: "C:\\MAMP\\htdocs\\baf3m_html\\assets\\img"\n',
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

    const images = fs.readdirSync(directoryLocation).filter((image) => {
        const fileAttr = path.parse(image);
        //filtering out names in the ignore list and files that aren't jpg or png
        return (
            (fileAttr.ext.toLowerCase().includes("jpg") ||
                fileAttr.ext.toLowerCase().includes("jpeg") ||
                fileAttr.ext.toLowerCase().includes("png")) &&
            !ignoreList.some((ignoreItem) => fileAttr.name.toLowerCase().includes(ignoreItem))
        );
    });

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
                    imgDimensions
                };
            }

            return null;
        })
        .filter((image) => image !== null);

    console.log("Images to be resized: \n\n", imagesToResize.map(image => ({filename: image.filename, dimensions: image.imgDimensions})))

    console.log("Resizing images")

    await Promise.all(imagesToResize.map(image => resizeImage(image)))

    console.log("Images have been resized")

}

mainApp();

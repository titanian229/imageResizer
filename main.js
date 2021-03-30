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
    let resizedImage = await sharp(path.join(imgInput.directoryLocation, imgInput.filename))
        .withMetadata()
        .resize({
            fit: sharp.fit.contain,
            [imgInput.longestDimension]: 1000,
        })
        .toFile(path.join(RESIZED_DIR, imgInput.filename));
};

async function mainApp() {
    console.log(
        "Image Resizer\n\nResizes images to have no greater dimension than 1000 px, excluding predetermined and user set exception files."
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

    if (!fs.existsSync(RESIZED_DIR)) fs.mkdirSync(RESIZED_DIR)

    let directoryLocation = menuAction.directoryLocation;
    directoryLocation = directoryLocation.replace(/\"/g, ""); //removes quotation marks
    // let fileLocation = 'C:\\MAMP\\htdocs\\baf3m_html\\lessons\\baf3m_u2la6.html';

    const ignoreList = ["mindson", "consolidation", "action", "learninggoals", "ilo"];

    directoryLocation = path.normalize(directoryLocation);
    let imagesResized = [];

    fs.readdir(directoryLocation,   (err, files) => {
        if (err) {
            return console.log("Unable to scan directory: " + err);
        }

        files.forEach((filename) => {
            // console.log(file);

            const fileAttr = path.parse(filename);
            //checking jpg
            if (
                !fileAttr.ext.toLowerCase().includes("jpg") &&
                !fileAttr.ext.toLowerCase().includes("jpeg") &&
                !fileAttr.ext.toLowerCase().includes("png")
            ) {
                // console.log("File is not a jpg", file);
                return;
            }

            //checking ignore list
            if (ignoreList.some((ignoreItem) => fileAttr.name.toLowerCase().includes(ignoreItem))) {
                // console.log("Item to be ignored found", file);
                return;
            }

            //Checking dimensions
            let imgDimensions;
            try {
                imgDimensions = sizeOf(path.resolve(directoryLocation, filename));
                console.log(imgDimensions);
            } catch (err) {
                console.log("Error with image file", filename, err);
                return;
            }

            if (imgDimensions.width > 2000 || imgDimensions.length > 2000) {
                //image to be resized
                console.log("Resizing image", filename);
                imagesResized.push(filename);

                await resizeImage({
                    directoryLocation,
                    filename,
                    longestDimension: imgDimensions.width > imgDimensions.length ? "width" : "length",
                });
            }
        });
    });

    // // Final confirmation
    // const finalConfirm = await inquirer.prompt({
    //     type: "confirm",
    //     name: "confirmation",
    //     message: "Confirm overwriting your file?",
    // });

    // if (!finalConfirm.confirmation) {
    //     return;
    // }

    // //Writing backup
    // if (!fs.existsSync(BACKUP_DIR)) {
    //     fs.mkdirSync(BACKUP_DIR);
    // }directoryLocation
    // fs.copyFileSync(fileLocation, path.join(BACKUP_DIR, path.parse(directoryLocation).name + ".html"));
    // // fs.writeFileSync(path.join(BACKUP_DIR, path.parse(fileLocation).name + '.html'), fileContents.join('\n\r'));

    // fs.writeFileSync(fileLocation, newFileContents.join("\n"));

    console.log("IT HAS BEEN DONE.");
}

mainApp();

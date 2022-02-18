import usbDetect from "usb-detection";

import drivelist from "drivelist";


//usbDetect.stopMonitoring()
import fs from "fs";

import path from "path";

let usbList = [];

usbDetect.startMonitoring();

// Detect insert
usbDetect.on('add', () => {
    const poll = setInterval(() => {
        drivelist.list().then((drives) => {
            drives.forEach((drive) => {
                if (drive.isUSB) {
                    const mountPath = drive.mountpoints[0].path;
                    if (!usbList.includes(mountPath)) {
                        onAdd(mountPath); //op
                        usbList.push(mountPath);
                        clearInterval(poll)
                    }
                }
            })
        })
    }, 400)
});


// Detect remove
usbDetect.on('remove', () => {
    let newUsbList = []
    let removalList = []
    drivelist.list().then((drives) => {
        drives.forEach((drive) => {
            if (drive.isUSB) {
                newUsbList.push(drive.mountpoints[0].path);
            }
        })
        removalList = usbList.filter(x => !newUsbList.includes(x));
        usbList = usbList.filter(x => !removalList.includes(x))
        console.log(removalList) // op
    })
});

let total = 0;
let fails = [];

/**
 * Look ma, it's cp -R.
 * @param {string} src  The path to the thing to copy.
 * @param {string} dest The path to the new copy.
 * @param {number} maxFileSize If the file is bigger than this (given in MBs), don't copy.
 */
function copyRecursiveSync(src, dest, maxFileSize) {
    const exists = fs.existsSync(src);
    if (!exists) return;

    const stats = exists && fs.statSync(src);
    const isDirectory = exists && stats.isDirectory();

    if (isDirectory) {
        try {
            fs.mkdirSync(dest);
        } catch (e) {
        }

        fs.readdirSync(src).forEach(childItemName => {
            copyRecursiveSync(
                path.join(src, childItemName), // from
                path.join(dest, childItemName), // to
                maxFileSize);
        });

    } else {

        if (stats.size <= 1024 * 1024 * maxFileSize) {
            //console.log(src, stats.size);
            console.log(total)
            try {
                fs.copyFileSync(src, dest);
                total += stats.size;
            } catch (e){
                fails.push({src,dest});
            }
        }

    }
}


function getNiceDate() {
    const d = new Date();
    return (d.getFullYear()) + "-" + d.getMonth().toString().padStart(2, '0') + "-" + d.getDay().toString().padStart(2, '0') + " " + d.getHours().toString().padStart(2, '0') + "-" + d.getMinutes().toString().padStart(2, '0')
}

function tryFailsAgain() {
    console.error("fails:", fails);
    if(!fails.length) return;

    console.log("Retrying...");
    let newFails = [];
    for (let fail of fails) {
        try{
            fs.copyFileSync(fail.src, fail.dest);
        } catch(e){
            newFails.push(fail);
        }
    }

    fails = newFails;

    if(fails.length){
        setTimeout(tryFailsAgain, 1000);
    }
}

async function onAdd(mountPath) {
    console.log("Backing up files from " + mountPath);
    copyRecursiveSync(mountPath, "./dest-" + getNiceDate() + "/", 50)
    console.log("\n\nAutomatic backup finished. Backup size: " + Math.round(total / 1024 / 1024*100)/100 + "MBs");

    tryFailsAgain();
}


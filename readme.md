# Pendrive Auto Backup
When you run this program, it constantly searches for connected pendrives and copies their content into a new folder inside the folder you ran the program. It can be a handy solution to back up your pendrive's files regularly.

Side note: don't use it to steal data from others' pendrives!

## Building
In order to build this project, you need to install node-gyp with python and MSVS C++ compilers. See: https://www.npmjs.com/package/node-gyp

After that, you should be ok with an `npm i` 

You can create an exe file containing the nodejs runtime using [nexe](https://github.com/nexe/nexe).
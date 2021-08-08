#!/usr/bin/env node
import chalAnimation from "chalk-animation";
import { exec } from "child_process";
import fs, { appendFileSync, rmdirSync, unlinkSync } from "fs";
import inquirer from "inquirer";
import { join } from "path";
import { promisify } from "util";

const rainbow = chalAnimation.rainbow("VAM Digital `°m~", 2);
const defaultFolderName = "my-app";
const initWorkingDirectory = process.cwd();
let folderName = defaultFolderName;
let isVSCode = false;
const repo = "https://github.com/vamdigital/create-vamreactapp.git";
const execPromise = promisify(exec);

console.log(
  "💿 Welcome to Create-VAM-ReactApp. Let's get you set up with a new project."
);

async function runShellCmd(command) {
  try {
    const { stdout, stderr } = await execPromise(command);
    console.log(stdout);
    console.log(stderr);
  } catch (err) {
    console.error(err);
  }
}

async function setup() {
  const folderPath = join(initWorkingDirectory, folderName);
  try {
    await runShellCmd(`git clone --depth 1 ${repo} ${folderName}`);
    process.chdir(folderPath);
    rainbow.start();

    // Remove items from Package.json files
    fs.readFile(`${folderPath}/package.json`, "utf8", function (err, data) {
      if (err) {
        return console.log(err);
      }
      let result = data.toString();
      result = JSON.parse(result);

      // remove type / repository / bin / dependencies
      delete result["type"];
      delete result["repository"];
      delete result["bin"];
      delete result["dependencies"]["chalk-animation"];
      delete result["dependencies"]["inquirer"];

      //Change Items
      result["name"] = folderName;
      result["description"] = "";
      result["version"] = "0.1.0";

      // stringify back
      result = JSON.stringify(result);

      // write back to the file
      fs.writeFile(
        `${folderPath}/package.json`,
        result,
        "utf8",
        function (error) {
          if (error) return console.log(error);
        }
      );
    });

    setTimeout(() => {
      console.log();
      console.log(`installing dependencies, please wait...`);
    }, 1500);
    await runShellCmd(`npm i`);

    console.log(`dependencies installed successfully!`);

    // Changing the instance of starter to folderName
    console.log("Updating references....");
    await runShellCmd(
      `git grep -lz starter | xargs -0 sed -i '' -e 's/starter/${folderName}/gi'`
    );

    await runShellCmd(`npx rimraf ./.git`);

    appendFileSync(".gitignore", "\r\ndist", "utf8");
    appendFileSync(".gitignore", "\r\n.env", "utf8");

    /** remove extra files and folders from disk. we don't need it anymore */
    unlinkSync(join(process.cwd(), "README.md"));
    unlinkSync(join(process.cwd(), "bin", "setup.js"));
    rmdirSync(join(process.cwd(), "bin"));
    rmdirSync(join(process.cwd(), "NOTES.md"));

    /** Changing the title of the page from Starter to folderName */
    const indexFilePath = `${folderPath}/${folderName}/public/index.html`;
    fs.readFile(indexFilePath, "utf-8", function (readFileError, data) {
      if (readFileError) console.log(readFileError);
      let newValue = data.replace(/Starter/gi, `${folderName}`);

      fs.writeFile(
        indexFilePath,
        newValue,
        "utf-8",
        function (writeFileError, _data) {
          if (writeFileError) console.log(writeFileError);
          console.log("Title changed");
        }
      );
    });

    await runShellCmd(`git init && git add . && git commit -am "init commit"`);
    console.log(`new git repo initialized successfully!`);

    // Rename commitlint file
    fs.rename(
      "./commitlint.config.cjs",
      "./commitlint.config.js",
      (renameErr) => {
        if (renameErr) console.log(renameErr);
      }
    );
    console.log("Renamed commitLint config file 🗂");

    //Append to pre-commit file
    fs.appendFile("./.husky/pre-commit", "npm test", (fileAppendErr) => {
      if (fileAppendErr) console.log(fileAppendErr);
    });
    console.log("Append npm test to the file ✍️");

    await runShellCmd(
      `git init && git add . && git commit -am "change reference of imports"`
    );
    console.log(`git committed successfully!`);

    console.log(`Commands to run the project:`);
    console.log();
    console.log(`cd ${folderName}`);
    console.log();
    console.log(`npm start`);
    console.log();
    console.log(`Happy Hacking! 🚀`);
    if (isVSCode) {
      console.log(`starting vscode...`);
      runShellCmd(`code ${folderPath}`);
    }
  } catch (error) {
    console.log(error);
  }
}

/** Prompter using inquirer to set the Project name */
function prompter() {
  inquirer
    .prompt([
      {
        name: "projectName",
        message: "What is the name of your project?",
      },
      {
        type: "confirm",
        name: "isVSCode",
        message: "Do you want cli to open this Project in VSCode?",
      },
    ])
    .then((answers) => {
      folderName = answers.projectName;
      isVSCode = answers.isVSCode;
      setup();
    });
}

prompter();

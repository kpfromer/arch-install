import { execShellCommand } from "./shell";
import { createObjectCsvWriter } from "csv-writer";
import { getOfficialMetadata, getAurMetadata, installYay } from "./arch";

import { DepRow } from "./types";
import chalk from "chalk";
import { readCsv } from "./csv";
import { existsSync } from "fs";
import Gauge from "gauge";
import inquirer from "inquirer";
import * as path from "path";

/**
 * Grabs all the installed aur and regular arch packages and saves the as a csv file.
 * @param path the file output path to store the csv contents
 * @param aur the aur package management program name (yay)
 */
export async function exportInstallPackages(
  path: string,
  aur: string,
  grabMetadata: boolean
): Promise<void> {
  // query for explicitly installed packages from user
  const packages = await execShellCommand(`${aur} -Qe`);
  const names = packages
    .split("\n")
    .map((line) => line.split(" ")[0])
    .filter((line) => line.length > 0);

  const csvWriter = createObjectCsvWriter({
    path,
    header: [
      { id: "type", title: "type" },
      { id: "name", title: "name" },
      { id: "description", title: "description" },
    ],
  });

  let rows: DepRow[] = [];
  for (const name of names) {
    console.log(name);
    if (grabMetadata) {
      const official = await getOfficialMetadata(name);
      if (!!official) {
        rows.push({ type: "", name, description: official.pkgdesc });
        continue;
      }
      const aur = await getAurMetadata(name);
      if (!!aur) {
        rows.push({ type: "A", name, description: aur.Description });
        continue;
      }
    }
    rows.push({ type: "", name, description: "" });
  }

  await csvWriter.writeRecords(rows);
}

async function commandExists(command: string): Promise<boolean> {
  const response = await execShellCommand(`command -v ${command}`);
  return !!response;
}

/**
 * Installs packages from csv file
 * @param path the path to the csv file to install packages from
 * @param aur the aur package management program name (yay)
 */
export async function downloadPackages(
  path: string,
  aur: string,
  username?: string
): Promise<void> {
  if (!(await commandExists(aur))) {
    console.warn(`"${aur}" is not installed. Installing yay.`);
    await installYay(username);
    aur = "yay";
  }

  const rows = await readCsv<DepRow>(path, {
    headers: true,
    ignoreEmpty: true,
    comment: "#",
  });

  const gauge = new Gauge();
  gauge.show("Starting Installation.", 0);
  let count = 0;

  for (let { type, name, description } of rows) {
    gauge.show(
      `Installing "${chalk.blue(name)}"` +
        (!!description ? ` (${chalk.green(description)})` : ""),
      count / rows.length
    );
    await execShellCommand(
      `${type === "A" ? aur : "sudo pacman"} -S --noconfirm ${name}`,
      username
    );
    count++;
  }
}

export async function enableService(service: string): Promise<void> {
  console.log(`Enabling "${service}" service.`);
  await execShellCommand(
    `systemctl enable ${service}; systemctl start ${service}`
  );
}

/**
 * Does a full system install (as I Kyle Pfromer like it.) The command assumes
 * that you are running as super user (since we will be creating a user).
 * @param services the services to enable
 */
export async function fullInstall(path: string, services: string[] = []) {
  console.log("Welcome to Kyle Pfromer's arch install!");
  const { username, password, csvFile, install } = await inquirer.prompt<{
    username: string;
    password: string;
    csvFile: string;
    install: boolean;
  }>([
    {
      name: "username",
      type: "input",
      message: "New user's name?",
      validate: (username) => {
        if (username.length === 0) return "The username can not be empty";
        return true;
      },
    },
    {
      name: "password",
      type: "password",
      message: "User password?",
    },
    {
      name: "confirmPassword",
      type: "password",
      message: "Confirm password?",
      validate: (confirmPassword, values) => {
        if (confirmPassword !== values?.password)
          return "Passwords do not match!";
        return true;
      },
    },
    // {
    //   name: 'csvFile',
    //   type: 'input',
    //   message: 'The csv to install packages from?',
    //   validate: (filename) => {
    //     if (!existsSync(path.join(process.cwd(), filename)))
    //       return 'That file does not exist!';
    //     return true;
    //   },
    //   filter: (filename) => {
    //     return path.join(process.cwd(), filename);
    //   }
    // },
    {
      name: "install",
      type: "confirm",
      message: "Ready to install?",
      default: false,
    },
  ]);

  if (install) {
    // create new user
    console.log("Starting Install.");
    await execShellCommand(
      `useradd ${username} -m -G wheel && ${username}:${password} | chpasswd`
    );
    // remove password requirement for user for install aur packages and yay
    await execShellCommand(
      `echo "%wheel ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers`
    );
    console.log("Enabling Services.");
    for (let service of services) await enableService(service);
    console.log("Installing prerequisite packages.");
    const packages = ["git"];
    for (const packageName of packages) {
      console.log(`Installing: "${packageName}"`);
      await execShellCommand(`pacman -S --noconfirm ${packageName}`);
    }
    console.log("Installing yay.");
    await installYay(username);

    console.log("Downloading Packages.");
    await downloadPackages(path, "yay", username);
    console.log("All done! You should reboot.");
  } else {
    console.warn("Not Installing!");
  }

  // archlinux-keyring refresh
  // update visudo (/etc/sudoers)
}

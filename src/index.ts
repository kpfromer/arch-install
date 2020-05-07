#!/usr/bin/env node
import * as path from "path";
import * as yargs from "yargs";
import {
  exportInstallPackages,
  downloadPackages,
  fullInstall,
} from "./commands";

// todo: get bundle size command
// todo: total size
// todo: chalk

// install packages
// systemctl enable file?
// install csv from url
// different csv versions?

const cwd = process.cwd();

yargs
  .command<{ file: string }>(
    "sync",
    "updates the aur flags for packages",
    (yargs) => {
      yargs.option("f", {
        alias: "file",
        demandCommand: true,
        default: "deps.csv",
        describe: "the csv file to update",
        type: "string",
      });
    },
    (argv) => {
      //todo
      console.warn("todo");
    }
  )
  .command<{ file: string; metadata: boolean }>(
    "export",
    "grabs currently installed packages and saves them to a csv",
    (yargs) => {
      yargs.option("f", {
        alias: "file",
        demandCommand: true,
        default: "deps.csv",
        describe: "the csv file to update",
        type: "string",
      });
      yargs.option("m", {
        alias: "metadata",
        demandCommand: true,
        default: false,
        describe: "grab description metadata",
        type: "boolean",
      });
    },
    async (argv) => {
      await exportInstallPackages(
        path.join(cwd, argv.file),
        "yay",
        argv.metadata
      );
    }
  )
  .command<{ file: string }>(
    "download",
    "downloads files from csv",
    (yargs) => {
      yargs.option("f", {
        alias: "file",
        demandCommand: true,
        default: "deps.csv",
        describe: "the csv file to update",
        type: "string",
      });
    },
    async (argv) => {
      await downloadPackages(path.resolve(cwd, argv.file), "yay");
    }
  )
  .command<{ file: string; services: string[] }>(
    "setup",
    "full system setup",
    (yargs) => {
      yargs.option("f", {
        alias: "file",
        demandCommand: true,
        default: "deps.csv",
        describe: "the csv file to update",
        type: "string",
      });
      yargs
        .array("services")
        .demandCommand()
        .default([])
        .describe({ services: "the services to enable" });
    },
    async (argv) => {
      try {
        await fullInstall(path.resolve(cwd, argv.file), argv.services);
      } catch (error) {
        console.error(`Something went wrong with the installation! "${error}"`);
      }
    }
  )
  .alias("h", "help")
  .help().argv;

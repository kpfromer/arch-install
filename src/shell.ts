import { exec } from "child_process";

/**
 * Executes a shell command and return it as a Promise.
 */
export function execShellCommand(cmd: string, user?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!!user) cmd = ` sudo -H -u ${user} bash -c '${cmd}'`;
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.warn(error);
      }
      resolve(stdout ? stdout : stderr);
    });
  });
}

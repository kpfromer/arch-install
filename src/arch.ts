import * as superagent from "superagent";
import { execShellCommand } from "./shell";
import { IOfficialResult, IMetaData, IAurResult } from "./types";

/**
 * Installs `yay` the aur installer.
 */
export async function installYay(username?: string) {
  return await execShellCommand(
    "cd /tmp && git clone https://aur.archlinux.org/yay.git && cd yay && makepkg -si --noconfirm",
    username
  );
}

/**
 * Gets metadata about package using arch's official api
 * @param packageName the name of the package to get official metadata about
 */
export async function getOfficialMetadata(
  packageName: string
): Promise<IOfficialResult | undefined> {
  const res = await superagent.get(
    `https://www.archlinux.org/packages/search/json/?name=${packageName}`
  );
  const { results } = JSON.parse(res.text) as IMetaData<IOfficialResult>;
  return results.find((result) => result.pkgname === packageName);
}

/**
 * Gets metadata about package using arch's AUR api
 * @param packageName the name of the package to get AUR metadata about
 */
export async function getAurMetadata(
  packageName: string
): Promise<IAurResult | undefined> {
  const res = await superagent.get(
    `https://aur.archlinux.org/rpc/?v=5&type=info&arg[]=${packageName}`
  );
  const { results } = JSON.parse(res.text) as IMetaData<IAurResult>;
  return results.find((result) => result.Name === packageName);
}

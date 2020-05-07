export interface DepRow {
  type: "" | "A";
  name: string;
  description: string;
}

export interface IOfficialResult {
  pkgname: string;
  pkgbase: string;
  repo: string;
  arch: string; // architecture
  pkgdesc: string;
  url: string;
}

export interface IAurResult {
  ID: number;
  Name: string;
  Version: string;
  Description: string;
  URL: string;
  NumVotes: number;
  Popularity: number;
}

export interface IMetaData<R> {
  version: number;
  type: string; // todo:
  resultcount: number;
  results: R[];
}

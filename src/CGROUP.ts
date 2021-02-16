import { spawn } from "child_process";
import { mkdir, readdir, readFile } from "fs/promises";
import { join, resolve as pathResolve } from "path";
import { exists } from "./Base/utils";
import { CORE } from "./Core/CORE";

const CGROUP_ROOT = process.env.CGROUP_ROOT || '/sys/fs/cgroup'

export class CGROUP extends CORE {
    /**
     * Get the cgroup of an existed process
     *
     * @param pid the pid of the process
     * @returns the path of the cgroup
     */
    static async GetCGROUP(pid: number): Promise<string> {
        return readFile(`/proc/${pid}/cgroup`, "utf-8").then((data) =>
            join(CGROUP_ROOT, data.split(":")[2].replace(/\n+$/, ""))
        );
    }

    /**
     * Mount cgroup v2 filesystem to specified directory and set `process.env.CGROUP_ROOT` to that directory.
     *
     * @param target the directory to mount cgroupfs.
     */
    static Mount(target: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const mount = spawn("mount", ["-t", "cgroup2", "none", target]);
            mount.stderr.pipe(process.stdout);
            mount.stdout.pipe(process.stdout);
            mount.on("exit", (code) => {
                if (code === 0) {
                    process.env.CGROUP_ROOT = pathResolve(target);
                    resolve(true);
                } else {
                    reject(`Mount process exited with code ${code}`);
                }
            });
        });
    }
    /**
     * Umount cgroup v2 filesystem mounted to `process.env.CGROUP_ROOT`.
     */
    static Umount(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (!process.env.CGROUP_ROOT)
                reject(`No CGROUP_ROOT envrionment variate specified.`);
            const umount = spawn("umount", [String(process.env.CGROUP_ROOT)]);
            umount.stderr.pipe(process.stdout);
            umount.stdout.pipe(process.stdout);
            umount.on("exit", (code) => {
                if (code === 0) {
                    delete process.env.CGROUP_ROOT;
                    resolve(true);
                } else {
                    reject(`Umount process exited with code ${code}`);
                }
            });
        });
    }

    /**
     * Create a Proc cgroup under cgroupfs root.
     *
     * @param name the name of the cgroup, this function will create an direcotry with this name under cgroupfs root.
     */
    static async Create(name: string): Promise<CGROUP> {
        const path = join(CGROUP_ROOT, name);
        if (await exists(path))
            throw new Error(`cgroup ${name} already exists under root cgroup.`);
        else {
            await mkdir(path);
            return new CGROUP(path);
        }
    }
    /**
     * Load an existed cgroup from specified path.
     *
     * @param path the path of the Proc cgroup.
     */
    static async Load(path: string): Promise<CGROUP> {
        if (await exists(path)) {
            return new CGROUP(path);
        } else throw new Error(`cgroup at ${path} does't exists.`);
    }
    
    /**
     * Get sub-cgroups from this subcgroup.
     */
    subCgroup(): Promise<CGROUP[]>;
    /**
     * Create a sub-cgroup under this cgroup and returns it's object
     *
     * @param name the directory name of the subcgroup
     */
    subCgroup(name: string): Promise<CGROUP>;
    async subCgroup(name?: string): Promise<CGROUP | CGROUP[]> {
        if (name) {
            const subCgroupPath = join(this.CGROUP_PATH, name);
            await mkdir(subCgroupPath);
            return new CGROUP(subCgroupPath);
        } else {
            return readdir(this.CGROUP_PATH, { withFileTypes: true }).then(
                (dirents) => {
                    const subCgroups: CGROUP[] = [];
                    dirents.forEach((dirent) => {
                        if (dirent.isDirectory())
                            subCgroups.push(new CGROUP(join(this.CGROUP_PATH, dirent.name)));
                    });
                    return subCgroups;
                }
            );
        }
    }
}

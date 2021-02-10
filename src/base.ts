import { readFile, writeFile } from "fs/promises"
import { join } from "path"

export abstract class BASE_CGROUP {
    readonly CGROUP_PATH: string
    constructor(path: string) {
        this.CGROUP_PATH = path
    }
    readInterface(interfaceName: string): Promise<string> {
        const path = join(this.CGROUP_PATH, interfaceName)
        return readFile(path, 'utf-8').then(
            data => data.replace(/\n+$/, '')
        )
    }
    writeInterface(interfaceName: string, data: string,): Promise<void[]> {
        const path = join(this.CGROUP_PATH, interfaceName)
        const lines = data.split('\n')
        return Promise.all(
            lines.map(line => writeFile(path, line, 'utf-8'))
        )
    }
}
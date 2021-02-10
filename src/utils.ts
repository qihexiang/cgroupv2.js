import { PathLike } from 'fs'
import { access } from 'fs/promises'

export function exists(path: PathLike, mode?: number | undefined): Promise<boolean> {
    return access(path, mode).then(() => true).catch(err => false)
}
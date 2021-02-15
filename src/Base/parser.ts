import { FlatKeyed, NestedKeyed } from "./types"

/**
 * Get values as an array from a New-line seperated interface file. 
 * 
 * @param data UTF-8 encoded text read from the file.
 * @returns Values as an array.
 */
export function newLinesParse(data: string): string[] {
    if (data == '') return []
    else return data.split('\n')
}

/**
 * Make values in an array translated to New-line seperated format.
 * 
 * @param items Values as an array.
 * @returns UTF-8 encoded text wrote to the file.
 */
export function newLinesify(items: string[]): string {
    if (items.length == 0) return ''
    else return items.join('\n')
}

/**
 * Get values as an array from a space seperated interface file.
 * 
 * @param data UTF-8 encoded text read from the file.
 * @returns Values as an array.
 */
export function spacesParse(data: string): string[] {
    if (data == '') return []
    else return data.split(' ')
}

/**
 * Make values in an array translated to space seperated format.
 *
 * @param items Values as an array.
 * @returns UTF-8 encoded text wrote to the file.
 */
export function spacesify(items: string[]): string {
    if (items.length == 0) return ''
    else return items.join(' ')
}

/**
 * Get values as an object from a flat keyed interface file.
 *
 * @param data UTF-8 encoded text read from the file.
 * @returns key-value pairs as an object.
 */
export function flatKeyedParser(data: string): FlatKeyed {
    if (data == '') return {}
    else {
        const lines = data.split('\n')
        const property: FlatKeyed = {}
        lines.forEach(line => {
            const [k, v] = line.split(' ')
            property[k] = v
        })
        return property
    }
}

/**
 * Make values in an property object translated to space seperated format.
 *
 * @param items Values as an array.
 * @returns UTF-8 encoded text wrote to the file.
 */
export function flatKeyedify(property: FlatKeyed): string {
    const keys = Object.keys(property)
    if (keys.length == 0) return ''
    else {
        const lines = keys.map(key => `${key} ${String(property[key])}`)
        return lines.join('\n')
    }
}

/**
 * Get values as an object from a Nested keyed interface file.
 *
 * @param data UTF-8 encoded text read from the file.
 * @returns key-value pairs as an object.
 */
export function NestedKeyedParse(data: string): NestedKeyed {
    if (data == '') return {}
    else {
        const lines = data.split('\n')
        const property: NestedKeyed = {}
        lines.forEach(line => {
            const [mainKey, ...subKV] = line.split(' ')
            property[mainKey] = {}
            subKV.forEach(kvPair => {
                const [subKey, value] = kvPair.split('=')
                property[mainKey][subKey] = value
            })
        })
        return property
    }
}

/**
 * Make values in an property object translated to Nested keyed format.
 *
 * @param items Values as an array.
 * @returns UTF-8 encoded text wrote to the file.
 */
export function NestedKeyedify(property: NestedKeyed): string {
    const mainKeys = Object.keys(property)
    if (mainKeys.length == 0) return ''
    else {
        return mainKeys.map(mainKey => {
            const subKeys = Object.keys(property[mainKey])
            return subKeys.map(subKey => `${subKey}=${property[mainKey][subKey]}`).join(' ')
        }).join('\n')
    }
}
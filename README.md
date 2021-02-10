# Control Group v2 Node.js binding

## How it works?

Control Group provides an filesystem API (cgroupfs) so that user can manage cgroups by file read-write operations. This Node.js binding simply using `readFile` and `writeFile` function from `fs/promises` module.

## Why using asynchronous API?

As cgroupfs is not a filesystem on disk but in fact a kernel interface, so there is no problem using synchrunous IO method. But I found it's more difficult using `readFileSync` and `writeFileSync` because I need to create more variate names.

## Is this a full-featured library?

No, it's too difficult. But you can use `writeInterface(interfaceName, writeContent)` and `readInterface(interfaceName)` method to write and read raw info from cgroup interface files, if you need to transfrom them to JavaScript objects or arrays, using functions from this module:

- New-line seperated files:
    - `newLinesParse`
    - `newLinesify`
- Space seperated files:
    - `spacesParse`
    - `spacesify`
- Flat keyed files:
    - `flatKeyedParse`
    - `flatKeyedify`
- Nested keyed files:
    - `nestedKeyedParse`
    - `nestedKeyedify`

For example, you can create a cgroup and move current node instance into it, and then get cpu pressure info like this:

```js
import { ProcCGROUP, parser } from 'cgroupv2'

(async function main() {
    const cgroup = await ProcCGROUP.Create('pcgroup')
    await cgroup.procs([process.pid])
    cgroup.readInterface('cpu.pressure')
        .then(parser.NestedKeyedParse)
        .then(console.log)
})().catch(console.error)
```
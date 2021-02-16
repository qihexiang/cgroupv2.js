# Control Group v2 Node.js binding

[API Docs](https://qihexiang.github.io/cgroupv2.js/)

## How it works?

Control Group provides an filesystem API (cgroupfs) so that user can manage cgroups by file read-write operations. This Node.js binding simply using `readFile` and `writeFile` function from `fs/promises` module.

## Why using asynchronous API?

As cgroupfs is not a filesystem on disk but in fact a kernel interface, there is no problem using synchronous IO method because of performance. But I found it's more difficult using `readFileSync` and `writeFileSync` and provide synchronous API because I need to create more variate names.

## Example

Some features has finished and you can use theme by class FullFeatured.

```js
import cluster from "cluster";
import http from "http";
import { FullFeatured as CGROUP } from "cgroupv2";

const instaces = 4;

(async function main() {
  if (cluster.isMaster) {
    const [cgroup, originCG] = await Promise.all([
      CGROUP.Create("ffcgroup"),
      CGROUP.Load(await CGROUP.GetCGROUP(process.pid)),
    ]);
    // Move master process to target cgroup
    await cgroup.procs(process.pid).then((pids) => {
      // Fork workers in new cgroup
      for (let i = 0; i < instaces; i++) {
        cluster.fork();
      }
      return pids;
    });
    // Move master process back to original cgroup
    await originCG.procs(process.pid);

    // Get info from cgroup
    Promise.all([
      cgroup.type(),
      cgroup.controllers(),
      cgroup.procs(),
      cgroup.stat(),
    ]).then((results) => console.log(results));

    setTimeout(() => {
      // freeze the cgroup after 10 seconds
      cgroup.freeze(1);
    }, 10000);

    setTimeout(() => {
      // thaw the cgroup after 30 seconds
      cgroup.freeze(0);
    }, 30000);

    cluster.on("exit", (worker, code, signal) => {
      console.log(`worker ${worker.process.pid} died`);
    });
    console.log(await CGROUP.GetCGROUP(process.pid));
  } else {
    console.log(await CGROUP.GetCGROUP(process.pid));

    // Workers can share any TCP connection
    // In this case it is an HTTP server
    http
      .createServer((req, res) => {
        res.writeHead(200);
        res.end("hello world\n");
      })
      .listen(8000);

    console.log(`Worker ${process.pid} started`);
  }
})().catch(console.error);
```

## Is this a full-featured library?

No, it's too difficult and I don't have enough time. But you can use `writeInterface(interfaceName, writeContent)` and `readInterface(interfaceName)` methods to write and read raw info from cgroup interface files, if you need to transfrom them to JavaScript objects or arrays, using functions from this module:

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
import { FullFeatured, parser } from "cgroupv2";

(async function main() {
  const cgroup = await FullFeatured.Create("pcgroup");
  await cgroup.procs(process.pid);
  cgroup
    .readInterface("cpu.pressure")
    .then(parser.NestedKeyedParse)
    .then(console.log);
})().catch(console.error);
```

## Todo List

Based on cgroup interface files:

### Core Interface

Filename|RW|Type|Function|Status
---|---|---|---|---
cgroup.type|rw|single-value|CGROUP.type|✔
cgroup.procs|rw|new-line|CGROUP.procs|✔
cgroup.threads|rw|new-line|CGROUP.threads|✔
cgroup.controllers|ro|new-line|CGROUP.controllers|✔
cgroup.subtree_control|rw|space-seprated|CGROUP.subtreeControl|✔
cgrou.events|ro|flat-keyed|CGROUP.events|✔
cgroup.max.descendants|rw|single-value|CGROUP.maxDescendants|✔
cgroup.max.depth|rw|single-value|CGROUP.maxDepth|✔
cgroup.stat|ro|flat-keyed|CGROUP.stat|✔
cgroup.freeze|rw|single-value|CGROUP.freeze|✔

### Controllers

#### CPU

Filename|RW|Type|Function|Status
---|---|---|---|---
cpu.stat|ro|flat-keyed|CPU.stat|✔
cpu.weight|rw|single-value|CPU.weight|
cpu.weight.nice|rw|single-value|CPU.weightNice|
cpu.max|rw|flat-keyed(two value) [Ref](https://www.kernel.org/doc/html/latest/admin-guide/cgroup-v2.html#cpu-interface-files)|CPU.max|
cpu.pressure|rw|nested-keyed|CPU.pressure|
cpu.uclamp.min|rw|single-value|CPU.uclampMin|
cpu.uclamp.max|rw|single-value|CPU.uclampMax|

#### Memory

#### IO

#### PID

#### Cpuset

#### Device

#### RDMA

#### HugeTLB

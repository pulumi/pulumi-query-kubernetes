// Copyright 2016-2019, Pulumi Corporation.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";
import { ResolvedResource } from "@pulumi/pulumi/queryable";
import * as kq from "@pulumi/query-kubernetes";
import * as rx from "rxjs";
import { filter, flatMap, map, toArray, window } from "rxjs/operators";

import * as chalk from "chalk";

// const podRegex: RegExp = RegExp(".+", "g");
const podRegex: RegExp = RegExp("test-logger", "g");

// --------------------------------------------------------------------------
// Get logs, tail.
// --------------------------------------------------------------------------

// Set namespace to retreive pods from.
const currNs = "default";

function podLogs(namespace: string, name: string) {
    const obs = new rx.Subject<string>();
    (async function() {
        for await (const line of kq.podLogs(namespace, name)) {
            obs.next(line);
        }
    })();
    return obs;
}

export const ktail = (
    ns: string | undefined,
    podRegex: RegExp
): rx.Observable<{
    name: string;
    logs: string[];
}> => {
    const pods = new rx.Subject<
        kq.WatchEvent<ResolvedResource<k8s.core.v1.Pod>>
    >();
    (async function() {
        for await (const pod of kq.watch("v1", "Pod")) {
            pods.next(pod);
        }
    })();

    return pods.pipe(
        flatMap(pod => {
            if (pod.object.metadata!.namespace !== ns) {
                return [];
            }

            // Ignore pod if it doesn't match the regex.
            if (!podRegex.test(pod.object.metadata.name)) {
                return [];
            }

            // Get a log stream if `--stream` was passed in, else just get the output of
            // the standard `logs` request.
            const logs = podLogs(
                pod.object.metadata.namespace,
                pod.object.metadata.name
            );

            // For each particular stream of logs, emit output in windowed intervals of
            // 1 second. This makes the logs slightly more contiguous, so that a bunch
            // of logs from one pod end up output together.
            return logs.pipe(
                filter(logs => logs != null),
                window(rx.timer(0, 1000)),
                flatMap(window =>
                    window.pipe(
                        toArray(),
                        flatMap(logs => (logs.length == 0 ? [] : [logs]))
                    )
                ),
                map(logs => {
                    return { name: pod.object.metadata.name, logs };
                })
            );
        })
    );
};

ktail(currNs, podRegex).forEach(({ name, logs }) => {
    console.log(`${chalk.default.green(name)}:`);
    logs.forEach(line => console.log(`${line}`));
});

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

import * as q from "@pulumi/query";
import * as kq from "@pulumi/query-kubernetes";
const jsondiff = require("jsondiffpatch");

//
// Select the example query from the commented-out list below.
//

namespaceReport();
// certSignReqStatus();
// distinctMySqlVersions();
// warningAndErrorEvents();
// lastTwoRevisions();
// namespacesWithNoQuota();

// Print a small report of each namespace.
function namespaceReport() {
    const report = kq.list("v1", "Namespace").map(async ns => {
        const pods = kq.list("v1", "Pod");
        const secrets = kq.list("v1", "Secret");
        const services = kq.list("v1", "Service");
        const configMaps = kq.list("v1", "ConfigMap");
        const pvcs = kq.list("v1", "PersistentVolumeClaim");

        const ps = await pods
            .filter(pod => pod.metadata!.namespace === ns.metadata!.name)
            .toArray();

        return {
            namespace: ns,
            pods: await pods.filter(pod => pod.metadata!.namespace === ns.metadata!.name).toArray(),
            secrets: await secrets
                .filter(secret => secret.metadata!.namespace === ns.metadata!.name)
                .toArray(),
            services: await services
                .filter(service => service.metadata!.namespace === ns.metadata!.name)
                .toArray(),
            configMaps: await configMaps
                .filter(configMap => configMap.metadata!.namespace === ns.metadata!.name)
                .toArray(),
            pvcs: await pvcs.filter(pvc => pvc.metadata!.namespace === ns.metadata!.name).toArray(),
        };
    });

    // Print small report.
    report.forEach(({ namespace, pods, secrets, services, configMaps, pvcs }) => {
        console.log(namespace.metadata.name);
        console.log(`  Pods:\t\t${pods.length}`);
        console.log(`  Secrets:\t${secrets.length}`);
        console.log(`  Services:\t${services.length}`);
        console.log(`  ConfigMaps:\t${configMaps.length}`);
        console.log(`  PVCs:\t\t${pvcs.length}`);
    });
}

// Print a small report of the status of all certificate signing requests.
function certSignReqStatus() {
    const csrs = kq
        .list("certificates.k8s.io/v1beta1", "CertificateSigningRequest")
        .map(csr => {
            // Get status of the CSR.
            const pending = {
                type: "Pending",
                message: "Pending",
                reason: "Pending",
                lastUpdateTime: {},
            };
            if (csr.status.conditions == null) {
                return { status: pending, request: csr };
            }

            const conditions = csr.status.conditions.filter(
                cond => cond.type === "Approved" || cond.type === "Denied",
            );

            return {
                status: conditions.length > 0 ? conditions[conditions.length - 1] : pending,
                request: csr,
            };
        })
        // Group CSRs by type (one of: `"Approved"`, `"Pending"`, or `"Denied"`).
        .groupBy(csr => csr.status.type);

    csrs.forEach(csrGroup => {
        console.log(csrGroup.key);
        csrGroup.forEach(({ request }) => {
            const usages = request.spec.usages.sort().join(", ");
            const groups = request.spec.groups.sort().join(", ");
            console.log(`\t${request.spec.username}\t[${usages}]\t[${groups}]`);
        });
    });
}

// Print the number of distinct MySQL versions running in your cluster.
function distinctMySqlVersions() {
    const mySqlVersions = kq
        .list("v1", "Pod")
        .flatMap(pod => pod.spec.containers)
        .map(container => container.image)
        .filter(imageName => imageName.includes("mysql"))
        .distinct();

    mySqlVersions.forEach(console.log);
}

// Print all warning and error events.
function warningAndErrorEvents() {
    const warningsAndErrors = kq
        .list("v1", "Event")
        .filter(e => e.type === "Warning" || e.type === "Error")
        .groupBy(e => e.involvedObject.kind);

    warningsAndErrors.forEach(events => {
        console.log(`kind: ${events.key}`);
        events.forEach(e =>
            console.log(
                `  ${e.type}\t(x${e.count})\t${e.involvedObject.name}\n    Message: ${e.message}`,
            ),
        );
    });
}

// Print the last two revisions of a deployment.
function lastTwoRevisions() {
    function getRevisionHistory(name: string) {
        return kq
            .list("extensions/v1beta1", "ReplicaSet")
            .filter(
                async rs =>
                    (await q
                        .from(rs.metadata!.ownerReferences || [])
                        .filter(oref => oref.name === name)
                        .count()) > 0,
            )
            .orderBy(rs => rs.metadata.annotations["deployment.kubernetes.io/revision"]);
    }

    const history = kq
        .list("apps/v1", "Deployment")
        .filter(d => d.metadata.name === "nginx")
        .flatMap(d =>
            getRevisionHistory(d.metadata!.name!)
                .reverse()
                .take(2)
                .toArray(),
        );

    history.forEach(rollout => {
        jsondiff.console.log(jsondiff.diff(rollout[0], rollout[1]));
    });
}

// Print namespaces with no resource quotas.
function namespacesWithNoQuota() {
    const noQuotas = kq.list("v1", "Namespace").filter(async () => {
        return (
            (await kq
                .list("v1", "ResourceQuota")
                // Retrieve only ResourceQuotas that (1) apply to this namespace, and (2)
                // specify hard limits on memory.
                .filter(rq => rq.spec.hard["limits.memory"] != null)
                .count()) === 0
        );
    });

    // Print.
    noQuotas.forEach(ns => console.log(ns.metadata.name));
}

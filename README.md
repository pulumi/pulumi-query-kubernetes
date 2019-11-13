[![Build Status](https://travis-ci.com/pulumi/pulumi-query-kubernetes.svg?token=eHg7Zp5zdDDJfTjY8ejq&branch=master)](https://travis-ci.com/pulumi/pulumi-query-kubernetes)
[![Slack](http://www.pulumi.com/images/docs/badges/slack.svg)](https://slack.pulumi.com)
[![NPM version](https://badge.fury.io/js/%40pulumi%2Fquery%2Fkubernetes.svg)](https://www.npmjs.com/package/@pulumi/query-kubernetes)
[![License](https://img.shields.io/github/license/pulumi/pulumi-query-kubernetes)](https://github.com/pulumi/pulumi-query-kubernetes/blob/master/LICENSE)

# Kubernetes SDK for Pulumi Query

A relational TypeScript SDK for querying Kubernetes resources in any cluster, either on-prem or in
any cloud.

Users write a program using the relational query SDK, and then run them with the `pulumi query`
subcommand of the [Pulumi CLI](https://www.pulumi.com/docs/reference/cli/). There are many
[examples][example]. This one finds all distinct versions of MySQL running in your cluster:

```typescript
import * as kq from "@pulumi/query-kubernetes";

// Find all distinct versions of MySQL running in your cluster.
const mySqlVersions = kq
    .list("v1", "Pod")
    .flatMap(pod => pod.spec.containers)
    .map(container => container.image)
    .filter(imageName => imageName.includes("mysql"))
    .distinct();

mySqlVersions.forEach(console.log);
```

`pulumi query` will inspect your local [kubeconfig] file for the active context, and run the query
programmatically against the resources in the cluster it points to.

## Use cases

**Operations:**
* Which applications are scheduled on nodes that report high memory pressure? (See
  [example][example].)
* What is the difference between the last two rollouts of a Deployment? (See [example][example].)
* Which applications are currently emitting logs that contain the text "ERROR:",
  and why?

**Security and Compliance:**
* Which Service Accounts have access to this Secret?
* Which CertificateSigningRequests were approved this week, and what are they
  being used for? (See [example][example].)

**Governance:**
* Which Services are publicly exposed to the Internet?
* How many distinct versions of the mysql container are running in all of my clusters? (See
  [example][example].)

## Requirements

* Pulumi CLI version > 1.5.0.

## Getting Started

The directory `sdk/nodejs/examples/list` contains many example queries.

```sh
cd sdk/nodejs/examples/list
yarn install
```

Now from that directory, you can run `pulumi query`. The default example prints
a simple report of all namespaces live in the cluster of your active `$KUBECONFIG` context.

```sh
PULUMI_DEBUG_COMMANDS=true pulumi query
```

Once you've done this, have a look at the `queries` directory, which contains many more interesting
sample queries which you can modify to your uses.


[kubeconfig]: https://kubernetes.io/docs/concepts/configuration/organize-cluster-access-kubeconfig/
[examples]: https://github.com/pulumi/pulumi-query-kubernetes/tree/master/examples/list
[example]: https://github.com/pulumi/pulumi-query-kubernetes/blob/master/examples/list/index.ts

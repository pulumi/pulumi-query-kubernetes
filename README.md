[![Build Status](https://travis-ci.com/pulumi/pulumi-query-kubernetes.svg?token=eHg7Zp5zdDDJfTjY8ejq&branch=master)](https://travis-ci.com/pulumi/pulumi-query-kubernetes)
[![Slack](http://www.pulumi.com/images/docs/badges/slack.svg)](https://slack.pulumi.com)
[![NPM version](https://badge.fury.io/js/%40pulumi%2Fquery%2Fkubernetes.svg)](https://www.npmjs.com/package/@pulumi/query-kubernetes)
[![License](https://img.shields.io/github/license/pulumi/pulumi-query-kubernetes)](https://github.com/pulumi/pulumi-query-kubernetes/blob/master/LICENSE)

# Kubernetes SDK for Pulumi Query

A Kubernetes SDK Pulumi CloudQuery. Users write a program using the relational query SDK, and then
run them with the `pulumi query` command. For example:

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

## Preqrequisites

Before you get started, be sure you have version > 1.5.0 of the Pulumi CLI. This has the newest and
most polished "query mode" bits.

## Getting Started

The directory `sdk/nodejs/examples` contains many example queries.

But, because this repository is private to the Pulumi npm org, it is inaccessible to ~all employees.
To get started, you'll need to build this repository from scratch:

```sh
git clone git@github.com:pulumi/pulumi-query-kubernetes.git
cd pulumi-query-kubernetes
make
```

Next, you'll want to link the examples against this build of `@pulumi/query-kubernetes`:

```sh
cd sdk/nodejs/examples/list
yarn install
yarn link @pulumi/query-kubernetes
```

Now from that directory, you can run `pulumi query`. The default example simply lists the existing
deployments.

```sh
PULUMI_DEBUG_COMMANDS=true pulumi query
```

Once you've done this, have a look at the `queries` directory, which contains many more interesting
sample queries which you can modify to your uses.

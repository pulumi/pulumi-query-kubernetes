PROJECT_NAME := pulumi-query-kubernetes
NODE_MODULE_NAME := @pulumi/query-kubernetes
include ../../build/common.mk

VERSION := $(shell ../../scripts/get-version)

export PATH := $(shell yarn bin 2>/dev/null):$(PATH)

TESTPARALLELISM := 10

build::
	yarn install
	rm -rf bin/
	tsc
	sed -e 's/\$${VERSION}/$(VERSION)/g' < package.json > bin/package.json
	cp ../../README.md ../../LICENSE bin/

lint::
	tslint -c tslint.json -p tsconfig.json

instanbul_tests::
	istanbul test --print none _mocha -- --timeout 15000 'bin/tests/**/*.spec.js'
	istanbul report text-summary
	istanbul report text

test_fast:: instanbul_tests

test_all:: instanbul_tests

PACK             := query-kubernetes
PACKDIR          := ..
PROJECT          := github.com/pulumi/pulumi-query-kubernetes

CODEGEN         := pulumi-gen-${PACK}
VERSION         ?= $(shell scripts/get-version)
KUBE_VERSION    ?= v1.16.0
SWAGGER_URL     ?= https://github.com/kubernetes/kubernetes/raw/${KUBE_VERSION}/api/openapi-spec/swagger.json
PROJ_ROOT       := $(shell dirname $(realpath $(lastword $(MAKEFILE_LIST))))
OPENAPI_DIR     := $(PROJ_ROOT)/gen/openapi-specs
OPENAPI_FILE    := ${OPENAPI_DIR}/swagger-${KUBE_VERSION}.json

VERSION_FLAGS   := -ldflags "-X github.com/pulumi/pulumi-kubernetes/pkg/version.Version=${VERSION}"

GO              ?= go
CURL            ?= curl

$(OPENAPI_FILE)::
	@mkdir -p $(OPENAPI_DIR)
	test -f $(OPENAPI_FILE) || $(CURL) -s -L $(SWAGGER_URL) > $(OPENAPI_FILE)

generate:: $(OPENAPI_FILE)
	$(GO) install $(VERSION_FLAGS) $(PROJECT)/internal/cmd/$(CODEGEN)
	for LANGUAGE in "nodejs" ; do \
		$(CODEGEN) $$LANGUAGE $(OPENAPI_FILE) $(PROJ_ROOT)/gen/$${LANGUAGE}-templates $(PACKDIR) || exit 3 ; \
	done

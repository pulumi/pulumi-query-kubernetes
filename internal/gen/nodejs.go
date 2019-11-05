// Copyright 2016-2018, Pulumi Corporation.
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

package gen

import (
	"fmt"

	"github.com/cbroglie/mustache"
)

// --------------------------------------------------------------------------

// Main interface.

// --------------------------------------------------------------------------

type GroupTS struct {
	Versions map[string]*VersionTS
	Index    string
}

type VersionTS struct {
	Kinds map[string]string
	Index string
}

// NodeJSClient will generate a Pulumi Kubernetes provider client SDK for nodejs.
func NodeJSClient(swagger map[string]interface{}, templateDir string,
) (indexts string, err error) {
	definitions := swagger["definitions"].(map[string]interface{})

	groupsSlice := createGroups(definitions, nodeJSInputs())
	groupsSlice = createGroups(definitions, nodeJSOutputs())
	groupsSlice = createGroups(definitions, nodeJSProvider())
	for _, group := range groupsSlice {
		groupTS := &GroupTS{}
		for _, version := range group.Versions() {
			if groupTS.Versions == nil {
				groupTS.Versions = make(map[string]*VersionTS)
			}
			versionTS := &VersionTS{}
			for _, kind := range version.Kinds() {
				if versionTS.Kinds == nil {
					versionTS.Kinds = make(map[string]string)
				}
				inputMap := map[string]interface{}{
					"Comment":                 kind.Comment(),
					"Group":                   group.Group(),
					"Kind":                    kind.Kind(),
					"Properties":              kind.Properties(),
					"RequiredInputProperties": kind.RequiredInputProperties(),
					"OptionalInputProperties": kind.OptionalInputProperties(),
					"AdditionalSecretOutputs": kind.AdditionalSecretOutputs(),
					"Aliases":                 kind.Aliases(),
					"URNAPIVersion":           kind.URNAPIVersion(),
					"Version":                 version.Version(),
					"PulumiComment":           kind.pulumiComment,
				}
				// Since mustache templates are logic-less, we have to add some extra variables
				// to selectively disable code generation for empty lists.
				additionalSecretOutputsPresent := len(kind.AdditionalSecretOutputs()) > 0
				aliasesPresent := len(kind.Aliases()) > 0
				inputMap["MergeOptsRequired"] = additionalSecretOutputsPresent || aliasesPresent
				inputMap["AdditionalSecretOutputsPresent"] = additionalSecretOutputsPresent
				inputMap["AliasesPresent"] = aliasesPresent
			}
		}
	}

	indexts, err = mustache.RenderFile(fmt.Sprintf("%s/index.ts.mustache", templateDir),
		map[string]interface{}{
			"Groups": groupsSlice,
		})
	if err != nil {
		return
	}

	return indexts, nil
}

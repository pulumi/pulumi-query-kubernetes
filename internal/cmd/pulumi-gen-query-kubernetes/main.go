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

package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"os"

	"github.com/pulumi/pulumi-query-kubernetes/internal/gen"
)

func main() {
	if len(os.Args) < 5 {
		log.Fatal("Usage: gen <language> <swagger-file> <template-dir> <out-dir>")
	}

	language := os.Args[1]

	swagger, err := ioutil.ReadFile(os.Args[2])
	if err != nil {
		panic(err)
	}

	data := map[string]interface{}{}
	err = json.Unmarshal(swagger, &data)
	if err != nil {
		panic(err)
	}

	templateDir := os.Args[3]
	outdir := fmt.Sprintf("%s/%s", os.Args[4], language)

	switch language {
	case "nodejs":
		writeNodeJSClient(data, outdir, templateDir)
	default:
		panic(fmt.Sprintf("Unrecognized language '%s'", language))
	}
}

func writeNodeJSClient(data map[string]interface{}, outdir, templateDir string) {
	indexts, err := gen.NodeJSClient(data, templateDir)
	if err != nil {
		panic(err)
	}

	err = os.MkdirAll(outdir, 0700)
	if err != nil {
		panic(err)
	}

	err = ioutil.WriteFile(fmt.Sprintf("%s/index.ts", outdir), []byte(indexts), 0777)
	if err != nil {
		panic(err)
	}

	fmt.Printf("%s/package.json\n", outdir)
	fmt.Println(err)
}
